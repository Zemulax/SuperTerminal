import { useMemo } from "react";
import { Clipboard, History, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useHistoryStore } from "@/stores/historyStore";
import { useProjectStore } from "@/stores/projectStore";
import { formatDateSafe, formatDurationSafe } from "@/lib/dateUtils";
import type { TerminalSessionRecord } from "@/lib/types";

type SessionHistoryPanelProps = {
  open: boolean;
  onClose: () => void;
};

function duration(session: TerminalSessionRecord) {
  return formatDurationSafe(session.startedAt, session.endedAt);
}

async function copyText(value?: string) {
  if (!value) {
    return;
  }

  await navigator.clipboard.writeText(value);
}

export function SessionHistoryPanel({ open, onClose }: SessionHistoryPanelProps) {
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const sessions = useHistoryStore((state) => state.sessions);
  const contextInjections = useHistoryStore((state) => state.contextInjections);
  const selectedSessionId = useHistoryStore((state) => state.selectedSessionId);
  const settings = useHistoryStore((state) => state.settings);
  const selectSession = useHistoryStore((state) => state.selectSession);
  const deleteSession = useHistoryStore((state) => state.deleteSession);
  const clearHistory = useHistoryStore((state) => state.clearHistory);
  const updateSettings = useHistoryStore((state) => state.updateSettings);

  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ?? sessions[0];
  const linkedInjections = useMemo(
    () =>
      selectedSession
        ? contextInjections.filter((record) => record.sessionId === selectedSession.id)
        : [],
    [contextInjections, selectedSession],
  );

  if (!open) {
    return null;
  }

  return (
    <div className="absolute inset-y-0 right-0 z-30 flex w-full max-w-3xl flex-col border-l border-border bg-white shadow-shell">
      <div className="flex h-16 items-center justify-between border-b border-border px-5">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
            <History className="h-4 w-4 text-slate-500" aria-hidden />
            Session History
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Local session metadata with optional bounded transcript previews.
          </div>
        </div>
        <Button aria-label="Close history" onClick={onClose} size="icon" variant="ghost">
          <X className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[300px_1fr]">
        <aside className="min-h-0 overflow-auto border-r border-border bg-slate-50 p-4">
          <section className="rounded-md border border-border bg-white p-3">
            <h2 className="text-sm font-semibold text-slate-950">
              Privacy settings
            </h2>
            <label className="mt-3 flex items-start gap-2 text-sm text-slate-700">
              <input
                checked={settings.saveSessionHistory}
                className="mt-1"
                onChange={(event) =>
                  updateSettings({ saveSessionHistory: event.target.checked })
                }
                type="checkbox"
              />
              <span>Save session history in this app session</span>
            </label>
            <label className="mt-3 flex items-start gap-2 text-sm text-slate-700">
              <input
                checked={settings.captureTranscript}
                className="mt-1"
                onChange={(event) =>
                  updateSettings({ captureTranscript: event.target.checked })
                }
                type="checkbox"
              />
              <span>Capture bounded transcript previews</span>
            </label>
            <label className="mt-3 block text-xs font-medium text-slate-600">
              Transcript max characters
              <input
                className="mt-1 h-8 w-full rounded-md border border-border px-2 font-mono text-xs"
                min={1000}
                onChange={(event) =>
                  updateSettings({
                    transcriptMaxChars: Number(event.target.value),
                  })
                }
                type="number"
                value={settings.transcriptMaxChars}
              />
            </label>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              Transcript capture is off by default because terminal output may
              include secrets. Nothing is uploaded.
            </p>
          </section>

          <div className="mt-4 flex gap-2">
            <Button
              className="flex-1"
              onClick={() => clearHistory(selectedProject?.path)}
              size="sm"
              variant="secondary"
            >
              Clear project
            </Button>
            <Button className="flex-1" onClick={() => clearHistory()} size="sm">
              Clear all
            </Button>
          </div>

          <section className="mt-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Recent sessions
            </div>
            <div className="space-y-2">
              {sessions.length === 0 ? (
                <div className="rounded-md border border-border bg-white p-3 text-sm text-slate-500">
                  No terminal sessions recorded yet.
                </div>
              ) : (
                sessions.map((session) => (
                  <button
                    className={`w-full rounded-md border p-3 text-left transition-colors ${
                      selectedSession?.id === session.id
                        ? "border-slate-400 bg-white"
                        : "border-border bg-white hover:border-slate-300"
                    }`}
                    key={session.id}
                    onClick={() => selectSession(session.id)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-950">
                        {session.toolName ?? session.kind}
                      </span>
                      <Badge status={session.status} />
                    </div>
                    <div className="mt-1 truncate font-mono text-[11px] text-slate-500">
                      {[session.command, ...session.args].join(" ")}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
                      <span>{formatDateSafe(session.startedAt)}</span>
                      <span>{duration(session)}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </section>
        </aside>

        <main className="min-h-0 overflow-auto p-5">
          {!selectedSession ? (
            <div className="rounded-md border border-border bg-slate-50 p-4 text-sm text-slate-500">
              Select a session to inspect details.
            </div>
          ) : (
            <div className="space-y-5">
              <section>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-base font-semibold text-slate-950">
                        {selectedSession.toolName ?? "Shell session"}
                      </h2>
                      <Badge status={selectedSession.status} />
                    </div>
                    <div className="mt-1 font-mono text-xs text-slate-500">
                      {selectedSession.id}
                    </div>
                  </div>
                  <Button
                    onClick={() => deleteSession(selectedSession.id)}
                    size="sm"
                    variant="secondary"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Delete
                  </Button>
                </div>
              </section>

              <section className="grid gap-3 text-sm md:grid-cols-2">
                <Info label="Kind" value={selectedSession.kind} />
                <Info label="Project" value={selectedSession.projectName ?? "Unknown"} />
                <Info label="Working directory" value={selectedSession.workingDirectory} />
                <Info label="Project path" value={selectedSession.projectPath ?? "Unknown"} />
                <Info label="Started" value={formatDateSafe(selectedSession.startedAt)} />
                <Info
                  label="Ended"
                  value={
                    selectedSession.endedAt
                      ? formatDateSafe(selectedSession.endedAt)
                      : "Active"
                  }
                />
                <Info
                  label="Exit code"
                  value={
                    typeof selectedSession.exitCode === "number"
                      ? String(selectedSession.exitCode)
                      : "Unavailable"
                  }
                />
                <Info
                  label="Transcript"
                  value={selectedSession.transcriptCaptured ? "Captured" : "Off"}
                />
              </section>

              <section>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-950">Command</h3>
                  <Button
                    onClick={() =>
                      void copyText(
                        [selectedSession.command, ...selectedSession.args].join(" "),
                      )
                    }
                    size="sm"
                    variant="secondary"
                  >
                    <Clipboard className="h-4 w-4" aria-hidden />
                    Copy
                  </Button>
                </div>
                <pre className="whitespace-pre-wrap rounded-md border border-border bg-slate-50 p-3 font-mono text-xs text-slate-800">
                  {[selectedSession.command, ...selectedSession.args].join(" ")}
                </pre>
              </section>

              <section>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-950">
                    Launch preview
                  </h3>
                  <Button
                    onClick={() => void copyText(selectedSession.launchPreview)}
                    size="sm"
                    variant="secondary"
                  >
                    <Clipboard className="h-4 w-4" aria-hidden />
                    Copy
                  </Button>
                </div>
                <pre className="whitespace-pre-wrap rounded-md border border-border bg-slate-50 p-3 font-mono text-xs text-slate-800">
                  {selectedSession.launchPreview}
                </pre>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-slate-950">
                  Linked context injections
                </h3>
                <div className="mt-2 space-y-2">
                  {linkedInjections.length === 0 ? (
                    <div className="rounded-md border border-border bg-slate-50 p-3 text-sm text-slate-500">
                      No context injections are linked to this session.
                    </div>
                  ) : (
                    linkedInjections.map((record) => (
                      <div
                        className="rounded-md border border-border bg-white p-3"
                        key={record.id}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-slate-900">
                            {record.mode}
                          </span>
                          <Badge status={record.status} />
                        </div>
                        <div className="mt-1 text-xs leading-5 text-slate-500">
                          {record.characterCount.toLocaleString()} characters ·{" "}
                          {formatDateSafe(record.createdAt)}
                        </div>
                        {record.promptFilePath ? (
                          <div className="mt-1 truncate font-mono text-[11px] text-slate-500">
                            {record.promptFilePath}
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-950">
                    Transcript preview
                  </h3>
                  <Button
                    disabled={!selectedSession.transcriptPreview}
                    onClick={() => void copyText(selectedSession.transcriptPreview)}
                    size="sm"
                    variant="secondary"
                  >
                    <Clipboard className="h-4 w-4" aria-hidden />
                    Copy transcript
                  </Button>
                </div>
                {selectedSession.transcriptCaptured ? (
                  <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-md border border-slate-800 bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-100">
                    {selectedSession.transcriptPreview ||
                      "Transcript capture was enabled, but no output was captured."}
                  </pre>
                ) : (
                  <div className="rounded-md border border-border bg-slate-50 p-3 text-sm text-slate-500">
                    Transcript capture was off for this session.
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-slate-50 px-3 py-2">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 truncate text-sm text-slate-800" title={value}>
        {value}
      </div>
    </div>
  );
}
