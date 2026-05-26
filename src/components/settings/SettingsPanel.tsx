import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useHistoryStore } from "@/stores/historyStore";
import { ToolCard } from "@/components/tools/ToolCard";
import { useInstallStore } from "@/stores/installStore";
import { useTerminalPreferencesStore } from "@/stores/terminalPreferencesStore";
import { useToolStore } from "@/stores/toolStore";

type SettingsPanelProps = {
  onOpenCatalogue: () => void;
  open: boolean;
  onClose: () => void;
};

const sections = [
  {
    title: "Agent profiles",
    body: "Profiles define local CLI commands, version checks, command overrides, install guidance, launch profiles, and environment variables.",
  },
  {
    title: "Terminal preferences",
    body: "Font size, font family, line height, and cursor behavior are configurable for the embedded terminal.",
  },
  {
    title: "Launch profiles",
    body: "Each adapter can keep its own args, launch mode, working directory mode, and confirmation setting.",
  },
  {
    title: "PTY backend status",
    body: "Implemented as a single local session that can start a default shell or one explicitly launched ready adapter.",
  },
  {
    title: "Install safety",
    body: "Guided installs only run allowed commands after confirmation. Sudo, pipelines, and destructive commands are manual-only or blocked.",
  },
  {
    title: "Transcript capture",
    body: "Transcript previews are local, bounded, optional, and off by default.",
  },
  {
    title: "Session safety",
    body: "SuperTerminal keeps one active PTY session at a time and requires explicit user action for launches.",
  },
  {
    title: "Privacy/local-first",
    body: "SuperTerminal does not bundle agents, upload project code, or run installs without confirmation.",
  },
];

