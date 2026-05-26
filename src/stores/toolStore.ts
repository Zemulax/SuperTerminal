import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { defaultToolAdapters } from "@/lib/mockData";
import { useSecretEnvStore } from "@/stores/secretEnvStore";
import type {
  AgentCategory,
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
const DEFAULT_ADDED_AGENT_IDS = new Set([
  "codex",
  "claude",
  "opencode",
  "openclaude",
  "grok",
]);

type ToolState = {
  adapters: ToolAdapterState[];
  tools: ToolAdapterState[];
  activeToolId: ToolAdapterId;
  launchProfilesByAdapterId: Record<string, ToolLaunchProfile>;
  searchQuery: string;
  selectedCategory: AgentCategory | "all";
  isCheckingAll: boolean;
  lastLaunchSpec?: ToolLaunchSpec;
  error?: string;
  setActiveTool: (toolId: ToolAdapterId) => void;
  setCatalogueSearchQuery: (query: string) => void;
  setCatalogueCategory: (category: AgentCategory | "all") => void;
  addAgentToSuperTerminal: (agentId: ToolAdapterId) => void;
  removeAgentFromSuperTerminal: (agentId: ToolAdapterId) => void;
  pinAgent: (agentId: ToolAdapterId) => void;
  unpinAgent: (agentId: ToolAdapterId) => void;
  isAgentAdded: (agentId: ToolAdapterId) => boolean;
  getPinnedAgents: () => ToolAdapterState[];
  getCatalogueFiltered: () => ToolAdapterState[];
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
    // Runtime state still works if localStorage is unavailable.
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
    // Runtime state still works if localStorage is unavailable.
  }
}

function isAdded(adapter: ToolAdapterState) {
  return Boolean(adapter.config.addedToSuperTerminal);
}

