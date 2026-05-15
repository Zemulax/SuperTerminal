import { Crosshair, Eraser, PlayCircle, Square } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToolStatusBadge } from "@/components/tools/ToolStatusBadge";
import type { Project, TerminalSessionStatus, ToolDefinition } from "@/lib/types";

type TerminalToolbarProps = {
  activeTool: ToolDefinition;
  project?: Project;
  status: TerminalSessionStatus;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
  onFocus: () => void;
};

export function TerminalToolbar({
  activeTool,
  project,
  status,
  onStart,
  onStop,
  onClear,
  onFocus,
}: TerminalToolbarProps) {
  const canStart = Boolean(project) && status !== "starting" && status !== "active";

  return (
    <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-800 bg-slate-950 px-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-white">
              {activeTool.name}
            </span>
            <ToolStatusBadge status={activeTool.status} />
            <Badge status={status} />
          </div>
          <div
            className="mt-1 truncate font-mono text-[11px] text-slate-400"
            title={project?.path}
          >
            {project ? `${project.name} | ${project.path}` : "No project selected"}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          disabled={!canStart}
          onClick={onStart}
          size="sm"
          title={project ? "Start frontend demo session" : "Open a project first"}
          variant="primary"
        >
          <PlayCircle className="h-4 w-4" aria-hidden />
          Start Demo Session
        </Button>
        <Button
          disabled={status !== "active" && status !== "starting"}
          onClick={onStop}
          size="sm"
          variant="secondary"
        >
          <Square className="h-4 w-4" aria-hidden />
          Stop Session
        </Button>
        <Button onClick={onClear} size="sm" variant="secondary">
          <Eraser className="h-4 w-4" aria-hidden />
          Clear
        </Button>
        <Button onClick={onFocus} size="sm" variant="secondary">
          <Crosshair className="h-4 w-4" aria-hidden />
          Focus Terminal
        </Button>
      </div>
    </div>
  );
}
