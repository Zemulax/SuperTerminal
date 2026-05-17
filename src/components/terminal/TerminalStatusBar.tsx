import type {
  Project,
  TerminalMode,
  TerminalSessionStatus,
  ToolAdapterState,
} from "@/lib/types";

type TerminalStatusBarProps = {
  activeTool: ToolAdapterState;
  project?: Project;
  mode: TerminalMode;
  status: TerminalSessionStatus;
  sessionId?: string;
  shell?: string;
  activeRunningToolName?: string;
  cols: number;
  rows: number;
  transcriptCaptureEnabled: boolean;
  workingDirectory?: string;
};

export function TerminalStatusBar({
  activeTool,
  project,
  mode,
  status,
  sessionId,
  shell,
  activeRunningToolName,
  cols,
  rows,
  transcriptCaptureEnabled,
  workingDirectory,
}: TerminalStatusBarProps) {
  const shortSessionId = sessionId ? sessionId.slice(0, 12) : "no session";

  return (
    <div className="grid shrink-0 gap-3 border-t border-slate-800 bg-slate-950 px-4 py-3 text-[11px] text-slate-400 xl:grid-cols-[1fr_1.4fr_auto]">
      <div className="truncate">
        {mode === "pty" ? "Local PTY session" : "Demo frontend terminal"}:{" "}
        <span className="font-mono text-slate-200">{status}</span>
        <span className="mx-2 text-slate-600">|</span>
        <span className="font-mono text-slate-200">{shortSessionId}</span>
      </div>
      <div className="truncate font-mono" title={workingDirectory ?? project?.path}>
        {workingDirectory ?? project?.path ?? "Shell will start in user home"}
      </div>
      <div className="flex flex-wrap gap-2 text-slate-300">
        <span>{activeRunningToolName ?? shell ?? activeTool.resolvedCommand}</span>
        <span>|</span>
        <span>
          {cols}x{rows}
        </span>
        <span>|</span>
        <span>{mode === "pty" ? "Input forwarded to local shell" : "Input captured locally"}</span>
        <span>|</span>
        <span>{transcriptCaptureEnabled ? "transcript on" : "transcript off"}</span>
      </div>
    </div>
  );
}
