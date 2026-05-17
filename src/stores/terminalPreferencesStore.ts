import { create } from "zustand";
import type { TerminalPreferences } from "@/lib/types";

const STORAGE_KEY = "superterminal.terminalPreferences.v1";

export const defaultTerminalPreferences: TerminalPreferences = {
  fontSize: 14,
  fontFamily: "JetBrains Mono, Consolas, monospace",
  lineHeight: 1.25,
  cursorBlink: true,
};

type TerminalPreferencesState = {
  preferences: TerminalPreferences;
  updatePreferences: (preferences: Partial<TerminalPreferences>) => void;
  resetPreferences: () => void;
};

function loadPreferences(): TerminalPreferences {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return defaultTerminalPreferences;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw
      ? { ...defaultTerminalPreferences, ...JSON.parse(raw) }
      : defaultTerminalPreferences;
  } catch {
    return defaultTerminalPreferences;
  }
}

function savePreferences(preferences: TerminalPreferences) {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Runtime state still applies if WebView localStorage is unavailable.
  }
}

export const useTerminalPreferencesStore = create<TerminalPreferencesState>(
  (set) => ({
    preferences: loadPreferences(),
    updatePreferences: (patch) =>
      set((state) => {
        const preferences = {
          ...state.preferences,
          ...patch,
          fontSize: Math.min(
            24,
            Math.max(10, patch.fontSize ?? state.preferences.fontSize),
          ),
          lineHeight: Math.min(
            2,
            Math.max(1, patch.lineHeight ?? state.preferences.lineHeight),
          ),
        };
        savePreferences(preferences);
        return { preferences };
      }),
    resetPreferences: () => {
      savePreferences(defaultTerminalPreferences);
      set({ preferences: defaultTerminalPreferences });
    },
  }),
);
