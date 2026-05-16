import {
  Clipboard,
  Download,
  RotateCcw,
  Save,
  Search,
  ShieldAlert,
  TerminalSquare,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LaunchProfileEditor } from "@/components/tools/LaunchProfileEditor";
import { ToolStatusBadge } from "@/components/tools/ToolStatusBadge";
import { useInstallStore } from "@/stores/installStore";
import { useProjectStore } from "@/stores/projectStore";
import { useToolStore } from "@/stores/toolStore";
import type { InstallCommandValidationResult, ToolAdapterState } from "@/lib/types";

type ToolCardProps = {
  tool: ToolAdapterState;
};

export function ToolCard({ tool }: ToolCardProps) {
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const checkTool = useToolStore((state) => state.checkTool);
  const updateToolConfig = useToolStore((state) => state.updateToolConfig);
  const resetToolConfig = useToolStore((state) => state.resetToolConfig);
  const buildLaunchSpec = useToolStore((state) => state.buildLaunchSpec);
  const launchProfile = useToolStore((state) =>
    state.getLaunchProfile(tool.definition.id),
  );
  const lastLaunchSpec = useToolStore((state) => state.lastLaunchSpec);
  const validateInstallCommand = useInstallStore(
    (state) => state.validateInstallCommand,
  );
  const runInstallCommand = useInstallStore((state) => state.runInstallCommand);
  const validation = useInstallStore(
    (state) => state.validationByAdapter[tool.definition.id],
  );
  const installHistory = useInstallStore((state) => state.installHistory);
  const isValidating = useInstallStore((state) => state.isValidating);
  const isRunning = useInstallStore((state) => state.isRunning);
  const [commandOverride, setCommandOverride] = useState(
    tool.config.commandOverride ?? "",
  );
  const [installOverride, setInstallOverride] = useState(
    tool.config.installCommandOverride ?? "",
  );
  const [pendingValidation, setPendingValidation] =
    useState<InstallCommandValidationResult>();
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setCommandOverride(tool.config.commandOverride ?? "");
  }, [tool.config.commandOverride]);

  useEffect(() => {
    setInstallOverride(tool.config.installCommandOverride ?? "");
  }, [tool.config.installCommandOverride]);

  const installPreview =
    tool.config.installCommandOverride?.trim() ||
    tool.definition.installCommandPreview ||
    "Configure manually.";
  const isChecking = tool.status === "checking";
  const needsProjectForPreview =
    launchProfile.workingDirectoryMode === "project_root" && !selectedProject;
  const latestInstall = installHistory.find(
    (attempt) => attempt.adapterId === tool.definition.id,
  );

  const copyInstallCommand = () => {
    void navigator.clipboard?.writeText(installPreview);
  };

  const handleValidateInstall = async () => {
    await validateInstallCommand(tool.definition.id, installPreview);
  };

  const handleInstallClick = async () => {
    const result = await validateInstallCommand(tool.definition.id, installPreview);
    if (result) {
      setPendingValidation(result);
      setConfirmOpen(true);
    }
  };

  const handleRunInstall = async () => {
    if (!pendingValidation?.isAllowed) {
      return;
    }

    setConfirmOpen(false);
    const result = await runInstallCommand(
      tool.definition.id,
      pendingValidation.command,
      selectedProject?.path,
    );

    if (result) {
      await checkTool(tool.definition.id);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-700">
            <TerminalSquare className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-slate-950">
              {tool.definition.name}
            </div>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              {tool.definition.description}
            </p>
          </div>
        </div>
        <ToolStatusBadge status={tool.status} />
      </div>

      <div className="mt-4 grid gap-3 text-xs">
        <div>
          <div className="font-semibold uppercase tracking-[0.12em] text-slate-500">
            Resolved command
          </div>
          <div className="mt-1 rounded-md border border-border bg-slate-50 px-3 py-2 font-mono text-slate-700">
            {tool.resolvedCommand}
          </div>
        </div>

        <label>
          <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">
            Command override
          </span>
          <input
            className="mt-1 h-9 w-full rounded-md border border-border bg-white px-3 font-mono text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            onChange={(event) => setCommandOverride(event.target.value)}
            placeholder={tool.definition.defaultCommand}
            value={commandOverride}
          />
        </label>

        {tool.version ? (
          <div>
            <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">
              Version
            </span>
            <div className="mt-1 text-slate-700">{tool.version}</div>
          </div>
        ) : null}

        <div>
          <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">
            Message
          </span>
          <div className="mt-1 leading-5 text-slate-600">
            {tool.message ?? "No status message."}
          </div>
        </div>

        <div>
          <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">
            Install command preview
          </span>
          <div className="mt-1 rounded-md border border-border bg-slate-50 px-3 py-2 font-mono text-slate-600">
            {installPreview}
          </div>
        </div>

        <label>
          <span className="font-semibold uppercase tracking-[0.12em] text-slate-500">
            Install command override
          </span>
          <input
            className="mt-1 h-9 w-full rounded-md border border-border bg-white px-3 font-mono text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            onChange={(event) => setInstallOverride(event.target.value)}
            placeholder={tool.definition.installCommandPreview ?? "Configure manually."}
            value={installOverride}
          />
        </label>

        {validation ? (
          <div
            className={[
              "rounded-md border px-3 py-2",
              validation.isBlocked
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : validation.requiresManualExecution
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800",
            ].join(" ")}
          >
            <div className="font-semibold uppercase tracking-[0.12em]">
              Install validation
            </div>
            <div className="mt-1 leading-5">{validation.reason}</div>
          </div>
        ) : null}
      </div>

      <div className="mt-4">
        <LaunchProfileEditor tool={tool} />
      </div>

      {lastLaunchSpec?.adapterId === tool.definition.id ? (
        <div className="mt-3 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">
            Launch preview
          </div>
          <pre className="mt-1 whitespace-pre-wrap font-mono text-xs text-cyan-950">
            {lastLaunchSpec.preview}
          </pre>
        </div>
      ) : null}

      {latestInstall ? (
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Latest install result
            </div>
            <span className="rounded bg-white px-2 py-1 text-[11px] font-medium text-slate-700">
              {latestInstall.status}
            </span>
          </div>
          <div className="mt-1 text-xs leading-5 text-slate-600">
            {latestInstall.message}
            {latestInstall.exitCode !== undefined
              ? ` Exit code: ${latestInstall.exitCode}.`
              : ""}
          </div>
          {latestInstall.stdout ? (
            <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded border border-border bg-white p-2 font-mono text-[11px] text-slate-700">
              {latestInstall.stdout}
            </pre>
          ) : null}
          {latestInstall.stderr ? (
            <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded border border-rose-100 bg-rose-50 p-2 font-mono text-[11px] text-rose-900">
              {latestInstall.stderr}
            </pre>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          disabled={isChecking}
          onClick={() => void checkTool(tool.definition.id)}
          size="sm"
        >
          <Search className="h-4 w-4" aria-hidden />
          {isChecking ? "Checking..." : "Check"}
        </Button>
        <Button
          onClick={() =>
            updateToolConfig(tool.definition.id, {
              commandOverride: commandOverride.trim() || undefined,
            })
          }
          size="sm"
          variant="secondary"
        >
          <Save className="h-4 w-4" aria-hidden />
          Save Override
        </Button>
        <Button
          onClick={() =>
            updateToolConfig(tool.definition.id, {
              installCommandOverride: installOverride.trim() || undefined,
            })
          }
          size="sm"
          variant="secondary"
        >
          <Save className="h-4 w-4" aria-hidden />
          Save Install Override
        </Button>
        <Button
          onClick={() => resetToolConfig(tool.definition.id)}
          size="sm"
          variant="ghost"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Reset
        </Button>
        <Button
          onClick={() =>
            updateToolConfig(tool.definition.id, {
              installCommandOverride: undefined,
            })
          }
          size="sm"
          variant="ghost"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Reset Install
        </Button>
        <Button
          onClick={copyInstallCommand}
          size="sm"
          variant="ghost"
        >
          <Clipboard className="h-4 w-4" aria-hidden />
          Copy Install
        </Button>
        <Button
          disabled={isValidating}
          onClick={handleValidateInstall}
          size="sm"
          variant="secondary"
        >
          <ShieldAlert className="h-4 w-4" aria-hidden />
          Validate Install
        </Button>
        <Button
          disabled={isRunning}
          onClick={handleInstallClick}
          size="sm"
          variant={tool.status === "missing" ? "primary" : "secondary"}
        >
          <Download className="h-4 w-4" aria-hidden />
          {isRunning ? "Installing..." : "Install with SuperTerminal"}
        </Button>
        <Button
          disabled={needsProjectForPreview || tool.status !== "ready"}
          onClick={() =>
            void buildLaunchSpec(tool.definition.id, selectedProject?.path)
          }
          size="sm"
          variant="secondary"
        >
          Build Launch Preview
        </Button>
      </div>

      {confirmOpen && pendingValidation ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-xl rounded-lg border border-border bg-white p-5 shadow-shell">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-slate-950">
                  Confirm local install command
                </div>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  SuperTerminal runs only the command shown here after your
                  confirmation.
                </p>
              </div>
              <Button
                aria-label="Close install confirmation"
                onClick={() => setConfirmOpen(false)}
                size="icon"
                variant="ghost"
              >
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Command
                </div>
                <pre className="mt-1 whitespace-pre-wrap rounded-md border border-border bg-slate-50 p-3 font-mono text-xs text-slate-800">
                  {pendingValidation.command}
                </pre>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Working directory
                </div>
                <div className="mt-1 rounded-md border border-border bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
                  {selectedProject?.path ?? "SuperTerminal application directory"}
                </div>
              </div>
              <div
                className={[
                  "rounded-md border px-3 py-2 text-sm leading-5",
                  pendingValidation.isBlocked
                    ? "border-rose-200 bg-rose-50 text-rose-800"
                    : pendingValidation.requiresManualExecution
                      ? "border-amber-200 bg-amber-50 text-amber-800"
                      : "border-slate-200 bg-slate-50 text-slate-600",
                ].join(" ")}
              >
                {pendingValidation.reason}
                <div className="mt-2">
                  This may modify your system by installing packages or CLI
                  tools. SuperTerminal does not bundle this tool, manage
                  credentials, or perform login for you.
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button onClick={() => setConfirmOpen(false)} variant="ghost">
                Cancel
              </Button>
              <Button onClick={copyInstallCommand} variant="secondary">
                <Clipboard className="h-4 w-4" aria-hidden />
                Copy Command
              </Button>
              <Button
                disabled={!pendingValidation.isAllowed || isRunning}
                onClick={() => void handleRunInstall()}
                variant="primary"
              >
                Run Install
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
