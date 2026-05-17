import { FolderOpen, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolSwitcher } from "@/components/tools/ToolSwitcher";
import { useProjectStore } from "@/stores/projectStore";

type HeaderProps = {
  onOpenSettings: () => void;
};

export function Header({ onOpenSettings }: HeaderProps) {
  const openProjectWithPicker = useProjectStore(
    (state) => state.openProjectWithPicker,
  );
  const isOpeningProject = useProjectStore((state) => state.isOpeningProject);

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
