import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type {
  RedactSecretsResult,
  ToolAdapterId,
  ToolEnvVarInput,
  ToolSecretEnvVar,
} from "@/lib/types";

type SecretEnvState = {
  recordsByToolId: Record<string, ToolSecretEnvVar[]>;
  isLoading: boolean;
  isSaving: boolean;
  error?: string;
  loadToolSecrets: (toolId: ToolAdapterId) => Promise<void>;
  saveToolSecret: (input: ToolEnvVarInput) => Promise<ToolSecretEnvVar | undefined>;
  deleteToolSecret: (toolId: ToolAdapterId, name: string) => Promise<void>;
  setToolSecretEnabled: (
    toolId: ToolAdapterId,
    name: string,
    enabled: boolean,
  ) => Promise<void>;
  getEnabledSecretNames: (toolId?: ToolAdapterId) => string[];
  redactText: (text: string) => Promise<string>;
  clearError: () => void;
};

export const useSecretEnvStore = create<SecretEnvState>((set, get) => ({
  recordsByToolId: {},
  isLoading: false,
  isSaving: false,
  error: undefined,
  loadToolSecrets: async (toolId) => {
    set({ isLoading: true, error: undefined });
    try {
      const records = await invoke<ToolSecretEnvVar[]>("list_tool_secret_env_vars", {
        toolId,
      });
      set((state) => ({
        recordsByToolId: {
          ...state.recordsByToolId,
          [toolId]: records,
        },
        isLoading: false,
      }));
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },
  saveToolSecret: async (input) => {
    set({ isSaving: true, error: undefined });
    try {
      const record = await invoke<ToolSecretEnvVar>("save_tool_secret_env_var", {
        request: {
          toolId: input.toolId,
          name: input.name,
          value: input.value,
          enabled: input.enabled,
        },
      });
      set((state) => {
        const existing = state.recordsByToolId[input.toolId] ?? [];
        return {
          recordsByToolId: {
            ...state.recordsByToolId,
            [input.toolId]: [
              record,
              ...existing.filter((candidate) => candidate.name !== record.name),
            ].sort((left, right) => left.name.localeCompare(right.name)),
          },
          isSaving: false,
        };
      });
      return record;
    } catch (error) {
      set({ error: String(error), isSaving: false });
      return undefined;
    }
  },
  deleteToolSecret: async (toolId, name) => {
    set({ error: undefined });
    try {
      await invoke("delete_tool_secret_env_var", { toolId, name });
      set((state) => ({
        recordsByToolId: {
          ...state.recordsByToolId,
          [toolId]: (state.recordsByToolId[toolId] ?? []).filter(
            (record) => record.name !== name,
          ),
        },
      }));
    } catch (error) {
      set({ error: String(error) });
    }
  },
  setToolSecretEnabled: async (toolId, name, enabled) => {
    set({ error: undefined });
    try {
      const record = await invoke<ToolSecretEnvVar>(
        "set_tool_secret_env_var_enabled",
        { toolId, name, enabled },
      );
      set((state) => ({
        recordsByToolId: {
          ...state.recordsByToolId,
          [toolId]: (state.recordsByToolId[toolId] ?? []).map((candidate) =>
            candidate.name === name ? record : candidate,
          ),
        },
      }));
    } catch (error) {
      set({ error: String(error) });
    }
  },
  getEnabledSecretNames: (toolId) => {
    if (!toolId) {
      return [];
    }
    return (get().recordsByToolId[toolId] ?? [])
      .filter((record) => record.enabled)
      .map((record) => record.name);
  },
  redactText: async (text) => {
    if (!text) {
      return text;
    }
    try {
      const result = await invoke<RedactSecretsResult>("redact_configured_secrets", {
        request: { text },
      });
      return result.text;
    } catch {
      return text;
    }
  },
  clearError: () => set({ error: undefined }),
}));
