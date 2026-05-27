import type {
  TerminalMode,
  TerminalSessionStatus,
  ToolAdapterState,
} from "@/lib/types";

type TerminalStatusBarProps = {
  activeTool: ToolAdapterState;
  mode: TerminalMode;
  status: TerminalSessionStatus;
  sessionId?: string;
  shell?: string;
  activeRunningToolName?: string;
  cols: number;
  rows: number;
  transcriptCaptureEnabled: boolean;
};

export function TerminalStatusBar({
  activeTool,
  mode,
  status,
  sessionId,
  shell,
  activeRunningToolName,
  cols,
  rows,
  transcriptCaptureEnabled,
}: TerminalStatusBarProps) {
  const shortSessionId = sessionId ? sessionId.slice(0, 12) : "no session";

  return (
    <div className="grid shrink-0 gap-3 border-t border-violet-950 bg-[#120a26] px-4 py-2 font-mono text-[11px] text-violet-300 xl:grid-cols-[1fr_auto]">
      <div className="truncate">
        {mode === "pty" ? "Local PTY session" : "Demo frontend terminal"}:{" "}
        <span className="text-violet-100">{status}</span>
        <span className="mx-2 text-violet-700">|</span>
        <span className="text-violet-100">{shortSessionId}</span>
      </div>
      <div className="flex flex-wrap gap-2 text-violet-200">
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
