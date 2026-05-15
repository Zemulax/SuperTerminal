import type { Project, ToolDefinition } from "@/lib/types";

type TerminalStatusBarProps = {
  activeTool: ToolDefinition;
  project?: Project;
};

export function TerminalStatusBar({
  activeTool,
  project,
}: TerminalStatusBarProps) {
  return (
    <div className="grid shrink-0 gap-3 border-t border-slate-800 bg-slate-950 px-4 py-3 text-[11px] text-slate-400 xl:grid-cols-[1fr_1.4fr_auto]">
      <div className="truncate">
        Command preview:{" "}
        <span className="font-mono text-slate-200">{activeTool.defaultCommand}</span>
      </div>
      <div className="truncate font-mono" title={project?.path}>
        {project?.path ?? "Open a project folder to enable demo session"}
      </div>
      <div className="flex flex-wrap gap-2 text-slate-300">
        <span>Demo frontend terminal</span>
        <span>|</span>
        <span>PTY backend not connected</span>
        <span>|</span>
        <span>Input captured locally</span>
      </div>
    </div>
  );
}
