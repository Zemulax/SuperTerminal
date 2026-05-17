import { FolderOpen, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToolSwitcher } from "@/components/tools/ToolSwitcher";
import { getToolStatusIcon, getToolStatusLabel } from "@/lib/statusIcons";
import { useProjectStore } from "@/stores/projectStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useToolStore } from "@/stores/toolStore";

type HeaderProps = {
  onOpenSettings: () => void;
};

export function Header({ onOpenSettings }: HeaderProps) {
  const selectedProject = useProjectStore((state) => state.selectedProject);
  const openProjectWithPicker = useProjectStore(
    (state) => state.openProjectWithPicker,
  );
  const isOpeningProject = useProjectStore((state) => state.isOpeningProject);
  const adapters = useToolStore((state) => state.adapters);
  const activeToolId = useToolStore((state) => state.activeToolId);
  const activeRunningToolName = useSessionStore((state) => state.activeToolName);
  const sessionStatus = useSessionStore((state) => state.sessionStatus);
  const activeTool =
    adapters.find((tool) => tool.definition.id === activeToolId) ?? adapters[0];

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-white px-5">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 font-mono text-sm font-semibold text-white">
            ST
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-950">
              SuperTerminal
            </div>
            <div className="truncate text-xs text-slate-500">
              One terminal surface for your AI coding CLIs.
            </div>
          </div>
        </div>

        <div className="hidden h-7 w-px bg-border md:block" />

        <div className="hidden min-w-0 items-center gap-2 md:flex">
          <Badge>{selectedProject?.name ?? "No project selected"}</Badge>
          {selectedProject ? (
            <span
              className="truncate font-mono text-[11px] text-slate-500"
              title={selectedProject.path}
            >
              {selectedProject.totalFiles ?? 0} files
            </span>
          ) : null}
          <span className="truncate text-xs text-slate-500" title={activeTool.definition.name}>
            {activeTool.definition.name.replace(" CLI", "")}
          </span>
          <span
            className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-600"
            title={getToolStatusLabel(activeTool.status)}
          >
            {getToolStatusIcon(activeTool.status)}
          </span>
          {sessionStatus === "active" && activeRunningToolName ? (
            <Badge>{activeRunningToolName} running</Badge>
          ) : null}
          {activeTool.status === "missing" || activeTool.status === "needs_setup" ? (
            <button
              className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
              onClick={onOpenSettings}
              type="button"
            >
              Install from Settings
            </button>
          ) : null}
        </div>
      </div>

      <div className="hidden min-w-0 flex-1 justify-center xl:flex">
        <ToolSwitcher />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="xl:hidden">
          <ToolSwitcher />
        </div>
        <Button
          disabled={isOpeningProject}
          onClick={() => void openProjectWithPicker()}
          size="sm"
          variant="secondary"
        >
          <FolderOpen className="h-4 w-4" aria-hidden />
          {isOpeningProject ? "Opening..." : "Open Project"}
        </Button>
        <Button
          aria-label="Open settings"
          onClick={onOpenSettings}
          size="icon"
          variant="ghost"
        >
          <Settings className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </header>
  );
}
