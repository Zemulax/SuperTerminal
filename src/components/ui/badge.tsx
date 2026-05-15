import type { HTMLAttributes } from "react";
import { cn, formatStatusLabel } from "@/lib/utils";
import type { ToolStatus } from "@/lib/types";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  status?: ToolStatus | "active" | "idle" | "stopped" | "failed" | "starting";
};

const statusClasses: Record<string, string> = {
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  missing: "border-rose-200 bg-rose-50 text-rose-700",
  needs_setup: "border-amber-200 bg-amber-50 text-amber-700",
  not_checked: "border-slate-200 bg-slate-50 text-slate-600",
  active: "border-cyan-200 bg-cyan-50 text-cyan-700",
  idle: "border-slate-200 bg-slate-50 text-slate-600",
  stopped: "border-slate-200 bg-slate-50 text-slate-600",
  failed: "border-rose-200 bg-rose-50 text-rose-700",
  starting: "border-blue-200 bg-blue-50 text-blue-700",
};

export function Badge({ className, status, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-medium capitalize leading-none",
        status ? statusClasses[status] : "border-border bg-white text-slate-600",
        className,
      )}
      {...props}
    >
      {children ?? (status ? formatStatusLabel(status) : null)}
    </span>
  );
}
