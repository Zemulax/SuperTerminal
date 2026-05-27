import { getAgentIconLabel } from "@/lib/statusIcons";
import { cn } from "@/lib/utils";

type AgentIconProps = {
  iconKey?: string;
  name: string;
  muted?: boolean;
  className?: string;
  size?: number;
};

export function AgentIcon({
  className,
  iconKey,
  muted = false,
  name,
  size = 22,
}: AgentIconProps) {
  const label = getAgentIconLabel(iconKey, name);

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md border font-mono font-bold leading-none tracking-tight",
        label.length > 2 ? "text-[9px]" : "text-[10px]",
        muted
          ? "border-slate-200 bg-slate-100 text-slate-400"
          : "border-violet-200 bg-white text-violet-700 shadow-sm",
        className,
      )}
      style={{ height: size, width: size }}
      title={name}
    >
      {label}
    </span>
  );
}
