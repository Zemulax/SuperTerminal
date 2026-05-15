import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SessionPanel } from "@/components/terminal/SessionPanel";
import { useProjectStore } from "@/stores/projectStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useToolStore } from "@/stores/toolStore";
import { formatBytes } from "@/lib/utils";

const futureCapabilities = [
  "PTY session",
  "context injection",
  "install helper",
  "transcript capture",
];

export function StatusPanel() {
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const selectedFile = useProjectStore((state) => state.selectedFile);
  const tools = useToolStore((state) => state.tools);
  const activeToolId = useToolStore((state) => state.activeToolId);
  const sessionStatus = useSessionStore((state) => state.sessionStatus);
  const activeTool = tools.find((tool) => tool.id === activeToolId) ?? tools[0];

  return (
    <section className="border-t border-border bg-white px-5 py-4">
      <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr_1fr]">
        <SessionPanel />

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Active tool
            </div>
            <div className="mt-2 font-medium text-slate-950">{activeTool.name}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Install status
            </div>
            <div className="mt-2">
              <Badge status={activeTool.status} />
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Selected file
            </div>
            <div className="mt-2 rounded-md border border-border bg-slate-50 px-3 py-2">
              <div className="truncate font-mono text-xs text-slate-700">
                {selectedFile?.relativePath ?? "No file selected"}
              </div>
              {selectedFile ? (
                <div className="mt-1 text-xs text-slate-500">
                  {selectedFile.extension ?? "file"} |{" "}
                  {formatBytes(selectedFile.sizeBytes)}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Phase 3 boundaries
          </div>
          <p className="mt-2 text-sm leading-5 text-slate-600">
            The terminal hosts a local shell after explicit user start. No tool
            adapters, install helpers, credentials, API keys, or project uploads
            are handled in this phase.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {futureCapabilities.map((capability) => (
              <Badge key={capability}>{capability}</Badge>
            ))}
          </div>
          <div className="mt-3 truncate font-mono text-xs text-slate-500">
            {selectedProject
              ? `${selectedProject.totalFiles ?? 0} files, ${
                  selectedProject.totalDirectories ?? 0
                } dirs`
              : "Project path unavailable"}{" "}
            | {sessionStatus}
          </div>
        </div>
      </div>
    </section>
  );
}
