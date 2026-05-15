import { ChevronDown, RefreshCw, TerminalSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolStatusBadge } from "@/components/tools/ToolStatusBadge";
import { useToolStore } from "@/stores/toolStore";
import { cn } from "@/lib/utils";

export function ToolSwitcher() {
  const adapters = useToolStore((state) => state.adapters);
  const activeToolId = useToolStore((state) => state.activeToolId);
  const isCheckingAll = useToolStore((state) => state.isCheckingAll);
  const setActiveTool = useToolStore((state) => state.setActiveTool);
  const checkTool = useToolStore((state) => state.checkTool);
  const checkAllTools = useToolStore((state) => state.checkAllTools);
  const activeAdapter =
    adapters.find((adapter) => adapter.definition.id === activeToolId) ??
    adapters[0];

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="hidden items-center gap-1 rounded-md border border-border bg-white p-1 xl:flex">
        {adapters.map((adapter) => (
          <button
            key={adapter.definition.id}
            type="button"
            onClick={() => setActiveTool(adapter.definition.id)}
            className={cn(
              "flex h-8 items-center gap-2 rounded px-2.5 text-xs font-medium text-slate-600 transition-colors",
              activeToolId === adapter.definition.id
                ? "bg-slate-950 text-white"
                : "hover:bg-slate-100 hover:text-slate-950",
            )}
            title={adapter.message}
          >
            <span>{adapter.definition.name}</span>
            <ToolStatusBadge status={adapter.status} />
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 xl:hidden">
        <TerminalSquare className="h-4 w-4 text-slate-500" aria-hidden />
        <select
          aria-label="Select active tool"
          value={activeToolId}
          onChange={(event) => setActiveTool(event.target.value)}
          className="max-w-40 bg-transparent text-sm font-medium text-slate-900 outline-none"
        >
          {adapters.map((adapter) => (
            <option key={adapter.definition.id} value={adapter.definition.id}>
              {adapter.definition.name}
            </option>
          ))}
        </select>
        <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden />
      </div>

      <Button
        disabled={!activeAdapter || activeAdapter.status === "checking"}
        onClick={() => void checkTool(activeToolId)}
        size="sm"
        variant="secondary"
      >
        <RefreshCw className="h-4 w-4" aria-hidden />
        Check
      </Button>
      <Button
        disabled={isCheckingAll}
        onClick={() => void checkAllTools()}
        size="sm"
        variant="ghost"
      >
        {isCheckingAll ? "Checking..." : "Check All"}
      </Button>
    </div>
  );
}
