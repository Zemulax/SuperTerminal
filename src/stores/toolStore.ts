import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { defaultToolAdapters } from "@/lib/mockData";
import type {
  ToolAdapterConfig,
  ToolAdapterId,
  ToolAdapterState,
  ToolCheckResult,
  ToolLaunchProfile,
  ToolLaunchSpec,
  ToolStatus,
} from "@/lib/types";

const CONFIG_STORAGE_KEY = "superterminal.toolAdapterConfigs.v1";
const LAUNCH_PROFILE_STORAGE_KEY = "superterminal.toolLaunchProfiles.v1";

type ToolState = {
  adapters: ToolAdapterState[];
  tools: ToolAdapterState[];
  activeToolId: ToolAdapterId;
  launchProfilesByAdapterId: Record<string, ToolLaunchProfile>;
  isCheckingAll: boolean;
  lastLaunchSpec?: ToolLaunchSpec;
  error?: string;
  setActiveTool: (toolId: ToolAdapterId) => void;
  getLaunchProfile: (adapterId: ToolAdapterId) => ToolLaunchProfile;
  updateLaunchProfile: (
    adapterId: ToolAdapterId,
    profile: Partial<ToolLaunchProfile>,
  ) => void;
  resetLaunchProfile: (adapterId: ToolAdapterId) => void;
  checkTool: (adapterId: ToolAdapterId) => Promise<void>;
  checkAllTools: () => Promise<void>;
  updateToolConfig: (
    adapterId: ToolAdapterId,
    config: Partial<ToolAdapterConfig>,
  ) => void;
  resetToolConfig: (adapterId: ToolAdapterId) => void;
  buildLaunchSpec: (
    adapterId: ToolAdapterId,
    projectPath?: string,
  ) => Promise<ToolLaunchSpec | undefined>;
  markToolStatus: (toolId: ToolAdapterId, status: ToolStatus) => void;
};

function loadConfigs(): Record<string, ToolAdapterConfig> {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return {};
    }
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveConfigs(adapters: ToolAdapterState[]) {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    const configs = Object.fromEntries(
      adapters.map((adapter) => [adapter.definition.id, adapter.config]),
    );
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(configs));
  } catch {
    // Local storage can be unavailable in some WebView policies. Runtime state still works.
  }
}

