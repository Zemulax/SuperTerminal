import { Eraser, History, MessageSquareText, Settings2, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Project, TerminalSessionStatus, ToolAdapterState } from "@/lib/types";

type TerminalToolbarProps = {
  activeTool: ToolAdapterState;
  project?: Project;
  status: TerminalSessionStatus;
  activeRunningToolName?: string;
  onLaunchTool: () => void;
  onEditProfile: () => void;
  onOpenContext: () => void;
  onOpenHistory: () => void;
  onStop: () => void;
  onClear: () => void;
};

export function TerminalToolbar({
  activeTool,
  project,
  status,
  activeRunningToolName,
  onLaunchTool,
  onEditProfile,
  onOpenContext,
  onOpenHistory,
  onStop,
  onClear,
}: TerminalToolbarProps) {
  const canLaunchTool = Boolean(project) && activeTool.status === "ready";
  const canStop = status === "active" || status === "starting";

  return (
    <div className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-violet-950 bg-[#21133f] px-4 font-mono">
      <div className="flex min-w-0 items-center gap-3 text-xs">
        <span className="truncate font-semibold uppercase tracking-[0.12em] text-violet-100">
          {activeRunningToolName ?? "Shell"}
        </span>
        <span className="truncate text-violet-300" title={project?.path}>
          {project ? project.name : "User home"}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          disabled={!canLaunchTool}
          onClick={onLaunchTool}
          size="sm"
          title={
            project
              ? "Launch selected CLI in the current project directory"
              : "Open a project before launching a tool"
          }
          variant="secondary"
        >
          Launch Tool
        </Button>
        <Button onClick={onEditProfile} size="sm" variant="secondary">
          <Settings2 className="h-4 w-4" aria-hidden />
          Profile
        </Button>
        <Button onClick={onOpenContext} size="sm" variant="secondary">
          <MessageSquareText className="h-4 w-4" aria-hidden />
          Context
        </Button>
        <Button onClick={onOpenHistory} size="sm" variant="secondary">
          <History className="h-4 w-4" aria-hidden />
          History
        </Button>
        <Button disabled={!canStop} onClick={onStop} size="sm" variant="secondary">
          <Square className="h-4 w-4" aria-hidden />
          Stop
        </Button>
        <Button onClick={onClear} size="sm" variant="secondary">
          <Eraser className="h-4 w-4" aria-hidden />
          Clear
        </Button>
      </div>
    </div>
  );
}
