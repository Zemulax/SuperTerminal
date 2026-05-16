import { create } from "zustand";
import type {
  ContextInjectionRecord,
  HistorySettings,
  TerminalSessionRecord,
} from "@/lib/types";

type CreateSessionRecordInput = Omit<
  TerminalSessionRecord,
  "contextInjectionIds" | "transcriptCharCount" | "transcriptPreview"
>;

type UpdateSessionRecordInput = {
  id: string;
  status?: TerminalSessionRecord["status"];
  endedAt?: string;
  exitCode?: number;
};

type HistoryState = {
  sessions: TerminalSessionRecord[];
  contextInjections: ContextInjectionRecord[];
  selectedSessionId?: string;
  isLoading: boolean;
  error?: string;
  settings: HistorySettings;
  createSessionRecord: (record: CreateSessionRecordInput) => void;
  updateSessionRecord: (update: UpdateSessionRecordInput) => void;
  appendTranscript: (sessionId: string, chunk: string) => void;
  saveContextInjectionRecord: (record: ContextInjectionRecord) => void;
  selectSession: (sessionId?: string) => void;
  deleteSession: (sessionId: string) => void;
  clearHistory: (projectPath?: string) => void;
  updateSettings: (settings: Partial<HistorySettings>) => void;
  getSelectedSession: () => TerminalSessionRecord | undefined;
  getContextInjectionsForSession: (sessionId: string) => ContextInjectionRecord[];
};

const defaultSettings: HistorySettings = {
  saveSessionHistory: true,
  captureTranscript: false,
  transcriptMaxChars: 50_000,
};

function boundedAppend(existing: string, chunk: string, maxChars: number) {
  const next = `${existing}${chunk}`;
  if (next.length <= maxChars) {
    return next;
  }

  return next.slice(next.length - maxChars);
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  sessions: [],
  contextInjections: [],
  selectedSessionId: undefined,
  isLoading: false,
  error: undefined,
  settings: defaultSettings,
  createSessionRecord: (record) =>
    set((state) => {
      if (!state.settings.saveSessionHistory) {
        return state;
      }

      const transcriptCaptured = state.settings.captureTranscript;
      const nextRecord: TerminalSessionRecord = {
        ...record,
        transcriptCaptured,
        transcriptPreview: transcriptCaptured ? "" : undefined,
        transcriptCharCount: 0,
        contextInjectionIds: [],
      };

      return {
        sessions: [
          nextRecord,
          ...state.sessions.filter((session) => session.id !== record.id),
        ],
        selectedSessionId: state.selectedSessionId ?? record.id,
      };
    }),
  updateSessionRecord: (update) =>
    set((state) => ({
      sessions: state.sessions.map((session) =>
        session.id === update.id
          ? {
              ...session,
              status: update.status ?? session.status,
              endedAt: update.endedAt ?? session.endedAt,
              exitCode:
                typeof update.exitCode === "number"
                  ? update.exitCode
                  : session.exitCode,
            }
          : session,
      ),
    })),
  appendTranscript: (sessionId, chunk) =>
    set((state) => {
      const maxChars = Math.max(1_000, state.settings.transcriptMaxChars);

      return {
        sessions: state.sessions.map((session) => {
          if (session.id !== sessionId || !session.transcriptCaptured) {
            return session;
          }

          const transcriptPreview = boundedAppend(
            session.transcriptPreview ?? "",
            chunk,
            maxChars,
          );

          return {
            ...session,
            transcriptPreview,
            transcriptCharCount: transcriptPreview.length,
          };
        }),
      };
    }),
  saveContextInjectionRecord: (record) =>
    set((state) => {
      const contextInjections = [
        record,
        ...state.contextInjections.filter((candidate) => candidate.id !== record.id),
      ].slice(0, 100);

      if (!record.sessionId) {
        return { contextInjections };
      }

      return {
        contextInjections,
        sessions: state.sessions.map((session) =>
          session.id === record.sessionId
            ? {
                ...session,
                contextInjectionIds: Array.from(
                  new Set([record.id, ...(session.contextInjectionIds ?? [])]),
                ),
              }
            : session,
        ),
      };
    }),
  selectSession: (sessionId) => set({ selectedSessionId: sessionId }),
  deleteSession: (sessionId) =>
    set((state) => ({
      sessions: state.sessions.filter((session) => session.id !== sessionId),
      contextInjections: state.contextInjections.map((record) =>
        record.sessionId === sessionId ? { ...record, sessionId: undefined } : record,
      ),
      selectedSessionId:
        state.selectedSessionId === sessionId ? undefined : state.selectedSessionId,
    })),
  clearHistory: (projectPath) =>
    set((state) => {
      const removedIds = new Set(
        state.sessions
          .filter((session) => !projectPath || session.projectPath === projectPath)
          .map((session) => session.id),
      );

      return {
        sessions: projectPath
          ? state.sessions.filter((session) => session.projectPath !== projectPath)
          : [],
        contextInjections: projectPath
          ? state.contextInjections.map((record) =>
              record.sessionId && removedIds.has(record.sessionId)
                ? { ...record, sessionId: undefined }
                : record,
            )
          : [],
        selectedSessionId:
          state.selectedSessionId && removedIds.has(state.selectedSessionId)
            ? undefined
            : state.selectedSessionId,
      };
    }),
  updateSettings: (settings) =>
    set((state) => ({
      settings: {
        ...state.settings,
        ...settings,
        transcriptMaxChars: Math.max(
          1_000,
          settings.transcriptMaxChars ?? state.settings.transcriptMaxChars,
        ),
      },
    })),
  getSelectedSession: () => {
    const state = get();
    return state.sessions.find((session) => session.id === state.selectedSessionId);
  },
  getContextInjectionsForSession: (sessionId) =>
    get().contextInjections.filter((record) => record.sessionId === sessionId),
}));