function loadLaunchProfiles(): Record<string, ToolLaunchProfile> {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return {};
    }
    const raw = localStorage.getItem(LAUNCH_PROFILE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLaunchProfiles(profiles: Record<string, ToolLaunchProfile>) {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    localStorage.setItem(LAUNCH_PROFILE_STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    // Local storage can be unavailable in some WebView policies. Runtime state still works.
  }
}

function defaultLaunchProfile(
  adapterId: ToolAdapterId,
  command: string,
): ToolLaunchProfile {
  return {
    adapterId,
    command,
    args: [],
    rawArgs: "",
    launchMode: "pty",
    workingDirectoryMode: "project_root",
    customWorkingDirectory: undefined,
    confirmBeforeLaunch: true,
  };
}

function initialLaunchProfiles(adapters: ToolAdapterState[]) {
  const stored = loadLaunchProfiles();

  return Object.fromEntries(
    adapters.map((adapter) => {
      const existing = stored[adapter.definition.id];
      return [
        adapter.definition.id,
        {
          ...defaultLaunchProfile(
            adapter.definition.id,
            adapter.resolvedCommand,
          ),
          ...existing,
          adapterId: adapter.definition.id,
          command: adapter.resolvedCommand,
        },
      ];
    }),
  );
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

function parseRawArgs(rawArgs: string): { args: string[]; error?: string } {
  const args: string[] = [];
  let current = "";
  let quote: string | undefined;

  for (let index = 0; index < rawArgs.length; index += 1) {
    const character = rawArgs[index];

    if ((character === '"' || character === "'") && !quote) {
      quote = character;
      continue;
    }

    if (character === quote) {
      quote = undefined;
      continue;
    }

    if (/\s/.test(character) && !quote) {
      if (current) {
        args.push(current);
        current = "";
      }
      continue;
    }

    current += character;
  }

  if (quote) {
    return {
      args: [],
      error: "Launch args contain an unterminated quote.",
    };
  }

  if (current) {
    args.push(current);
  }

  return { args };
}

const initialAdapterState = initialAdapters();
const initialProfileState = initialLaunchProfiles(initialAdapterState);

export const useToolStore = create<ToolState>((set, get) => ({
  adapters: initialAdapterState,
  tools: initialAdapterState,
  activeToolId: "codex",
  launchProfilesByAdapterId: initialProfileState,
  isCheckingAll: false,
  lastLaunchSpec: undefined,
  error: undefined,
  setActiveTool: (toolId) => set({ activeToolId: toolId }),
  getLaunchProfile: (adapterId) => {
    const stored = get().launchProfilesByAdapterId[adapterId];
    if (stored) {
      return stored;
    }

    const adapter = get().adapters.find(
      (candidate) => candidate.definition.id === adapterId,
    );
    return defaultLaunchProfile(adapterId, adapter?.resolvedCommand ?? "");
  },
  updateLaunchProfile: (adapterId, profilePatch) => {
    set((state) => {
      const adapter = state.adapters.find(
        (candidate) => candidate.definition.id === adapterId,
      );
      const current =
        state.launchProfilesByAdapterId[adapterId] ??
        defaultLaunchProfile(adapterId, adapter?.resolvedCommand ?? "");
      const next: ToolLaunchProfile = {
        ...current,
        ...profilePatch,
        adapterId,
        command: adapter?.resolvedCommand ?? current.command,
      };

      if (profilePatch.rawArgs !== undefined) {
        const parsed = parseRawArgs(profilePatch.rawArgs);
        next.args = parsed.args;
      }

      const launchProfilesByAdapterId = {
        ...state.launchProfilesByAdapterId,
        [adapterId]: next,
      };
      saveLaunchProfiles(launchProfilesByAdapterId);
      return { launchProfilesByAdapterId };
    });
  },
  resetLaunchProfile: (adapterId) => {
    set((state) => {
      const adapter = state.adapters.find(
        (candidate) => candidate.definition.id === adapterId,
      );
      const launchProfilesByAdapterId = {
        ...state.launchProfilesByAdapterId,
        [adapterId]: defaultLaunchProfile(
          adapterId,
          adapter?.resolvedCommand ?? "",
        ),
      };
      saveLaunchProfiles(launchProfilesByAdapterId);
      return { launchProfilesByAdapterId };
    });
  },
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
      const updatedAdapter = adapters.find(
        (adapter) => adapter.definition.id === adapterId,
      );
      const currentProfile = state.launchProfilesByAdapterId[adapterId];
      const launchProfilesByAdapterId =
        updatedAdapter && currentProfile
          ? {
              ...state.launchProfilesByAdapterId,
              [adapterId]: {
                ...currentProfile,
                command: updatedAdapter.resolvedCommand,
              },
            }
          : state.launchProfilesByAdapterId;

      saveConfigs(adapters);
      saveLaunchProfiles(launchProfilesByAdapterId);
      return { adapters, tools: adapters, launchProfilesByAdapterId };
    });
  },
  resetToolConfig: (adapterId) => {
    get().updateToolConfig(adapterId, {
      enabled: true,
      commandOverride: undefined,
    });
  },
  buildLaunchSpec: async (adapterId, projectPath) => {
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

    const profile = get().getLaunchProfile(adapterId);
    const parsed = parseRawArgs(profile.rawArgs);

    if (parsed.error) {
      set({ error: parsed.error });
      return undefined;
    }

    let workingDirectory = projectPath;
    const warnings: string[] = [];

    if (profile.workingDirectoryMode === "home") {
      try {
        workingDirectory = await invoke<string>("get_home_directory");
      } catch (error) {
        set({ error: String(error) });
        return undefined;
      }
    }

    if (profile.workingDirectoryMode === "custom") {
      workingDirectory = profile.customWorkingDirectory?.trim();
      if (!workingDirectory) {
        set({ error: "Configure a custom working directory before launch." });
        return undefined;
      }
    }

    if (!workingDirectory) {
      set({ error: "Open a project folder before building a launch spec." });
      return undefined;
    }

    if (profile.launchMode === "manual") {
      warnings.push("Manual mode shows this command without starting a PTY.");
    }

    try {
      const result = await invoke<
        Omit<ToolLaunchSpec, "adapterId" | "name" | "launchMode" | "warnings">
      >("build_tool_launch_spec", {
        request: {
          command: adapter.resolvedCommand,
          args: parsed.args,
          projectPath: workingDirectory,
        },
      });
      const spec: ToolLaunchSpec = {
        adapterId,
        name: adapter.definition.name,
        launchMode: profile.launchMode,
        warnings,
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
