import { Clipboard, FileText, Send, X, Zap } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useContextStore } from "@/stores/contextStore";
import { useProjectStore } from "@/stores/projectStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useToolStore } from "@/stores/toolStore";
import type { ContextOptions } from "@/lib/types";

type ContextInjectionPanelProps = {
  open: boolean;
  onClose: () => void;
  onLaunchAndInject: (
    appendNewline: boolean,
    delayMs: number,
  ) => Promise<void>;
};

type PendingAction = "stdin" | "launch_and_inject" | undefined;

const optionLabels: Array<[keyof ContextOptions, string]> = [
  ["includeProjectSummary", "Project summary"],
  ["includeFileTreeSummary", "File tree summary"],
  ["includeSelectedFileMetadata", "Selected file metadata"],
  ["includeSelectedFilePreview", "Selected file preview"],
  ["includeUserTask", "User task"],
  ["includeToolInformation", "Tool information"],
  ["includeDefaultInstructions", "Default instructions"],
];

export function ContextInjectionPanel({
  open,
  onClose,
  onLaunchAndInject,
}: ContextInjectionPanelProps) {
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const selectedFile = useProjectStore((state) => state.selectedFile);
  const adapters = useToolStore((state) => state.adapters);
  const activeToolId = useToolStore((state) => state.activeToolId);
  const activeTool =
    adapters.find((tool) => tool.definition.id === activeToolId) ?? adapters[0];
  const sessionStatus = useSessionStore((state) => state.sessionStatus);
  const activeSessionId = useSessionStore((state) => state.activeSessionId);

  const userTask = useContextStore((state) => state.userTask);
  const contextOptions = useContextStore((state) => state.contextOptions);
  const generatedContext = useContextStore((state) => state.generatedContext);
  const selectedInjectionMode = useContextStore(
    (state) => state.selectedInjectionMode,
  );
  const injectionHistory = useContextStore((state) => state.injectionHistory);
  const isInjecting = useContextStore((state) => state.isInjecting);
  const error = useContextStore((state) => state.error);
  const lastPromptFile = useContextStore((state) => state.lastPromptFile);
  const setUserTask = useContextStore((state) => state.setUserTask);
  const updateContextOptions = useContextStore(
    (state) => state.updateContextOptions,
  );
  const setSelectedInjectionMode = useContextStore(
    (state) => state.setSelectedInjectionMode,
  );
  const generateContext = useContextStore((state) => state.generateContext);
  const copyContextToClipboard = useContextStore(
    (state) => state.copyContextToClipboard,
  );
  const createPromptFile = useContextStore((state) => state.createPromptFile);
  const injectToActiveSession = useContextStore(
    (state) => state.injectToActiveSession,
  );
  const clearContext = useContextStore((state) => state.clearContext);

  const [pendingAction, setPendingAction] = useState<PendingAction>();
  const [appendNewline, setAppendNewline] = useState(true);
  const [delayMs, setDelayMs] = useState(1000);
  const characterCount = generatedContext.length;
  const warnings = buildWarnings(
    characterCount,
    contextOptions.includeSelectedFilePreview,
    selectedInjectionMode,
  );

  if (!open) {
    return null;
  }

  const canGenerate = Boolean(selectedProject);
  const canInject = Boolean(generatedContext && activeSessionId && sessionStatus === "active");
  const canLaunchAndInject = Boolean(
    generatedContext &&
      selectedProject &&
      activeTool?.status === "ready" &&
      sessionStatus !== "active" &&
      sessionStatus !== "starting",
  );

  async function runPendingAction() {
    const action = pendingAction;
    setPendingAction(undefined);

    if (action === "stdin") {
      await injectToActiveSession(appendNewline);
    }

    if (action === "launch_and_inject") {
      await onLaunchAndInject(appendNewline, delayMs);
    }
  }

  return (
    <div className="absolute inset-y-0 right-0 z-30 flex w-full max-w-2xl flex-col border-l border-border bg-white shadow-shell">
      <div className="flex h-16 items-center justify-between border-b border-border px-5">
        <div>
          <div className="text-sm font-semibold text-slate-950">
            Context Injection
          </div>
          <div className="text-xs text-slate-500">
            Prepare local project context before sending it anywhere.
          </div>
        </div>
        <Button aria-label="Close context panel" onClick={onClose} size="icon" variant="ghost">
          <X className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-5 py-5">
        <div className="grid gap-5">
          <section>
            <h2 className="text-sm font-semibold text-slate-950">
              Task input
            </h2>
            <textarea
              className="mt-2 min-h-24 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              onChange={(event) => setUserTask(event.target.value)}
              placeholder="Implement Google OAuth redirect handling and explain the files changed."
              value={userTask}
            />
          </section>

          <section>
            <h2 className="text-sm font-semibold text-slate-950">
              Context options
            </h2>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {optionLabels.map(([key, label]) => (
                <label className="flex items-center gap-2 text-sm text-slate-600" key={key}>
                  <input
                    checked={contextOptions[key]}
                    className="h-4 w-4 rounded border-border"
                    onChange={(event) =>
                      updateContextOptions({ [key]: event.target.checked })
                    }
                    type="checkbox"
                  />
                  {label}
                </label>
              ))}
            </div>
            {selectedFile?.name.toLowerCase().startsWith(".env") ? (
              <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Selected file preview is blocked for env files.
              </div>
            ) : null}
          </section>

          <section>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-950">
                Context preview
              </h2>
              <div className="flex items-center gap-2">
                <Badge>{characterCount.toLocaleString()} chars</Badge>
                <Button disabled={!canGenerate} onClick={() => generateContext()} size="sm">
                  Generate Context
                </Button>
              </div>
            </div>
            {!selectedProject ? (
              <div className="mt-2 rounded-md border border-border bg-slate-50 px-3 py-2 text-sm text-slate-500">
                Open a project folder to generate project context.
              </div>
            ) : null}
            <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-100">
              {generatedContext || "Generate context to preview the markdown payload."}
            </pre>
            {warnings.length > 0 ? (
              <div className="mt-2 space-y-1">
                {warnings.map((warning) => (
                  <div
                    className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
                    key={warning}
                  >
                    {warning}
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <section>
            <h2 className="text-sm font-semibold text-slate-950">
              Injection mode
            </h2>
            <select
              className="mt-2 h-9 w-full rounded-md border border-border bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              onChange={(event) =>
                setSelectedInjectionMode(event.target.value as typeof selectedInjectionMode)
              }
              value={selectedInjectionMode}
            >
              <option value="manual">Manual preview</option>
              <option value="clipboard">Clipboard</option>
              <option value="prompt_file">Prompt file</option>
              <option value="stdin">Stdin to active session</option>
            </select>

            <div className="mt-3 grid gap-2 text-xs text-slate-600">
              <div>Selected tool: {activeTool?.definition.name ?? "No tool"}</div>
              <div>Tool status: {activeTool?.status ?? "unknown"}</div>
              <div>Session: {sessionStatus} {activeSessionId ? `(${activeSessionId})` : ""}</div>
              <div>Project: {selectedProject?.path ?? "No project selected"}</div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  checked={appendNewline}
                  className="h-4 w-4 rounded border-border"
                  onChange={(event) => setAppendNewline(event.target.checked)}
                  type="checkbox"
                />
                Append newline for stdin injection
              </label>
              <label className="text-sm text-slate-600">
                Launch + inject delay
                <input
                  className="mt-1 h-9 w-full rounded-md border border-border bg-white px-3 font-mono text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  min={250}
                  onChange={(event) => setDelayMs(Number(event.target.value))}
                  step={250}
                  type="number"
                  value={delayMs}
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button disabled={!generatedContext} onClick={() => void copyContextToClipboard()} size="sm">
                <Clipboard className="h-4 w-4" aria-hidden />
                Copy to Clipboard
              </Button>
              <Button disabled={!generatedContext} onClick={() => void createPromptFile()} size="sm" variant="secondary">
                <FileText className="h-4 w-4" aria-hidden />
                Create Prompt File
              </Button>
              <Button
                disabled={!canInject || isInjecting}
                onClick={() => setPendingAction("stdin")}
                size="sm"
                variant="secondary"
              >
                <Send className="h-4 w-4" aria-hidden />
                Inject into Active Session
              </Button>
              <Button
                disabled={!canLaunchAndInject || isInjecting}
                onClick={() => setPendingAction("launch_and_inject")}
                size="sm"
                variant="primary"
              >
                <Zap className="h-4 w-4" aria-hidden />
                Launch Tool + Inject
              </Button>
              <Button onClick={clearContext} size="sm" variant="ghost">
                Clear
              </Button>
            </div>

            {lastPromptFile ? (
              <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                Prompt file created outside the project:{" "}
                <button
                  className="font-mono underline"
                  onClick={() => void navigator.clipboard.writeText(lastPromptFile.path)}
                  type="button"
                >
                  {lastPromptFile.path}
                </button>
              </div>
            ) : null}
            {error ? (
              <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                {error}
              </div>
            ) : null}
          </section>

          <section>
            <h2 className="text-sm font-semibold text-slate-950">
              Injection history
            </h2>
            <div className="mt-2 space-y-2">
              {injectionHistory.length === 0 ? (
                <div className="rounded-md border border-border bg-slate-50 px-3 py-2 text-sm text-slate-500">
                  No context actions yet.
                </div>
              ) : (
                injectionHistory.map((record) => (
                  <div className="rounded-md border border-border bg-white px-3 py-2" key={record.id}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-slate-900">
                        {record.toolName} · {record.mode}
                      </div>
                      <Badge status={record.status}>{record.status}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {record.message} · {record.characterCount.toLocaleString()} chars
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
        </div>
      </div>

      {pendingAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-xl rounded-lg border border-border bg-white p-5 shadow-shell">
            <div className="text-sm font-semibold text-slate-950">
              Confirm context injection
            </div>
            <p className="mt-2 text-sm leading-5 text-slate-600">
              This will send {characterCount.toLocaleString()} characters of
              generated context to{" "}
              {pendingAction === "stdin"
                ? "the active terminal session"
                : `${activeTool?.definition.name ?? "the selected tool"} after launch`}
              . No injection happens unless you confirm.
            </p>
            <div className="mt-3 rounded-md border border-border bg-slate-50 px-3 py-2 text-xs text-slate-600">
              Review the context preview before continuing. SuperTerminal will
              not upload this content or manage credentials.
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => setPendingAction(undefined)} variant="ghost">
                Cancel
              </Button>
              <Button onClick={() => void runPendingAction()} variant="primary">
                Confirm
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function buildWarnings(
  characterCount: number,
  includesPreview: boolean,
  mode: string,
) {
  const warnings: string[] = [];
  if (characterCount > 50_000) {
    warnings.push("This context is very large. Prompt file mode is recommended.");
  } else if (characterCount > 20_000) {
    warnings.push("This context is large. Some CLI tools may respond slowly or fail.");
  }
  if (includesPreview) {
    warnings.push("Selected file preview is included. Review it before sending.");
  }
  if (mode === "stdin") {
    warnings.push("Stdin mode sends the generated context into the active terminal session.");
  }
  if (mode === "prompt_file") {
    warnings.push("Prompt files are written outside your project folder.");
  }
  if (mode === "clipboard") {
    warnings.push("Clipboard mode copies context to your system clipboard.");
  }
  return warnings;
}
