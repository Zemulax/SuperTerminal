import { Search, X } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { AgentIcon } from "@/components/tools/AgentIcon";
import { useToolStore } from "@/stores/toolStore";
import { getToolStatusLabel } from "@/lib/statusIcons";
import { cn } from "@/lib/utils";
import type { AgentCategory, ToolAdapterState } from "@/lib/types";

type AgentCataloguePanelProps = {
  open: boolean;
  onClose: () => void;
};

const categories: Array<{ value: AgentCategory | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "coding-agent", label: "Coding agents" },
  { value: "assistant-cli", label: "Assistant CLIs" },
  { value: "custom", label: "Custom" },
  { value: "experimental", label: "Experimental" },
];

export function AgentCataloguePanel({ open, onClose }: AgentCataloguePanelProps) {
  const adapters = useToolStore((state) => state.adapters);
  const searchQuery = useToolStore((state) => state.searchQuery);
  const selectedCategory = useToolStore((state) => state.selectedCategory);
  const setSearchQuery = useToolStore((state) => state.setCatalogueSearchQuery);
  const setCategory = useToolStore((state) => state.setCatalogueCategory);
  const addAgent = useToolStore((state) => state.addAgentToSuperTerminal);
  const removeAgent = useToolStore((state) => state.removeAgentFromSuperTerminal);
  const pinAgent = useToolStore((state) => state.pinAgent);
  const unpinAgent = useToolStore((state) => state.unpinAgent);
  const checkTool = useToolStore((state) => state.checkTool);
  const entries = useMemo(
    () => filterCatalogue(adapters, searchQuery, selectedCategory),
    [adapters, searchQuery, selectedCategory],
  );

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="flex max-h-[86vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-border bg-white shadow-shell">
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <div>
            <div className="text-sm font-semibold text-slate-950">
              Agent Catalogue
            </div>
            <div className="text-xs text-slate-500">
              Local setup profiles only. SuperTerminal does not bundle or
              redistribute these tools.
            </div>
          </div>
          <Button aria-label="Close Agent Catalogue" onClick={onClose} size="icon" variant="ghost">
            <X className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        <div className="border-b border-border bg-slate-50 px-5 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                className="h-10 w-full rounded-md border border-border bg-white pl-9 pr-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search agents, tags, or commands"
                value={searchQuery}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  className={cn(
                    "rounded-md border px-3 py-2 text-xs font-medium transition",
                    selectedCategory === category.value
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-border bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950",
                  )}
                  key={category.value}
                  onClick={() => setCategory(category.value)}
                  type="button"
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs leading-5 text-slate-500">
            Add creates an Agent Profile in Settings. Pin controls whether that
            agent appears in the top ribbon.
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-5">
          <div className="grid gap-4 lg:grid-cols-2">
            {entries.map((agent) => (
              <AgentCatalogueCard
                agent={agent}
                key={agent.definition.id}
                onAdd={() => addAgent(agent.definition.id)}
                onCheck={() => void checkTool(agent.definition.id)}
                onPin={() => pinAgent(agent.definition.id)}
                onRemove={() => removeAgent(agent.definition.id)}
                onUnpin={() => unpinAgent(agent.definition.id)}
              />
            ))}
          </div>
          {entries.length === 0 ? (
            <div className="rounded-md border border-border bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No agents match this search.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function filterCatalogue(
  adapters: ToolAdapterState[],
  searchQuery: string,
  selectedCategory: AgentCategory | "all",
) {
  const query = searchQuery.trim().toLowerCase();

  return adapters.filter((adapter) => {
    const categoryMatch =
      selectedCategory === "all" ||
      adapter.definition.category === selectedCategory;
    const searchable = [
      adapter.definition.name,
      adapter.definition.shortName,
      adapter.definition.description,
      adapter.definition.defaultCommand,
      ...(adapter.definition.tags ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return categoryMatch && (!query || searchable.includes(query));
  });
}

function AgentCatalogueCard({
  agent,
  onAdd,
  onCheck,
  onPin,
  onRemove,
  onUnpin,
}: {
  agent: ToolAdapterState;
  onAdd: () => void;
  onCheck: () => void;
  onPin: () => void;
  onRemove: () => void;
  onUnpin: () => void;
}) {
  const isAdded = Boolean(agent.config.addedToSuperTerminal);
  const isPinned = Boolean(agent.config.pinnedToRibbon);
  const isMissing = ["missing", "not_checked", "error"].includes(agent.status);

  return (
    <article className="rounded-lg border border-border bg-white p-4">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border",
            isMissing
              ? "border-slate-200 bg-slate-100 text-slate-400"
              : "border-violet-200 bg-violet-50 text-violet-800",
          )}
        >
          <AgentIcon
            iconKey={agent.definition.iconKey}
            muted={isMissing}
            name={agent.definition.name}
            size={30}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-medium text-slate-950">
                {agent.definition.name}
              </div>
              <p className="mt-1 text-sm leading-5 text-slate-500">
                {agent.definition.description}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded px-2 py-1 text-[11px] font-medium",
                isAdded
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-600",
              )}
            >
              {isAdded ? "Added" : "Not added"}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {(agent.definition.tags ?? []).map((tag) => (
              <span
                className="rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-600"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <Info label="Command" value={agent.resolvedCommand} />
            <Info label="Status" value={getToolStatusLabel(agent.status)} />
            <Info
              label="Install"
              value={agent.definition.installCommandPreview ?? "Configure manually."}
            />
            <Info
              label="Ribbon"
              value={isPinned ? "Pinned" : isAdded ? "Not pinned" : "Not added"}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {isAdded ? (
              <>
                <Button onClick={onCheck} size="sm" variant="secondary">
                  Check
                </Button>
                <Button onClick={isPinned ? onUnpin : onPin} size="sm" variant="ghost">
                  {isPinned ? "Unpin" : "Pin"}
                </Button>
                <Button onClick={onRemove} size="sm" variant="ghost">
                  Remove
                </Button>
              </>
            ) : (
              <Button onClick={onAdd} size="sm" variant="primary">
                Add to SuperTerminal
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded border border-border bg-slate-50 px-2 py-1.5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 truncate font-mono text-[11px] text-slate-700" title={value}>
        {value}
      </div>
    </div>
  );
}
