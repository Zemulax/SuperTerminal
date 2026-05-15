import { create } from "zustand";
import type { TerminalSession, TerminalSessionStatus } from "@/lib/types";

type SessionState = {
  activeSession?: TerminalSession;
  sessionStatus: TerminalSessionStatus;
  activeSessionId?: string;
  inputBuffer: string;
  transcriptPreview: string[];
  startDemoSession: (toolId: string, projectId?: string) => void;
  stopDemoSession: () => void;
  setStatus: (status: TerminalSessionStatus) => void;
  appendTranscript: (line: string) => void;
  clearTranscript: () => void;
  setInputBuffer: (value: string) => void;
  startMockSession: (toolId: string, projectId?: string) => void;
  stopMockSession: () => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  activeSession: undefined,
  sessionStatus: "idle",
  activeSessionId: undefined,
  inputBuffer: "",
  transcriptPreview: [],
  startDemoSession: (toolId, projectId) => {
    const sessionId = `demo-${toolId}-${Date.now()}`;

    set({
      activeSessionId: sessionId,
      activeSession: {
        id: sessionId,
        projectId,
        toolId,
        status: "starting",
        startedAt: new Date().toISOString(),
      },
      sessionStatus: "starting",
      inputBuffer: "",
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
      sessionStatus: "stopped",
      inputBuffer: "",
    })),
  setStatus: (status) =>
    set((state) => ({
      sessionStatus: status,
      activeSession: state.activeSession
        ? {
            ...state.activeSession,
            status,
            endedAt:
              status === "stopped" || status === "failed"
                ? new Date().toISOString()
                : state.activeSession.endedAt,
          }
        : undefined,
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
      activeSessionId: undefined,
      sessionStatus: "idle",
      inputBuffer: "",
      transcriptPreview: [],
    }),
}));
