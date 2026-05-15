import { Circle, LockKeyhole, TerminalSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/stores/projectStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useToolStore } from "@/stores/toolStore";

export function TerminalPlaceholder() {
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const tools = useToolStore((state) => state.tools);
  const activeToolId = useToolStore((state) => state.activeToolId);
  const sessionStatus = useSessionStore((state) => state.sessionStatus);
  const activeTool = tools.find((tool) => tool.id === activeToolId) ?? tools[0];

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <TerminalSquare className="h-4 w-4 text-slate-500" aria-hidden />
            <h1 className="truncate text-base font-semibold text-slate-950">
              {activeTool.name}
            </h1>
            <Badge status={sessionStatus} />
          </div>
          <p className="mt-1 text-sm text-slate-500">{activeTool.description}</p>
        </div>
        <Button disabled variant="primary">
          Launch later
        </Button>
      </div>

      <div className="min-h-0 flex-1 p-5">
        <div className="flex h-full min-h-[420px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-terminal text-terminal-foreground shadow-shell">
          <div className="flex h-10 items-center justify-between border-b border-white/10 px-4">
            <div className="flex items-center gap-2">
              <Circle className="h-2.5 w-2.5 fill-rose-400 text-rose-400" />
              <Circle className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              <Circle className="h-2.5 w-2.5 fill-emerald-400 text-emerald-400" />
            </div>
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-slate-400">
              PTY placeholder
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto p-5 font-mono text-sm leading-6">
            <p className="text-cyan-300">SuperTerminal session</p>
            <p>
              Selected tool:{" "}
              <span className="text-white">{activeTool.name}</span>
            </p>
            <p>
              Project:{" "}
              <span className="text-white">
                {selectedProject?.name ?? "Open a project folder to begin."}
              </span>
            </p>
            {selectedProject ? <p>Path: {selectedProject.path}</p> : null}
            <p>Command preview: {activeTool.defaultCommand}</p>
            <br />
            <p>
              Real terminal hosting will be added in a later phase. No commands
              are executed from this surface yet.
            </p>
            <p>
              SuperTerminal does not bundle or replace tools. It will detect,
              launch, and connect them through one local interface.
            </p>
            <br />
            <p className="text-slate-400">
              $ {activeTool.defaultCommand} --project{" "}
              {selectedProject?.path ?? "<project-path>"}
            </p>
          </div>

          <div className="flex h-14 items-center gap-3 border-t border-white/10 px-4">
            <LockKeyhole className="h-4 w-4 text-slate-500" aria-hidden />
            <div className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-slate-500">
              Input disabled until PTY execution is implemented
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
