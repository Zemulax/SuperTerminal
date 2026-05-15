import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SessionPanel } from "@/components/terminal/SessionPanel";
import { useProjectStore } from "@/stores/projectStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useToolStore } from "@/stores/toolStore";
import { formatBytes } from "@/lib/utils";

const futureCapabilities = [
  "PTY session",
  "adapter detection",
  "launch preview",
  "transcript capture",
];

export function StatusPanel() {
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const selectedFile = useProjectStore((state) => state.selectedFile);
  const adapters = useToolStore((state) => state.adapters);
  const activeToolId = useToolStore((state) => state.activeToolId);
  const lastLaunchSpec = useToolStore((state) => state.lastLaunchSpec);
  const sessionStatus = useSessionStore((state) => state.sessionStatus);
  const activeTool =
    adapters.find((tool) => tool.definition.id === activeToolId) ?? adapters[0];

  return (
    <section className="border-t border-border bg-white px-5 py-4">
      <div className="grid gap-5 xl:grid-cols-[1.25fr_1fr_1fr]">
        <SessionPanel />

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Active tool
            </div>
            <div className="mt-2 font-medium text-slate-950">
              {activeTool.definition.name}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Adapter status
            </div>
            <div className="mt-2">
              <Badge status={activeTool.status} />
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Resolved command
            </div>
            <div className="mt-2 rounded-md border border-border bg-slate-50 px-3 py-2">
              <div className="truncate font-mono text-xs text-slate-700">
                {activeTool.resolvedCommand}
              </div>
              {activeTool.version ? (
                <div className="mt-1 text-xs text-slate-500">
                  {activeTool.version}
                </div>
              ) : null}
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Selected file
            </div>
            <div className="mt-2 truncate rounded-md border border-border bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700">
              {selectedFile
                ? `${selectedFile.relativePath} | ${selectedFile.extension ?? "file"} | ${formatBytes(
                    selectedFile.sizeBytes,
                  )}`
                : "No file selected"}
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Phase 4 boundaries
          </div>
          <p className="mt-2 text-sm leading-5 text-slate-600">
            Tool checks run short local version commands. Install commands are
            preview-only. No prompts, credentials, API keys, or project context
            are injected in this phase.
          </p>
          {lastLaunchSpec ? (
            <pre className="mt-3 max-h-20 overflow-auto rounded-md border border-border bg-slate-50 px-3 py-2 font-mono text-[11px] text-slate-600">
              {lastLaunchSpec.preview}
            </pre>
          ) : null}
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
