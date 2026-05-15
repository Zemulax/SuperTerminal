import { PauseCircle, PlayCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProjectStore } from "@/stores/projectStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useToolStore } from "@/stores/toolStore";

export function SessionPanel() {
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const tools = useToolStore((state) => state.tools);
  const activeToolId = useToolStore((state) => state.activeToolId);
  const activeSession = useSessionStore((state) => state.activeSession);
  const sessionStatus = useSessionStore((state) => state.sessionStatus);
  const startMockSession = useSessionStore((state) => state.startMockSession);
  const stopMockSession = useSessionStore((state) => state.stopMockSession);
  const clearSession = useSessionStore((state) => state.clearSession);
  const activeTool = tools.find((tool) => tool.id === activeToolId) ?? tools[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Session
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Badge status={sessionStatus} />
          <span className="font-mono text-xs text-slate-500">
            {activeSession?.id ?? "No active session"}
          </span>
        </div>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Context
        </div>
        <div className="mt-2 text-sm text-slate-700">
          {selectedProject?.name ?? "No project"} {"->"} {activeTool.name}
        </div>
      </div>

      <div className="flex items-end gap-2">
        <Button
          onClick={() => startMockSession(activeTool.id, selectedProject?.id)}
          size="sm"
        >
          <PlayCircle className="h-4 w-4" aria-hidden />
          Start
        </Button>
        <Button onClick={stopMockSession} size="sm" variant="ghost">
          <PauseCircle className="h-4 w-4" aria-hidden />
          Stop
        </Button>
        <Button onClick={clearSession} size="sm" variant="ghost">
          <RotateCcw className="h-4 w-4" aria-hidden />
          Clear
        </Button>
      </div>
    </div>
  );
}
