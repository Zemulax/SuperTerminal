import { TerminalSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ToolStatusBadge } from "@/components/tools/ToolStatusBadge";
import type { ToolDefinition } from "@/lib/types";

type ToolCardProps = {
  tool: ToolDefinition;
};

export function ToolCard({ tool }: ToolCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-700">
            <TerminalSquare className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-slate-950">{tool.name}</div>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              {tool.description}
            </p>
          </div>
        </div>
        <ToolStatusBadge status={tool.status} />
      </div>
      <div className="mt-4 rounded-md border border-border bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600">
        {tool.defaultCommand}
      </div>
    </Card>
  );
}
