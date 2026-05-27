import { ChevronDown, Plus, RefreshCw, TerminalSquare } from "lucide-react";
import { AgentIcon } from "@/components/tools/AgentIcon";
import { useSessionStore } from "@/stores/sessionStore";
import { useToolStore } from "@/stores/toolStore";
import {
  getCompactToolName,
  getToolStatusLabel,
} from "@/lib/statusIcons";
import { cn } from "@/lib/utils";
import type { ToolAdapterState, ToolStatus } from "@/lib/types";

type ToolSwitcherProps = {
  onOpenCatalogue: () => void;
};

export function ToolSwitcher({ onOpenCatalogue }: ToolSwitcherProps) {
  const activeToolId = useToolStore((state) => state.activeToolId);
  const tools = useToolStore((state) => state.tools);
  const getPinnedAgents = useToolStore((state) => state.getPinnedAgents);
  const isCheckingAll = useToolStore((state) => state.isCheckingAll);
  const setActiveTool = useToolStore((state) => state.setActiveTool);
  const checkTool = useToolStore((state) => state.checkTool);
  const checkAllTools = useToolStore((state) => state.checkAllTools);
  const runningToolId = useSessionStore((state) => state.activeToolId);
  const sessionStatus = useSessionStore((state) => state.sessionStatus);
  const pinnedAgents = getPinnedAgents();
  const activeAdapter =
    tools.find((adapter) => adapter.definition.id === activeToolId) ??
    pinnedAgents[0] ??
    tools[0];

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="hidden min-w-0 max-w-full items-center gap-1 overflow-x-auto rounded-md border border-border bg-white p-1 xl:flex">
        {pinnedAgents.map((adapter) => (
          <AgentIconButton
            adapter={adapter}
            isActive={activeToolId === adapter.definition.id}
            isRunning={
              sessionStatus === "active" && runningToolId === adapter.definition.id
            }
            key={adapter.definition.id}
            onClick={() => setActiveTool(adapter.definition.id)}
          />
        ))}
        <button
          aria-label="Open Agent Catalogue"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
          onClick={onOpenCatalogue}
          title="Open Agent Catalogue"
          type="button"
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 xl:hidden">
        <TerminalSquare className="h-4 w-4 text-slate-500" aria-hidden />
        <select
          aria-label="Select active agent"
          value={activeToolId}
          onChange={(event) => setActiveTool(event.target.value)}
          className="max-w-40 bg-transparent text-sm font-medium text-slate-900 outline-none"
        >
          {tools.map((adapter) => (
            <option key={adapter.definition.id} value={adapter.definition.id}>
              {getCompactToolName(adapter.definition.shortName ?? adapter.definition.name)}
            </option>
          ))}
        </select>
        <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden />
        <button
          aria-label="Open Agent Catalogue"
          className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-950"
          onClick={onOpenCatalogue}
          type="button"
        >
          <Plus className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <button
        aria-label="Check selected agent"
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-950 disabled:opacity-50"
        disabled={!activeAdapter || activeAdapter.status === "checking"}
        onClick={() => void checkTool(activeToolId)}
        title="Check selected agent"
        type="button"
      >
        <RefreshCw className="h-4 w-4" aria-hidden />
      </button>
      <button
        className="h-9 rounded-md border border-border bg-white px-3 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-950 disabled:opacity-50"
        disabled={isCheckingAll}
        onClick={() => void checkAllTools()}
        type="button"
      >
        {isCheckingAll ? "Checking" : "Check All"}
      </button>
    </div>
  );
}

function AgentIconButton({
  adapter,
  isActive,
  isRunning,
  onClick,
}: {
  adapter: ToolAdapterState;
  isActive: boolean;
  isRunning: boolean;
  onClick: () => void;
}) {
  const isMuted = ["missing", "not_checked", "error"].includes(adapter.status);
  return (
    <button
      aria-label={`Select ${adapter.definition.name}`}
      className={cn(
        "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-md border transition",
        isActive
          ? "border-emerald-400 bg-slate-950 text-white shadow-[0_0_0_2px_rgba(52,211,153,0.16)]"
          : isMuted
            ? "border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950",
      )}
      onClick={onClick}
      title={`${adapter.definition.name}: ${getToolStatusLabel(adapter.status)}. ${adapter.resolvedCommand}`}
      type="button"
    >
      <AgentIcon
        iconKey={adapter.definition.iconKey}
        muted={!isActive && isMuted}
        name={adapter.definition.name}
        size={30}
      />
      <span
        className={cn(
          "absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-white",
          statusDotClass(adapter.status),
          isActive && "ring-2 ring-emerald-200",
          isRunning && "animate-pulse bg-emerald-400",
        )}
        title={isRunning ? "Running" : getToolStatusLabel(adapter.status)}
      />
      {isActive ? (
        <span className="absolute -bottom-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
      ) : null}
    </button>
  );
}

function statusDotClass(status: ToolStatus) {
  switch (status) {
    case "ready":
      return "bg-emerald-400";
    case "missing":
    case "error":
      return "bg-slate-300";
    case "needs_setup":
      return "bg-amber-400";
    case "checking":
      return "animate-pulse bg-blue-400";
    case "not_checked":
    default:
      return "bg-slate-300";
  }
}
