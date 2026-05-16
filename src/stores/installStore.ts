import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type {
  InstallAttemptResult,
  InstallCommandValidationResult,
  ToolAdapterId,
} from "@/lib/types";

type InstallStore = {
  validationByAdapter: Record<string, InstallCommandValidationResult | undefined>;
  installHistory: InstallAttemptResult[];
  activeInstallAttempt?: InstallAttemptResult;
  isValidating: boolean;
  isRunning: boolean;
  error?: string;
  validateInstallCommand: (
    adapterId: ToolAdapterId,
    command: string,
  ) => Promise<InstallCommandValidationResult | undefined>;
  runInstallCommand: (
    adapterId: ToolAdapterId,
    command: string,
    workingDirectory?: string,
  ) => Promise<InstallAttemptResult | undefined>;
  addInstallAttempt: (result: InstallAttemptResult) => void;
  clearInstallError: () => void;
};

export const useInstallStore = create<InstallStore>((set, get) => ({
  validationByAdapter: {},
  installHistory: [],
  activeInstallAttempt: undefined,
  isValidating: false,
  isRunning: false,
  error: undefined,
  validateInstallCommand: async (adapterId, command) => {
    set({ isValidating: true, error: undefined });

    try {
      const result = await invoke<InstallCommandValidationResult>(
        "validate_install_command",
        {
          request: {
            adapterId,
            command,
          },
        },
      );
      set((state) => ({
        validationByAdapter: {
          ...state.validationByAdapter,
          [adapterId]: result,
        },
        isValidating: false,
      }));
      return result;
    } catch (error) {
      set({ error: String(error), isValidating: false });
      return undefined;
    }
  },
  runInstallCommand: async (adapterId, command, workingDirectory) => {
    set({ isRunning: true, error: undefined });

    const planned: InstallAttemptResult = {
      id: `planned-${Date.now()}`,
      adapterId,
      command,
      status: "running",
      exitCode: undefined,
      stdout: "",
      stderr: "",
      startedAt: String(Date.now()),
      completedAt: undefined,
      message: "Install command is running.",
    };
    set({ activeInstallAttempt: planned });

    try {
      const result = await invoke<InstallAttemptResult>("run_install_command", {
        request: {
          adapterId,
          command,
          workingDirectory,
          timeoutSeconds: 300,
        },
      });
      get().addInstallAttempt(result);
      set({ activeInstallAttempt: result, isRunning: false });
      return result;
    } catch (error) {
      set({ error: String(error), activeInstallAttempt: undefined, isRunning: false });
      return undefined;
    }
  },
  addInstallAttempt: (result) =>
    set((state) => ({
      installHistory: [result, ...state.installHistory].slice(0, 20),
    })),
  clearInstallError: () => set({ error: undefined }),
}));