export function SettingsPanel({
  onOpenCatalogue,
  open,
  onClose,
}: SettingsPanelProps) {
  const tools = useToolStore((state) => state.tools);
  const installHistory = useInstallStore((state) => state.installHistory);
  const activeInstallAttempt = useInstallStore(
    (state) => state.activeInstallAttempt,
  );
  const historySettings = useHistoryStore((state) => state.settings);
  const updateHistorySettings = useHistoryStore((state) => state.updateSettings);
  const clearHistory = useHistoryStore((state) => state.clearHistory);
  const terminalPreferences = useTerminalPreferencesStore(
    (state) => state.preferences,
  );
  const updateTerminalPreferences = useTerminalPreferencesStore(
    (state) => state.updatePreferences,
  );
  const resetTerminalPreferences = useTerminalPreferencesStore(
    (state) => state.resetPreferences,
  );
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (activeInstallAttempt?.status !== "running") {
      return undefined;
    }

    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [activeInstallAttempt?.status]);

  if (!open) {
    return null;
  }

  const statusGroups = [
    { title: "Ready", tools: tools.filter((tool) => tool.status === "ready") },
    { title: "Missing", tools: tools.filter((tool) => tool.status === "missing") },
    {
      title: "Needs Setup",
      tools: tools.filter((tool) => tool.status === "needs_setup"),
    },
    {
      title: "Not Checked",
      tools: tools.filter((tool) =>
        ["not_checked", "checking", "error"].includes(tool.status),
      ),
    },
  ];

  return (
    <div className="absolute inset-y-0 right-0 z-20 flex w-full max-w-xl flex-col border-l border-border bg-white shadow-shell">
      <div className="flex h-16 items-center justify-between border-b border-border px-5">
        <div>
          <div className="text-sm font-semibold text-slate-950">Settings</div>
          <div className="text-xs text-slate-500">Tools, terminal, and privacy</div>
        </div>
        <Button aria-label="Close settings" onClick={onClose} size="icon" variant="ghost">
          <X className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-5 py-5">
        <div className="space-y-4">
          {sections.map((section) => (
            <section key={section.title} className="border-b border-border pb-4">
              <h2 className="text-sm font-semibold text-slate-950">
                {section.title}
              </h2>
              <p className="mt-1 text-sm leading-5 text-slate-500">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-slate-950">
            Terminal appearance
          </h2>
          <p className="mt-1 text-sm leading-5 text-slate-500">
            These settings apply to the embedded xterm.js surface and refit the
            terminal when changed. No backend shell behavior changes.
          </p>
          <div className="mt-3 grid gap-3 rounded-md border border-border bg-slate-50 p-3 text-xs">
            <label>
              <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">
                Font size
              </span>
              <select
                className="mt-1 h-9 w-full rounded-md border border-border bg-white px-3 text-xs text-slate-700"
                onChange={(event) =>
                  updateTerminalPreferences({
                    fontSize: Number(event.target.value),
                  })
                }
                value={terminalPreferences.fontSize}
              >
                {[12, 13, 14, 15, 16, 18].map((size) => (
                  <option key={size} value={size}>
                    {size}px
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">
                Font family
              </span>
              <input
                className="mt-1 h-9 w-full rounded-md border border-border bg-white px-3 font-mono text-xs text-slate-700"
                onChange={(event) =>
                  updateTerminalPreferences({
                    fontFamily: event.target.value,
                  })
                }
                value={terminalPreferences.fontFamily}
              />
            </label>
            <label>
              <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">
                Line height
              </span>
              <select
                className="mt-1 h-9 w-full rounded-md border border-border bg-white px-3 text-xs text-slate-700"
                onChange={(event) =>
                  updateTerminalPreferences({
                    lineHeight: Number(event.target.value),
                  })
                }
                value={terminalPreferences.lineHeight}
              >
                {[1.1, 1.2, 1.25, 1.35, 1.5].map((lineHeight) => (
                  <option key={lineHeight} value={lineHeight}>
                    {lineHeight}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                checked={terminalPreferences.cursorBlink}
                onChange={(event) =>
                  updateTerminalPreferences({
                    cursorBlink: event.target.checked,
                  })
                }
                type="checkbox"
              />
              Cursor blink
            </label>
            <Button onClick={resetTerminalPreferences} size="sm" variant="secondary">
              Reset terminal appearance
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-slate-950">
            Session history and transcripts
          </h2>
          <p className="mt-1 text-sm leading-5 text-slate-500">
            Session metadata is local to this app session. Transcript preview
            capture is off by default because terminal output can contain secrets.
          </p>
          <div className="mt-3 rounded-md border border-border bg-slate-50 p-3">
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input
                checked={historySettings.saveSessionHistory}
                className="mt-1"
                onChange={(event) =>
                  updateHistorySettings({
                    saveSessionHistory: event.target.checked,
                  })
                }
                type="checkbox"
              />
              <span>Save session history while the app is running</span>
            </label>
            <label className="mt-3 flex items-start gap-2 text-sm text-slate-700">
              <input
                checked={historySettings.captureTranscript}
                className="mt-1"
                onChange={(event) =>
                  updateHistorySettings({
                    captureTranscript: event.target.checked,
                  })
                }
                type="checkbox"
              />
              <span>Capture bounded transcript previews locally</span>
            </label>
            <label className="mt-3 block text-xs font-medium text-slate-600">
              Transcript max characters
              <input
                className="mt-1 h-8 w-full rounded-md border border-border px-2 font-mono text-xs"
                min={1000}
                onChange={(event) =>
                  updateHistorySettings({
                    transcriptMaxChars: Number(event.target.value),
                  })
                }
                type="number"
                value={historySettings.transcriptMaxChars}
              />
            </label>
            <Button className="mt-3" onClick={() => clearHistory()} size="sm">
              Clear all session history
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-950">
                Agent profiles
              </h2>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                SuperTerminal does not bundle or install these agents. Detection
                only runs short local version commands. Install commands are
                shown, validated, and require confirmation before execution.
                Expand a profile to configure command overrides, launch
                profiles, install settings, diagnostics, and environment
                variables.
              </p>
            </div>
            <Button onClick={onOpenCatalogue} size="sm" variant="primary">
              Agent Catalogue
            </Button>
          </div>
          <div className="mt-4 space-y-5">
            {statusGroups.map((group) => (
              <section key={group.title}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {group.title}
                </div>
                {group.tools.length === 0 ? (
                  <div className="rounded-md border border-border bg-slate-50 px-3 py-2 text-sm text-slate-500">
                    No tools in this group.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {group.tools.map((tool) => (
                      <ToolCard key={tool.definition.id} tool={tool} />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-sm font-semibold text-slate-950">
            Install history
          </h2>
          <p className="mt-1 text-sm leading-5 text-slate-500">
            Recent install attempts are kept only for this app session.
          </p>
          {activeInstallAttempt?.status === "running" ? (
            <div className="mt-3 rounded-md border border-violet-200 bg-violet-50 p-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-700">
                    Install in progress
                  </div>
                  <div className="mt-1 truncate font-mono text-xs text-violet-950">
                    {activeInstallAttempt.command}
                  </div>
                  <div className="mt-1 text-xs leading-5 text-violet-800">
                    Running asynchronously. SuperTerminal remains usable while
                    the command completes.
                  </div>
                </div>
                <span className="shrink-0 rounded bg-white px-2 py-1 text-[11px] font-medium text-violet-700">
                  {formatElapsed(activeInstallAttempt.startedAt, now)}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-violet-100">
                <div className="h-full w-1/3 animate-[install-progress_1.2s_ease-in-out_infinite] rounded-full bg-violet-500" />
              </div>
            </div>
          ) : null}
          <div className="mt-3 space-y-2">
            {installHistory.length === 0 ? (
              <div className="rounded-md border border-border bg-slate-50 px-3 py-2 text-sm text-slate-500">
                No install attempts in this session.
              </div>
            ) : (
              installHistory.map((attempt) => {
                const tool = tools.find(
                  (candidate) => candidate.definition.id === attempt.adapterId,
                );
                return (
                  <div
                    className="rounded-md border border-border bg-white px-3 py-2"
                    key={attempt.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-900">
                          {tool?.definition.name ?? attempt.adapterId}
                        </div>
                        <div className="truncate font-mono text-[11px] text-slate-500">
                          {attempt.command}
                        </div>
                      </div>
                      <span className="shrink-0 rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                        {attempt.status}
                      </span>
                    </div>
                    <div className="mt-1 text-xs leading-5 text-slate-500">
                      {attempt.message}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatElapsed(startedAt: string | undefined, now: number) {
  const start = Number(startedAt);
  if (!Number.isFinite(start) || start <= 0) {
    return "running";
  }

  const totalSeconds = Math.max(0, Math.floor((now - start) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes <= 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}
