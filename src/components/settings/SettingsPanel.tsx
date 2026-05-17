import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHistoryStore } from "@/stores/historyStore";
import { ToolCard } from "@/components/tools/ToolCard";
import { useInstallStore } from "@/stores/installStore";
import { useToolStore } from "@/stores/toolStore";

type SettingsPanelProps = {
  open: boolean;
  onClose: () => void;
};

const sections = [
  {
    title: "Tool adapters",
    body: "Adapters define local CLI commands, version checks, command overrides, install guidance, and launch profiles.",
  },
  {
    title: "Terminal preferences",
    body: "Default shell, font size, scrollback, and terminal theme controls will live here later.",
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
    body: "Terminal transcript capture is local-only demo state for now; persistence comes later.",
  },
  {
    title: "Session safety",
    body: "Confirm-before-close and active-session recovery settings will be added after the PTY MVP.",
  },
  {
    title: "Privacy/local-first",
    body: "SuperTerminal does not upload project code or manage external credentials.",
  },
];

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const tools = useToolStore((state) => state.tools);
  const installHistory = useInstallStore((state) => state.installHistory);
  const historySettings = useHistoryStore((state) => state.settings);
  const updateHistorySettings = useHistoryStore((state) => state.updateSettings);
  const clearHistory = useHistoryStore((state) => state.clearHistory);

  if (!open) {
    return null;
  }

  const namedTools = tools.filter((tool) => tool.definition.id !== "generic");
  const customTools = tools.filter((tool) => tool.definition.id === "generic");
  const statusGroups = [
    { title: "Ready", tools: namedTools.filter((tool) => tool.status === "ready") },
    { title: "Missing", tools: namedTools.filter((tool) => tool.status === "missing") },
    {
      title: "Needs Setup",
      tools: namedTools.filter((tool) => tool.status === "needs_setup"),
    },
    {
      title: "Not Checked",
      tools: namedTools.filter((tool) =>
        ["not_checked", "checking", "error"].includes(tool.status),
      ),
    },
  ];

  return (
    <div className="absolute inset-y-0 right-0 z-20 flex w-full max-w-xl flex-col border-l border-border bg-white shadow-shell">
      <div className="flex h-16 items-center justify-between border-b border-border px-5">
        <div>
          <div className="text-sm font-semibold text-slate-950">Settings</div>
          <div className="text-xs text-slate-500">Phase 6 launch profiles</div>
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
          <h2 className="text-sm font-semibold text-slate-950">Tool adapters</h2>
          <p className="mt-1 text-sm leading-5 text-slate-500">
            SuperTerminal does not bundle or install these tools. Detection only
            runs short local version commands. Install commands are shown,
            validated, and require confirmation before execution. Command
            overrides are executable paths or command names; launch args live in
            each tool's launch profile.
          </p>
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
            Advanced / Custom tools
          </h2>
          <p className="mt-1 text-sm leading-5 text-slate-500">
            Generic CLI remains available for testing custom commands, but it is
            kept out of the main header until configured.
          </p>
          <div className="mt-3 space-y-3">
            {customTools.map((tool) => (
              <ToolCard key={tool.definition.id} tool={tool} />
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
