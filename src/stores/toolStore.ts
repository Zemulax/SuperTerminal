import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { defaultToolAdapters } from "@/lib/mockData";
import type {
  ToolAdapterConfig,
  ToolAdapterId,
  ToolAdapterState,
  ToolCheckResult,
  ToolLaunchSpec,
  ToolStatus,
} from "@/lib/types";

const CONFIG_STORAGE_KEY = "superterminal.toolAdapterConfigs.v1";

type ToolState = {
  adapters: ToolAdapterState[];
  tools: ToolAdapterState[];
  activeToolId: ToolAdapterId;
  isCheckingAll: boolean;
  lastLaunchSpec?: ToolLaunchSpec;
  error?: string;
  setActiveTool: (toolId: ToolAdapterId) => void;
  checkTool: (adapterId: ToolAdapterId) => Promise<void>;
  checkAllTools: () => Promise<void>;
  updateToolConfig: (
    adapterId: ToolAdapterId,
    config: Partial<ToolAdapterConfig>,
  ) => void;
  resetToolConfig: (adapterId: ToolAdapterId) => void;
  buildLaunchSpec: (
    adapterId: ToolAdapterId,
    workingDirectory: string,
  ) => Promise<ToolLaunchSpec | undefined>;
  markToolStatus: (toolId: ToolAdapterId, status: ToolStatus) => void;
};

function loadConfigs(): Record<string, ToolAdapterConfig> {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveConfigs(adapters: ToolAdapterState[]) {
  const configs = Object.fromEntries(
    adapters.map((adapter) => [adapter.definition.id, adapter.config]),
  );
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(configs));
}

function initialAdapters(): ToolAdapterState[] {
  const configs = loadConfigs();

  return defaultToolAdapters.map((definition) => {
    const config: ToolAdapterConfig = configs[definition.id] ?? {
      adapterId: definition.id,
      enabled: true,
    };
    const resolvedCommand =
      config.commandOverride?.trim() || definition.defaultCommand;
    const needsSetup = definition.id === "generic" && !config.commandOverride?.trim();

    return {
      definition,
      config,
      status: needsSetup ? "needs_setup" : "not_checked",
      resolvedCommand,
      message: needsSetup
        ? "Generic CLI requires a command override before detection."
        : "Not checked yet.",
    };
  });
}

function mapCheckResult(result: ToolCheckResult): Pick<
  ToolAdapterState,
  "status" | "resolvedCommand" | "version" | "message" | "lastCheckedAt"
> {
  return {
    status: result.status,
    resolvedCommand: result.resolvedCommand,
    version: result.version,
    message: result.message,
    lastCheckedAt: new Date().toISOString(),
  };
}

const initialAdapterState = initialAdapters();

export const useToolStore = create<ToolState>((set, get) => ({
  adapters: initialAdapterState,
  tools: initialAdapterState,
  activeToolId: "codex",
  isCheckingAll: false,
  lastLaunchSpec: undefined,
  error: undefined,
  setActiveTool: (toolId) => set({ activeToolId: toolId }),
  checkTool: async (adapterId) => {
    const adapter = get().adapters.find(
      (candidate) => candidate.definition.id === adapterId,
    );

    if (!adapter) {
      set({ error: `Unknown adapter: ${adapterId}` });
      return;
    }

    if (
      adapter.definition.id === "generic" &&
      !adapter.config.commandOverride?.trim()
    ) {
      set((state) => {
        const adapters = state.adapters.map((candidate): ToolAdapterState =>
          candidate.definition.id === adapterId
            ? {
                ...candidate,
                status: "needs_setup",
                message: "Generic CLI requires a command override.",
              }
            : candidate,
        );
        return { adapters, tools: adapters };
      });
      return;
    }

    set((state) => {
      const adapters = state.adapters.map((candidate): ToolAdapterState =>
        candidate.definition.id === adapterId
          ? { ...candidate, status: "checking", message: "Checking command..." }
          : candidate,
      );
      return { adapters, tools: adapters, error: undefined };
    });

    try {
      const result = await invoke<ToolCheckResult>("check_tool", {
        request: {
          command: adapter.resolvedCommand,
          detectionArgs: adapter.definition.detectionArgs,
        },
      });
      set((state) => {
        const adapters = state.adapters.map((candidate): ToolAdapterState =>
          candidate.definition.id === adapterId
            ? {
                ...candidate,
                ...mapCheckResult(result),
              }
            : candidate,
        );
        return { adapters, tools: adapters };
      });
    } catch (error) {
      set((state) => {
        const adapters = state.adapters.map((candidate): ToolAdapterState =>
          candidate.definition.id === adapterId
            ? {
                ...candidate,
                status: "error",
                message: String(error),
                lastCheckedAt: new Date().toISOString(),
              }
            : candidate,
        );
        return { adapters, tools: adapters, error: String(error) };
      });
    }
  },
  checkAllTools: async () => {
    set({ isCheckingAll: true, error: undefined });

    for (const adapter of get().adapters) {
      await get().checkTool(adapter.definition.id);
    }

    set({ isCheckingAll: false });
  },
  updateToolConfig: (adapterId, configPatch) => {
    set((state) => {
      const adapters = state.adapters.map((adapter): ToolAdapterState => {
        if (adapter.definition.id !== adapterId) {
          return adapter;
        }

        const config: ToolAdapterConfig = {
          ...adapter.config,
          ...configPatch,
          adapterId,
        };
        const resolvedCommand =
          config.commandOverride?.trim() || adapter.definition.defaultCommand;
        const needsSetup =
          adapter.definition.id === "generic" && !config.commandOverride?.trim();

        return {
          ...adapter,
          config,
          resolvedCommand,
          status: needsSetup ? "needs_setup" : "not_checked",
          version: undefined,
          message: needsSetup
            ? "Generic CLI requires a command override."
            : "Configuration changed. Re-check this adapter.",
          lastCheckedAt: undefined,
        };
      });
      saveConfigs(adapters);
      return { adapters, tools: adapters };
    });
  },
  resetToolConfig: (adapterId) => {
    get().updateToolConfig(adapterId, {
      enabled: true,
      commandOverride: undefined,
    });
  },
  buildLaunchSpec: async (adapterId, workingDirectory) => {
    const adapter = get().adapters.find(
      (candidate) => candidate.definition.id === adapterId,
    );

    if (!adapter) {
      set({ error: `Unknown adapter: ${adapterId}` });
      return undefined;
    }

    if (adapter.status !== "ready") {
      set({ error: "Tool must be ready before building a launch spec." });
      return undefined;
    }

    try {
      const result = await invoke<Omit<ToolLaunchSpec, "adapterId" | "name">>(
        "build_tool_launch_spec",
        {
          request: {
            command: adapter.resolvedCommand,
            args: [],
            projectPath: workingDirectory,
          },
        },
      );
      const spec: ToolLaunchSpec = {
        adapterId,
        name: adapter.definition.name,
        ...result,
      };
      set({ lastLaunchSpec: spec, error: undefined });
      return spec;
    } catch (error) {
      set({ error: String(error) });
      return undefined;
    }
  },
  markToolStatus: (toolId, status) =>
    set((state) => {
      const adapters = state.adapters.map((adapter): ToolAdapterState =>
        adapter.definition.id === toolId ? { ...adapter, status } : adapter,
      );
      return { adapters, tools: adapters };
    }),
}));
