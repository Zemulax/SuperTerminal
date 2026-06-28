import { ChevronDown, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AgentIcon } from "@/components/tools/AgentIcon";
import { LaunchProfileEditor } from "@/components/tools/LaunchProfileEditor";
import { ToolCard } from "@/components/tools/ToolCard";
import { ToolStatusBadge } from "@/components/tools/ToolStatusBadge";
import { useHistoryStore } from "@/stores/historyStore";
import { useInstallStore } from "@/stores/installStore";
import { useProjectStore } from "@/stores/projectStore";
import { useTerminalPreferencesStore } from "@/stores/terminalPreferencesStore";
import { useToolStore } from "@/stores/toolStore";
import { cn } from "@/lib/utils";
import type { ToolAdapterState } from "@/lib/types";

type SettingsPanelProps = {
  onOpenCatalogue: () => void;
  open: boolean;
  onClose: () => void;
};

type SettingsSectionId =
  | "agents"
  | "terminal"
  | "launch"
  | "install"
  | "history"
  | "privacy"
  | "about";

const defaultOpenSections: Record<SettingsSectionId, boolean> = {
  agents: true,
  terminal: true,
  launch: false,
  install: false,
  history: false,
  privacy: false,
  about: false,
};

export function SettingsPanel({
  onOpenCatalogue,
  open,
  onClose,
}: SettingsPanelProps) {
  const tools = useToolStore((state) => state.tools);
  const resetAgentLayout = useToolStore((state) => state.resetAgentLayout);
  const installHistory = useInstallStore((state) => state.installHistory);
  const activeInstallAttempt = useInstallStore(
    (state) => state.activeInstallAttempt,
  );
  const selectedProject = useProjectStore((state) => state.selectedProject);
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
  const [openSections, setOpenSections] = useState(defaultOpenSections);
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
  const readyCount = statusGroups[0].tools.length;

  const toggleSection = (section: SettingsSectionId) => {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  return (
    <div className="absolute inset-y-0 right-0 z-20 flex w-full max-w-xl flex-col border-l border-border bg-white shadow-shell">
      <div className="flex h-16 items-center justify-between border-b border-border px-5">
        <div>
          <div className="text-sm font-semibold text-slate-950">Settings</div>
          <div className="text-xs text-slate-500">Tools, terminal, privacy</div>
        </div>
        <Button aria-label="Close settings" onClick={onClose} size="icon" variant="ghost">
          <X className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-auto px-5 py-5">
        <SettingsSection
          id="agents"
          isOpen={openSections.agents}
          onToggle={toggleSection}
          summary={`${tools.length} profiles · ${readyCount} ready`}
          title="Agent Profiles"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm leading-5 text-slate-500">
              Add, check, configure, install, launch, and manage local agent profiles.
            </p>
            <div className="flex shrink-0 flex-wrap justify-end gap-2">
              <Button onClick={resetAgentLayout} size="sm" variant="secondary">
                Reset layout
              </Button>
              <Button onClick={onOpenCatalogue} size="sm" variant="primary">
                Agent Catalogue
              </Button>
            </div>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Reset layout restores default added profiles and ribbon pins without
            changing command overrides, launch profiles, installs, or secrets.
          </p>
          <div className="mt-4 space-y-5">
            {statusGroups.map((group) => (
              <section key={group.title}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {group.title}
                </div>
                {group.tools.length === 0 ? (
                  <div className="rounded-md border border-border bg-slate-50 px-3 py-2 text-sm text-slate-500">
                    No agents in this group.
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
        </SettingsSection>

        <SettingsSection
          id="terminal"
          isOpen={openSections.terminal}
          onToggle={toggleSection}
          summary="Font size, family, line height, cursor blink"
          title="Terminal Appearance"
        >
          <p className="text-sm leading-5 text-slate-500">
            Adjust how the embedded terminal looks.
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
        </SettingsSection>

        <SettingsSection
          id="launch"
          isOpen={openSections.launch}
          onToggle={toggleSection}
          summary="Per-agent args, working directory, launch confirmation"
          title="Launch Profiles"
        >
          <div className="space-y-2">
            {tools.map((tool) => (
              <LaunchProfileRow key={tool.definition.id} tool={tool} />
            ))}
          </div>
        </SettingsSection>

        <SettingsSection
          id="install"
          isOpen={openSections.install}
          onToggle={toggleSection}
          summary="Confirmation, blocked commands, recent install attempts"
          title="Install Safety"
        >
          <div className="rounded-md border border-border bg-slate-50 p-3 text-sm leading-6 text-slate-600">
            Guided installs require confirmation. Sudo commands, shell pipelines,
            destructive commands, and complex shell operators are blocked or manual-only.
          </div>
          {activeInstallAttempt?.status === "running" ? (
            <div className="mt-3 rounded-md border border-violet-200 bg-violet-50 p-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-700">
                    {isUninstallCommand(activeInstallAttempt.command)
                      ? "Uninstall in progress"
                      : "Install in progress"}
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
              <div className="rounded-md border border-border bg-white px-3 py-2 text-sm text-slate-500">
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
        </SettingsSection>

        <SettingsSection
          id="history"
          isOpen={openSections.history}
          onToggle={toggleSection}
          summary="Session metadata, optional transcript previews, clear history"
          title="Transcript & History"
        >
          <div className="rounded-md border border-border bg-slate-50 p-3">
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
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => clearHistory()} size="sm">
                Clear all history
              </Button>
              <Button
                disabled={!selectedProject}
                onClick={() => clearHistory(selectedProject?.path)}
                size="sm"
                variant="secondary"
              >
                Clear current project
              </Button>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Terminal output can contain secrets. Transcript capture is off by
              default and previews are bounded.
            </p>
          </div>
        </SettingsSection>

        <SettingsSection
          id="privacy"
          isOpen={openSections.privacy}
          onToggle={toggleSection}
          summary="Local-first behavior, explicit installs, no bundled agents"
          title="Privacy & Local-first"
        >
          <ul className="space-y-2 rounded-md border border-border bg-slate-50 p-3 text-sm leading-6 text-slate-600">
            <li>SuperTerminal does not bundle third-party agents or CLI tools.</li>
            <li>Project context is not uploaded by SuperTerminal.</li>
            <li>Install commands are shown clearly and require confirmation.</li>
            <li>Context injection requires explicit user action.</li>
            <li>
              API keys stay local and are only passed to selected tool processes
              when configured.
            </li>
          </ul>
        </SettingsSection>

        <SettingsSection
          id="about"
          isOpen={openSections.about}
          onToggle={toggleSection}
          summary="Version, license, project links, safety boundaries"
          title="About SuperTerminal"
        >
          <div className="rounded-md border border-border bg-slate-50 p-3 text-sm leading-6 text-slate-600">
            <div className="font-medium text-slate-900">SuperTerminal 0.1.0 alpha</div>
            <div className="mt-2">One terminal surface for your AI coding agents.</div>
            <div className="mt-2">License: Apache-2.0</div>
            <div className="mt-2">
              SuperTerminal hosts local shells and user-configured CLI tools. It
              does not replace, bundle, redistribute, or silently install third-party agents.
            </div>
            <div className="mt-2 flex flex-wrap gap-3">
              <a
                className="font-medium text-violet-700 hover:text-violet-900"
                href="https://github.com/Zemulax/SuperTerminal"
                rel="noreferrer"
                target="_blank"
              >
                Zemulax/SuperTerminal
              </a>
              <a
                className="font-medium text-violet-700 hover:text-violet-900"
                href="https://zemulax.github.io/SuperTerminal/"
                rel="noreferrer"
                target="_blank"
              >
                Website
              </a>
            </div>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}

function SettingsSection({
  children,
  id,
  isOpen,
  onToggle,
  summary,
  title,
}: {
  children: ReactNode;
  id: SettingsSectionId;
  isOpen: boolean;
  onToggle: (id: SettingsSectionId) => void;
  summary: string;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-white">
      <button
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
        onClick={() => onToggle(id)}
        type="button"
      >
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-950">{title}</h2>
          <p className="mt-0.5 truncate text-xs text-slate-500">{summary}</p>
        </div>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-slate-400 transition", isOpen && "rotate-180")}
          aria-hidden
        />
      </button>
      {isOpen ? <div className="border-t border-border p-4">{children}</div> : null}
    </section>
  );
}

function LaunchProfileRow({ tool }: { tool: ToolAdapterState }) {
  const storedProfile = useToolStore(
    (state) => state.launchProfilesByAdapterId[tool.definition.id],
  );
  const getLaunchProfile = useToolStore((state) => state.getLaunchProfile);
  const profile = storedProfile ?? getLaunchProfile(tool.definition.id);

  return (
    <details className="rounded-md border border-border bg-slate-50">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-slate-700">
            <AgentIcon
              iconKey={tool.definition.iconKey}
              muted={["missing", "not_checked", "error"].includes(tool.status)}
              name={tool.definition.name}
              size={24}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-slate-900">
                {tool.definition.name}
              </span>
              <ToolStatusBadge status={tool.status} />
            </div>
            <div className="truncate font-mono text-[11px] text-slate-500">
              {profile.command || tool.resolvedCommand}
            </div>
          </div>
        </div>
        <div className="hidden shrink-0 text-right text-[11px] text-slate-500 sm:block">
          {profile.workingDirectoryMode.replace(/_/g, " ")} ·{" "}
          {profile.confirmBeforeLaunch ? "confirm" : "no confirm"}
        </div>
      </summary>
      <div className="border-t border-border bg-white p-3">
        <LaunchProfileEditor tool={tool} compact />
      </div>
    </details>
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

function isUninstallCommand(command: string) {
  return /\b(uninstall|remove|rm)\b/i.test(command);
}
