import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { buildContextPayload } from "@/lib/context/contextBuilder";
import { useProjectStore } from "@/stores/projectStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useToolStore } from "@/stores/toolStore";
import type {
  ContextInjectionMode,
  ContextInjectionRecord,
  ContextOptions,
  ContextPromptFileRecord,
} from "@/lib/types";

const defaultContextOptions: ContextOptions = {
  includeProjectSummary: true,
  includeFileTreeSummary: true,
  includeSelectedFileMetadata: true,
  includeSelectedFilePreview: false,
  includeUserTask: true,
  includeToolInformation: true,
  includeDefaultInstructions: true,
};

type ContextState = {
  userTask: string;
  contextOptions: ContextOptions;
  generatedContext: string;
  selectedInjectionMode: ContextInjectionMode;
  injectionHistory: ContextInjectionRecord[];
  isGenerating: boolean;
  isInjecting: boolean;
  error?: string;
  lastPromptFile?: ContextPromptFileRecord;
  setUserTask: (value: string) => void;
  updateContextOptions: (options: Partial<ContextOptions>) => void;
  setSelectedInjectionMode: (mode: ContextInjectionMode) => void;
  generateContext: () => string | undefined;
  copyContextToClipboard: () => Promise<void>;
  createPromptFile: () => Promise<ContextPromptFileRecord | undefined>;
  injectToActiveSession: (appendNewline?: boolean) => Promise<void>;
  launchAndInject: (
    launch: () => Promise<void>,
    delayMs?: number,
    appendNewline?: boolean,
  ) => Promise<void>;
  clearContext: () => void;
};

function activeToolInfo() {
  const toolState = useToolStore.getState();
  const adapter =
    toolState.adapters.find(
      (candidate) => candidate.definition.id === toolState.activeToolId,
    ) ?? toolState.adapters[0];
  return adapter;
}

function historyRecord(
  mode: ContextInjectionRecord["mode"],
  status: ContextInjectionRecord["status"],
  message: string,
  extra: Partial<ContextInjectionRecord> = {},
): ContextInjectionRecord {
  const tool = activeToolInfo();
  return {
    id: `context-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    toolId: tool?.definition.id ?? "none",
    toolName: tool?.definition.name ?? "No tool",
    mode,
    status,
    characterCount: useContextStore.getState().generatedContext.length,
    message,
    createdAt: new Date().toISOString(),
    ...extra,
  };
}

function addHistory(record: ContextInjectionRecord) {
  useContextStore.setState((state) => ({
    injectionHistory: [record, ...state.injectionHistory].slice(0, 20),
  }));
}

export const useContextStore = create<ContextState>((set, get) => ({
  userTask: "",
  contextOptions: defaultContextOptions,
  generatedContext: "",
  selectedInjectionMode: "manual",
  injectionHistory: [],
  isGenerating: false,
  isInjecting: false,
  error: undefined,
  lastPromptFile: undefined,
  setUserTask: (value) => set({ userTask: value }),
  updateContextOptions: (options) =>
    set((state) => ({
      contextOptions: {
        ...state.contextOptions,
        ...options,
      },
    })),
  setSelectedInjectionMode: (mode) => set({ selectedInjectionMode: mode }),
  generateContext: () => {
    const projectState = useProjectStore.getState();
    const tool = activeToolInfo();

    if (!projectState.selectedProject) {
      set({ error: "Open a project folder to generate project context." });
      return undefined;
    }

    set({ isGenerating: true, error: undefined });
    const context = buildContextPayload({
      project: projectState.selectedProject,
      selectedFile: projectState.selectedFile,
      filePreview: projectState.filePreview,
      previewError: projectState.previewError,
      tool,
      userTask: get().userTask,
      options: get().contextOptions,
    });
    set({ generatedContext: context, isGenerating: false });
    addHistory(historyRecord("manual", "prepared", "Context generated."));
    return context;
  },
  copyContextToClipboard: async () => {
    const context = get().generatedContext || get().generateContext();
    if (!context) {
      return;
    }

    try {
      await navigator.clipboard.writeText(context);
      addHistory(historyRecord("clipboard", "copied", "Context copied to clipboard."));
      set({ error: undefined });
    } catch (error) {
      const message = `Clipboard copy failed: ${String(error)}`;
      addHistory(historyRecord("clipboard", "failed", message));
      set({ error: message });
    }
  },
  createPromptFile: async () => {
    const context = get().generatedContext || get().generateContext();
    if (!context) {
      return undefined;
    }

    try {
      const project = useProjectStore.getState().selectedProject;
      const result = await invoke<ContextPromptFileRecord>(
        "create_context_prompt_file",
        {
          request: {
            content: context,
            fileNameHint: project?.name ?? "context",
          },
        },
      );
      addHistory(
        historyRecord("prompt_file", "file_created", "Prompt file created.", {
          promptFilePath: result.path,
        }),
      );
      set({ lastPromptFile: result, error: undefined });
      return result;
    } catch (error) {
      const message = `Prompt file creation failed: ${String(error)}`;
      addHistory(historyRecord("prompt_file", "failed", message));
      set({ error: message });
      return undefined;
    }
  },
  injectToActiveSession: async (appendNewline = true) => {
    const context = get().generatedContext || get().generateContext();
    if (!context) {
      return;
    }

    const session = useSessionStore.getState();
    if (!session.activeSessionId || session.sessionStatus !== "active") {
      const message = "Start a PTY session before injecting context via stdin.";
      addHistory(historyRecord("stdin", "failed", message));
      set({ error: message });
      return;
    }

    set({ isInjecting: true, error: undefined });
    try {
      await session.writePtyInput(appendNewline ? `${context}\r` : context);
      addHistory(
        historyRecord("stdin", "injected", "Context injected into active PTY session.", {
          sessionId: session.activeSessionId,
        }),
      );
      set({ isInjecting: false });
    } catch (error) {
      const message = `PTY injection failed: ${String(error)}`;
      addHistory(historyRecord("stdin", "failed", message));
      set({ isInjecting: false, error: message });
    }
  },
  launchAndInject: async (launch, delayMs = 1000, appendNewline = true) => {
    const context = get().generatedContext || get().generateContext();
    if (!context) {
      return;
    }

    set({ isInjecting: true, error: undefined });
    try {
      await launch();
      await new Promise((resolve) => window.setTimeout(resolve, delayMs));
      await get().injectToActiveSession(appendNewline);
      addHistory(
        historyRecord(
          "launch_and_inject",
          "injected",
          "Tool launched and context injected.",
        ),
      );
      set({ isInjecting: false });
    } catch (error) {
      const message = `Launch and inject failed: ${String(error)}`;
      addHistory(historyRecord("launch_and_inject", "failed", message));
      set({ isInjecting: false, error: message });
    }
  },
  clearContext: () =>
    set({
      generatedContext: "",
      error: undefined,
      lastPromptFile: undefined,
    }),
}));
