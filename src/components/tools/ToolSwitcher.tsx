import { ChevronDown, RefreshCw, TerminalSquare } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/stores/sessionStore";
import { useToolStore } from "@/stores/toolStore";
import { getCompactToolName, getToolStatusIcon, getToolStatusLabel } from "@/lib/statusIcons";
import { cn } from "@/lib/utils";

export function ToolSwitcher() {
  const allAdapters = useToolStore((state) => state.adapters);
  const adapters = useMemo(
    () => allAdapters.filter((adapter) => adapter.definition.id !== "generic"),
    [allAdapters],
  );
  const activeToolId = useToolStore((state) => state.activeToolId);
  const isCheckingAll = useToolStore((state) => state.isCheckingAll);
  const setActiveTool = useToolStore((state) => state.setActiveTool);
  const checkTool = useToolStore((state) => state.checkTool);
  const checkAllTools = useToolStore((state) => state.checkAllTools);
  const runningToolId = useSessionStore((state) => state.activeToolId);
  const sessionStatus = useSessionStore((state) => state.sessionStatus);
  const activeAdapter =
    adapters.find((adapter) => adapter.definition.id === activeToolId) ??
    adapters[0];

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="hidden min-w-0 max-w-full items-center gap-1 overflow-x-auto rounded-md border border-border bg-white p-1 xl:flex">
        {adapters.map((adapter) => (
          <button
            key={adapter.definition.id}
            type="button"
            onClick={() => setActiveTool(adapter.definition.id)}
            className={cn(
              "flex h-8 shrink-0 items-center gap-1.5 rounded px-2 text-xs font-medium text-slate-600 transition-colors",
              activeToolId === adapter.definition.id
                ? "bg-slate-950 text-white"
                : "hover:bg-slate-100 hover:text-slate-950",
            )}
            title={`${adapter.definition.name}: ${getToolStatusLabel(adapter.status)}. ${adapter.message ?? ""}`}
          >
            <span>{getCompactToolName(adapter.definition.name)}</span>
            <span
              className={cn(
                "rounded border px-1 py-0.5 font-mono text-[10px] leading-none",
                activeToolId === adapter.definition.id
                  ? "border-white/20 bg-white/10 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-600",
              )}
              aria-label={getToolStatusLabel(adapter.status)}
            >
              {getToolStatusIcon(adapter.status)}
            </span>
            {sessionStatus === "active" && runningToolId === adapter.definition.id ? (
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em]",
                  activeToolId === adapter.definition.id
                    ? "bg-emerald-400/20 text-emerald-100"
                    : "bg-emerald-50 text-emerald-700",
                )}
              >
                running
              </span>
            ) : null}
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
              {getCompactToolName(adapter.definition.name)} {getToolStatusIcon(adapter.status)}
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
