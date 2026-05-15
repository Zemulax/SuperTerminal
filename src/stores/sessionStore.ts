import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type {
  PtySessionRecord,
  TerminalMode,
  TerminalSession,
  TerminalSessionStatus,
} from "@/lib/types";

type SessionState = {
  activeSession?: TerminalSession;
  ptySession?: PtySessionRecord;
  sessionStatus: TerminalSessionStatus;
  mode: TerminalMode;
  activeSessionId?: string;
  inputBuffer: string;
  transcriptPreview: string[];
  error?: string;
  shell?: string;
  cols: number;
  rows: number;
  startPtySession: (
    projectPath: string,
    cols: number,
    rows: number,
    shell?: string,
    args?: string[],
  ) => Promise<PtySessionRecord | undefined>;
  writePtyInput: (data: string) => Promise<void>;
  resizePtySession: (cols: number, rows: number) => Promise<void>;
  stopPtySession: () => Promise<PtySessionRecord | undefined>;
  applyPtyOutput: (line: string) => void;
  handlePtyExit: (status: TerminalSessionStatus, exitCode?: number) => void;
  setStatus: (status: TerminalSessionStatus) => void;
  setError: (error?: string) => void;
  startDemoSession: (toolId: string, projectId?: string) => void;
  stopDemoSession: () => void;
  appendTranscript: (line: string) => void;
  clearTranscript: () => void;
  setInputBuffer: (value: string) => void;
  startMockSession: (toolId: string, projectId?: string) => void;
  stopMockSession: () => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionState>((set, get) => ({
  activeSession: undefined,
  ptySession: undefined,
  sessionStatus: "idle",
  mode: "pty",
  activeSessionId: undefined,
  inputBuffer: "",
  transcriptPreview: [],
  error: undefined,
  shell: undefined,
  cols: 80,
  rows: 24,
  startPtySession: async (projectPath, cols, rows, shell, args = []) => {
    if (get().sessionStatus === "starting" || get().sessionStatus === "active") {
      const message = "A terminal session is already active.";
      set({ error: message });
      throw new Error(message);
    }

    set({
      mode: "pty",
      sessionStatus: "starting",
      error: undefined,
      inputBuffer: "",
      cols,
      rows,
    });

    try {
      const session = await invoke<PtySessionRecord>("start_pty_session", {
        request: {
          projectPath,
          shell,
          args,
          cols,
          rows,
        },
      });
      set({
        ptySession: session,
        activeSessionId: session.id,
        activeSession: {
          id: session.id,
          status: "active",
          startedAt: session.startedAt,
        },
        sessionStatus: "active",
        shell: session.shell,
        cols: session.cols,
        rows: session.rows,
        error: undefined,
      });
      return session;
    } catch (error) {
      set({
        ptySession: undefined,
        activeSessionId: undefined,
        activeSession: undefined,
        sessionStatus: "failed",
        error: String(error),
      });
      throw error;
    }
  },
  writePtyInput: async (data) => {
    const sessionId = get().activeSessionId;

    if (!sessionId || get().mode !== "pty") {
      return;
    }

    try {
      await invoke("write_pty_input", {
        request: {
          sessionId,
          data,
        },
      });
    } catch (error) {
      set({ error: String(error), sessionStatus: "failed" });
      throw error;
    }
  },
  resizePtySession: async (cols, rows) => {
    set({ cols, rows });
    const sessionId = get().activeSessionId;

    if (!sessionId || get().mode !== "pty" || get().sessionStatus !== "active") {
      return;
    }

    try {
      await invoke("resize_pty_session", {
        request: {
          sessionId,
          cols,
          rows,
        },
      });
      set((state) => ({
        ptySession: state.ptySession
          ? {
              ...state.ptySession,
              cols,
              rows,
            }
          : undefined,
      }));
    } catch (error) {
      set({ error: String(error) });
    }
  },
  stopPtySession: async () => {
    const sessionId = get().activeSessionId;

    if (!sessionId || get().mode !== "pty") {
      set({ sessionStatus: "stopped" });
      return undefined;
    }

    try {
      const session = await invoke<PtySessionRecord>("stop_pty_session", {
        sessionId,
      });
      set({
        ptySession: session,
        activeSession: {
          id: session.id,
          status: "stopped",
          startedAt: session.startedAt,
          endedAt: session.endedAt,
        },
        activeSessionId: undefined,
        sessionStatus: "stopped",
        inputBuffer: "",
        error: undefined,
      });
      return session;
    } catch (error) {
      set({ error: String(error), sessionStatus: "failed" });
      throw error;
    }
  },
  applyPtyOutput: (line) => get().appendTranscript(line),
  handlePtyExit: (status, exitCode) =>
    set((state) => ({
      sessionStatus: status,
      activeSessionId: undefined,
      inputBuffer: "",
      ptySession: state.ptySession
        ? {
            ...state.ptySession,
            status,
            endedAt: new Date().toISOString(),
            exitCode,
          }
        : undefined,
      activeSession: state.activeSession
        ? {
            ...state.activeSession,
            status,
            endedAt: new Date().toISOString(),
          }
        : undefined,
    })),
  setStatus: (status) =>
    set((state) => ({
      sessionStatus: status,
      activeSession: state.activeSession
        ? {
            ...state.activeSession,
            status,
            endedAt:
              status === "stopped" || status === "failed" || status === "exited"
                ? new Date().toISOString()
                : state.activeSession.endedAt,
          }
        : undefined,
    })),
  setError: (error) =>
    set({
      error,
      sessionStatus: error ? "failed" : get().sessionStatus,
    }),
  startDemoSession: (toolId, projectId) => {
    const sessionId = `demo-${toolId}-${Date.now()}`;

    set({
      mode: "demo",
      activeSessionId: sessionId,
      activeSession: {
        id: sessionId,
        projectId,
        toolId,
        status: "starting",
        startedAt: new Date().toISOString(),
      },
      ptySession: undefined,
      sessionStatus: "starting",
      inputBuffer: "",
      error: undefined,
    });
  },
  stopDemoSession: () =>
    set((state) => ({
      activeSession: state.activeSession
        ? {
            ...state.activeSession,
            status: "stopped",
            endedAt: new Date().toISOString(),
          }
        : undefined,
      activeSessionId: undefined,
      sessionStatus: "stopped",
      inputBuffer: "",
    })),
  appendTranscript: (line) =>
    set((state) => ({
      transcriptPreview: [...state.transcriptPreview, line].slice(-50),
    })),
  clearTranscript: () =>
    set({
      transcriptPreview: [],
      inputBuffer: "",
    }),
  setInputBuffer: (value) => set({ inputBuffer: value }),
  startMockSession: (toolId, projectId) =>
    useSessionStore.getState().startDemoSession(toolId, projectId),
  stopMockSession: () => useSessionStore.getState().stopDemoSession(),
  clearSession: () =>
    set({
      activeSession: undefined,
      ptySession: undefined,
      activeSessionId: undefined,
      sessionStatus: "idle",
      mode: "pty",
      inputBuffer: "",
      transcriptPreview: [],
      error: undefined,
      shell: undefined,
    }),
}));