function addedTools(adapters: ToolAdapterState[]) {
  return adapters.filter(isAdded);
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
          ...defaultLaunchProfile(adapter.definition.id, adapter.resolvedCommand),
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
    const defaultAdded = DEFAULT_ADDED_AGENT_IDS.has(definition.id);
    const storedConfig = configs[definition.id];
    const config: ToolAdapterConfig = {
      ...storedConfig,
      adapterId: definition.id,
      enabled: storedConfig?.enabled ?? true,
      addedToSuperTerminal: storedConfig?.addedToSuperTerminal ?? defaultAdded,
      pinnedToRibbon: storedConfig?.pinnedToRibbon ?? defaultAdded,
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
        ? "Generic Custom Agent requires a command override before detection."
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
  tools: addedTools(initialAdapterState),
  activeToolId: addedTools(initialAdapterState)[0]?.definition.id ?? "codex",
  launchProfilesByAdapterId: initialProfileState,
  searchQuery: "",
  selectedCategory: "all",
  isCheckingAll: false,
  lastLaunchSpec: undefined,
  error: undefined,
  setActiveTool: (toolId) => set({ activeToolId: toolId }),
  setCatalogueSearchQuery: (query) => set({ searchQuery: query }),
  setCatalogueCategory: (category) => set({ selectedCategory: category }),
  addAgentToSuperTerminal: (agentId) => {
    set((state) => {
      const adapters = state.adapters.map((adapter): ToolAdapterState =>
        adapter.definition.id === agentId
          ? {
              ...adapter,
              config: {
                ...adapter.config,
                addedToSuperTerminal: true,
                pinnedToRibbon: true,
              },
            }
          : adapter,
      );
      saveConfigs(adapters);
      return { adapters, tools: addedTools(adapters), activeToolId: agentId };
    });
  },
  removeAgentFromSuperTerminal: (agentId) => {
    set((state) => {
      const adapters = state.adapters.map((adapter): ToolAdapterState =>
        adapter.definition.id === agentId
          ? {
              ...adapter,
              config: {
                ...adapter.config,
                addedToSuperTerminal: false,
                pinnedToRibbon: false,
              },
            }
          : adapter,
      );
      const tools = addedTools(adapters);
      const activeStillAdded = tools.some(
        (adapter) => adapter.definition.id === state.activeToolId,
      );
      saveConfigs(adapters);
      return {
        adapters,
        tools,
        activeToolId: activeStillAdded
          ? state.activeToolId
          : tools[0]?.definition.id ?? state.activeToolId,
      };
    });
  },
  pinAgent: (agentId) => {
    set((state) => {
      const adapters = state.adapters.map((adapter): ToolAdapterState =>
        adapter.definition.id === agentId
          ? {
              ...adapter,
              config: {
                ...adapter.config,
                addedToSuperTerminal: true,
                pinnedToRibbon: true,
              },
            }
          : adapter,
      );
      saveConfigs(adapters);
      return { adapters, tools: addedTools(adapters) };
    });
  },
  unpinAgent: (agentId) => {
    set((state) => {
      const adapters = state.adapters.map((adapter): ToolAdapterState =>
        adapter.definition.id === agentId
          ? {
              ...adapter,
              config: {
                ...adapter.config,
                pinnedToRibbon: false,
              },
            }
          : adapter,
      );
      saveConfigs(adapters);
      return { adapters, tools: addedTools(adapters) };
    });
  },
  isAgentAdded: (agentId) =>
    Boolean(
      get().adapters.find((adapter) => adapter.definition.id === agentId)?.config
        .addedToSuperTerminal,
    ),
  getPinnedAgents: () =>
    get().adapters.filter(
      (adapter) =>
        adapter.config.addedToSuperTerminal && adapter.config.pinnedToRibbon,
    ),
  getCatalogueFiltered: () => {
    const { adapters, searchQuery, selectedCategory } = get();
    const query = searchQuery.trim().toLowerCase();

    return adapters.filter((adapter) => {
      const categoryMatch =
        selectedCategory === "all" ||
        adapter.definition.category === selectedCategory;
      const searchable = [
        adapter.definition.name,
        adapter.definition.shortName,
        adapter.definition.description,
        adapter.definition.defaultCommand,
        ...(adapter.definition.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return categoryMatch && (!query || searchable.includes(query));
    });
  },
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
      set({ error: `Unknown agent: ${adapterId}` });
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
                message: "Generic Custom Agent requires a command override.",
              }
            : candidate,
        );
        return { adapters, tools: addedTools(adapters) };
      });
      return;
    }

    set((state) => {
      const adapters = state.adapters.map((candidate): ToolAdapterState =>
        candidate.definition.id === adapterId
          ? { ...candidate, status: "checking", message: "Checking command..." }
          : candidate,
      );
      return { adapters, tools: addedTools(adapters), error: undefined };
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
        return { adapters, tools: addedTools(adapters) };
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
        return { adapters, tools: addedTools(adapters), error: String(error) };
      });
    }
  },
  checkAllTools: async () => {
    set({ isCheckingAll: true, error: undefined });

    for (const adapter of get().tools) {
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
            ? "Generic Custom Agent requires a command override."
            : "Configuration changed. Re-check this agent.",
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
      return { adapters, tools: addedTools(adapters), launchProfilesByAdapterId };
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
      set({ error: `Unknown agent: ${adapterId}` });
      return undefined;
    }

    if (adapter.status !== "ready") {
      set({ error: "Agent must be ready before building a launch spec." });
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
      await useSecretEnvStore.getState().loadToolSecrets(adapterId);
      const environmentNames =
        useSecretEnvStore.getState().getEnabledSecretNames(adapterId);
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
        environmentNames,
        ...result,
        preview:
          environmentNames.length > 0
            ? `${result.preview}\n\nEnvironment:\n${environmentNames
                .map((name) => `${name}=********`)
                .join("\n")}`
            : result.preview,
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
      return { adapters, tools: addedTools(adapters) };
    }),
}));
