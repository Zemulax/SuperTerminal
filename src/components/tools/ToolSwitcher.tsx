import { ChevronDown, TerminalSquare } from "lucide-react";
import { useToolStore } from "@/stores/toolStore";
import { cn } from "@/lib/utils";

export function ToolSwitcher() {
  const tools = useToolStore((state) => state.tools);
  const activeToolId = useToolStore((state) => state.activeToolId);
  const setActiveTool = useToolStore((state) => state.setActiveTool);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="hidden items-center gap-1 rounded-md border border-border bg-white p-1 xl:flex">
        {tools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => setActiveTool(tool.id)}
            className={cn(
              "flex h-8 items-center gap-2 rounded px-2.5 text-xs font-medium text-slate-600 transition-colors",
              activeToolId === tool.id
                ? "bg-slate-950 text-white"
                : "hover:bg-slate-100 hover:text-slate-950",
            )}
          >
            {tool.name}
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
          {tools.map((tool) => (
            <option key={tool.id} value={tool.id}>
              {tool.name}
            </option>
          ))}
        </select>
        <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden />
      </div>

    </div>
  );
}
