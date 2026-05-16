import {
  Crosshair,
  Eraser,
  FlaskConical,
  MessageSquareText,
  PlayCircle,
  Settings2,
  Square,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToolStatusBadge } from "@/components/tools/ToolStatusBadge";
import type {
  Project,
  TerminalMode,
  TerminalSessionStatus,
  ToolAdapterState,
  ToolLaunchProfile,
} from "@/lib/types";

type TerminalToolbarProps = {
  activeTool: ToolAdapterState;
  project?: Project;
  status: TerminalSessionStatus;
  mode: TerminalMode;
  launchProfile: ToolLaunchProfile;
  activeRunningToolId?: string;
  activeRunningToolName?: string;
  onStart: () => void;
  onLaunchTool: () => void;
  onEditProfile: () => void;
  onOpenContext: () => void;
  onStartDemo: () => void;
  onStop: () => void;
  onClear: () => void;
  onFocus: () => void;
};

export function TerminalToolbar({
  activeTool,
  project,
  status,
  mode,
  launchProfile,
  activeRunningToolId,
  activeRunningToolName,
  onStart,
  onLaunchTool,
  onEditProfile,
  onOpenContext,
  onStartDemo,
  onStop,
  onClear,
  onFocus,
}: TerminalToolbarProps) {
  const canStart = Boolean(project) && status !== "starting" && status !== "active";
  const canLaunchTool = canStart && activeTool.status === "ready";
  const canStop = status === "active" || status === "starting";
  const selectedToolDiffers =
    Boolean(activeRunningToolId) && activeRunningToolId !== activeTool.definition.id;
  const launchTarget =
    launchProfile.rawArgs.trim().length > 0
      ? `${activeTool.resolvedCommand} ${launchProfile.rawArgs}`
      : activeTool.resolvedCommand;

  return (
    <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-slate-800 bg-slate-950 px-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-white">
              {activeTool.definition.name}
            </span>
            <ToolStatusBadge status={activeTool.status} />
            <Badge status={status} />
            <Badge>{mode === "pty" ? "Real PTY" : "Demo"}</Badge>
            {activeRunningToolName ? <Badge>{activeRunningToolName} running</Badge> : null}
          </div>
          <div
            className="mt-1 truncate font-mono text-[11px] text-slate-400"
            title={project?.path}
          >
            {!project
              ? "Open a project folder before starting a terminal session."
              : status === "active" && selectedToolDiffers
                ? `Active session: ${activeRunningToolName}. Selected tool: ${activeTool.definition.name}. Stop the session before launching another tool.`
                : activeTool.status === "ready"
                ? `${project.name} | ${launchTarget} | ${launchProfile.workingDirectoryMode}`
                : `${activeTool.definition.name} is not ready. Install or configure it in Settings before launching.`}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          disabled={!canStart}
          onClick={onStart}
          size="sm"
          title={project ? "Start local PTY shell" : "Open a project first"}
          variant="primary"
        >
          <PlayCircle className="h-4 w-4" aria-hidden />
          Start Terminal
        </Button>
        <Button
          disabled={!canLaunchTool}
          onClick={onLaunchTool}
          size="sm"
          title={
            activeTool.status === "ready"
              ? "Launch selected CLI in the local PTY"
              : "Install or configure this tool in Settings before launch"
          }
          variant="secondary"
        >
          Launch Tool
        </Button>
        <Button onClick={onEditProfile} size="sm" variant="secondary">
          <Settings2 className="h-4 w-4" aria-hidden />
          Edit Profile
        </Button>
        <Button onClick={onOpenContext} size="sm" variant="secondary">
          <MessageSquareText className="h-4 w-4" aria-hidden />
          Context
        </Button>
        <Button
          disabled={!canStart}
          onClick={onStartDemo}
          size="sm"
          title="Use frontend-only demo mode"
          variant="secondary"
        >
          <FlaskConical className="h-4 w-4" aria-hidden />
          Demo Mode
        </Button>
        <Button disabled={!canStop} onClick={onStop} size="sm" variant="secondary">
          <Square className="h-4 w-4" aria-hidden />
          Stop Terminal
        </Button>
        <Button onClick={onClear} size="sm" variant="secondary">
          <Eraser className="h-4 w-4" aria-hidden />
          Clear View
        </Button>
        <Button onClick={onFocus} size="sm" variant="secondary">
          <Crosshair className="h-4 w-4" aria-hidden />
          Focus Terminal
        </Button>
      </div>
    </div>
  );
}
