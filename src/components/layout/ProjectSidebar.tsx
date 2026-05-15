import { FormEvent, useState } from "react";
import { AlertTriangle, FolderOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FilePreview } from "@/components/project/FilePreview";
import { FileTree } from "@/components/project/FileTree";
import { useProjectStore } from "@/stores/projectStore";

export function ProjectSidebar() {
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const isOpeningProject = useProjectStore((state) => state.isOpeningProject);
  const isScanningProject = useProjectStore((state) => state.isScanningProject);
  const error = useProjectStore((state) => state.error);
  const openProjectByPath = useProjectStore((state) => state.openProjectByPath);
  const scanProject = useProjectStore((state) => state.scanProject);
  const loadMockProject = useProjectStore((state) => state.loadMockProject);
  const clearProject = useProjectStore((state) => state.clearProject);
  const [pathInput, setPathInput] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void openProjectByPath(pathInput);
  };

  const handleRescan = () => {
    if (selectedProject) {
      void scanProject(selectedProject.path);
    }
  };

  return (
    <aside className="flex min-h-0 w-80 shrink-0 flex-col border-r border-border bg-panel">
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Project
            </div>
            <div className="mt-1 truncate text-sm font-semibold text-slate-950">
              {selectedProject?.name ?? "No project selected"}
            </div>
          </div>
          <Button
            aria-label="Rescan project"
            disabled={!selectedProject || isScanningProject}
            onClick={handleRescan}
            size="icon"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        <form className="mt-3 space-y-2" onSubmit={handleSubmit}>
          <input
            className="h-9 w-full rounded-md border border-border bg-white px-3 font-mono text-xs text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            onChange={(event) => setPathInput(event.target.value)}
            placeholder="Paste local project path"
            value={pathInput}
          />
          <div className="flex gap-2">
            <Button
              className="flex-1"
              disabled={isOpeningProject || isScanningProject}
              size="sm"
              type="submit"
              variant="primary"
            >
              <FolderOpen className="h-4 w-4" aria-hidden />
              {isOpeningProject ? "Opening..." : "Open"}
            </Button>
            <Button onClick={loadMockProject} size="sm" variant="secondary">
              Demo
            </Button>
          </div>
        </form>

        {selectedProject ? (
          <div className="mt-3 rounded-md border border-border bg-white px-3 py-2">
            <div className="truncate font-mono text-[11px] leading-4 text-slate-500">
              {selectedProject.path}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge>{selectedProject.totalFiles ?? 0} files</Badge>
              <Badge>{selectedProject.totalDirectories ?? 0} dirs</Badge>
              <Badge>{selectedProject.ignoredCount ?? 0} ignored</Badge>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="mt-3 flex gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        ) : null}

        {selectedProject?.truncated ? (
          <div className="mt-3 flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>Scan limit reached. Showing a partial project tree.</span>
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        {isScanningProject ? (
          <div className="rounded-md border border-border bg-white p-3 text-sm text-slate-500">
            Scanning project folder...
          </div>
        ) : selectedProject ? (
          <FileTree files={selectedProject.files} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <FolderOpen className="h-8 w-8 text-slate-300" aria-hidden />
            <p className="mt-3 text-sm font-medium text-slate-700">
              Open a local project
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Paste a folder path to scan files locally. Heavy folders like
              node_modules and .git are skipped.
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-border p-3">
        <FilePreview />
        {selectedProject ? (
          <Button
            className="mt-3 w-full"
            onClick={clearProject}
            size="sm"
            variant="ghost"
          >
            Clear project
          </Button>
        ) : null}
      </div>
    </aside>
  );
}
