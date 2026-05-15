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
  const transcriptPreview = useSessionStore((state) => state.transcriptPreview);
  const activeTool = tools.find((tool) => tool.id === activeToolId) ?? tools[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr]">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Session
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Badge status={sessionStatus} />
          <span className="truncate font-mono text-xs text-slate-500">
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

      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          Transcript
        </div>
        <div className="mt-2 text-sm text-slate-700">
          {transcriptPreview.length} frontend lines
        </div>
      </div>
    </div>
  );
}
