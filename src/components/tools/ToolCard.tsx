import { Clipboard, RotateCcw, Save, Search, TerminalSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ToolStatusBadge } from "@/components/tools/ToolStatusBadge";
import { useProjectStore } from "@/stores/projectStore";
import { useToolStore } from "@/stores/toolStore";
import type { ToolAdapterState } from "@/lib/types";

type ToolCardProps = {
  tool: ToolAdapterState;
};

export function ToolCard({ tool }: ToolCardProps) {
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const checkTool = useToolStore((state) => state.checkTool);
  const updateToolConfig = useToolStore((state) => state.updateToolConfig);
  const resetToolConfig = useToolStore((state) => state.resetToolConfig);
  const buildLaunchSpec = useToolStore((state) => state.buildLaunchSpec);
  const lastLaunchSpec = useToolStore((state) => state.lastLaunchSpec);
  const [commandOverride, setCommandOverride] = useState(
    tool.config.commandOverride ?? "",
  );

  useEffect(() => {
    setCommandOverride(tool.config.commandOverride ?? "");
  }, [tool.config.commandOverride]);

  const installPreview =
    tool.definition.installCommandPreview ?? "Configure manually.";
  const isChecking = tool.status === "checking";

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
          onClick={() => resetToolConfig(tool.definition.id)}
          size="sm"
          variant="ghost"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Reset
        </Button>
        <Button
          onClick={() => void navigator.clipboard?.writeText(installPreview)}
          size="sm"
          variant="ghost"
        >
          <Clipboard className="h-4 w-4" aria-hidden />
          Copy Install
        </Button>
        <Button
          disabled={!selectedProject || tool.status !== "ready"}
          onClick={() =>
            selectedProject
              ? void buildLaunchSpec(tool.definition.id, selectedProject.path)
              : undefined
          }
          size="sm"
          variant="secondary"
        >
          Build Launch Preview
        </Button>
      </div>
    </Card>
  );
}
