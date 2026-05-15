import { create } from "zustand";
import type { TerminalSession, TerminalSessionStatus } from "@/lib/types";

type SessionState = {
  activeSession?: TerminalSession;
  sessionStatus: TerminalSessionStatus;
  startMockSession: (toolId: string, projectId?: string) => void;
  stopMockSession: () => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionState>((set) => ({
  activeSession: undefined,
  sessionStatus: "idle",
  startMockSession: (toolId, projectId) =>
    set({
      activeSession: {
        id: `mock-${toolId}-${Date.now()}`,
        projectId,
        toolId,
        status: "active",
        startedAt: new Date().toISOString(),
      },
      sessionStatus: "active",
    }),
  stopMockSession: () =>
    set((state) => ({
      activeSession: state.activeSession
        ? {
            ...state.activeSession,
            status: "stopped",
            endedAt: new Date().toISOString(),
          }
        : undefined,
      sessionStatus: "stopped",
    })),
  clearSession: () =>
    set({
      activeSession: undefined,
      sessionStatus: "idle",
    }),
}));
