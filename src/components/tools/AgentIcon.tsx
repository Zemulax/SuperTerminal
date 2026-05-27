import claudeIcon from "@/assets/agents/claude-code.svg";
import codexIcon from "@/assets/agents/codex.svg";
import buffIcon from "@/assets/agents/buff.png";
import geminiIcon from "@/assets/agents/gemini-cli.svg";
import gitlawbIcon from "@/assets/agents/gitlawb.png";
import gooseIcon from "@/assets/agents/goose.svg";
import grokIcon from "@/assets/agents/grok.svg";
import opencodeIcon from "@/assets/agents/opencode.svg";
import { getAgentIconLabel } from "@/lib/statusIcons";
import { cn } from "@/lib/utils";

type AgentIconProps = {
  iconKey?: string;
  name: string;
  muted?: boolean;
  className?: string;
  size?: number;
};

const agentIconAssets: Record<string, string | undefined> = {
  aider: undefined,
  claude: claudeIcon,
  codebuff: buffIcon,
  codex: codexIcon,
  freebuff: buffIcon,
  gemini: geminiIcon,
  goose: gooseIcon,
  grok: grokIcon,
  opencode: opencodeIcon,
  openclaude: gitlawbIcon,
};

export function AgentIcon({
  className,
  iconKey,
  muted = false,
  name,
  size = 22,
}: AgentIconProps) {
  const iconSrc = iconKey ? agentIconAssets[iconKey] : undefined;
  const label = getAgentIconLabel(iconKey, name);

  if (iconSrc) {
    return (
      <span
        aria-hidden
        className={cn(
          "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border bg-white shadow-sm",
          muted
            ? "border-slate-200 opacity-45 grayscale"
            : "border-violet-200",
          className,
        )}
        style={{ height: size, width: size }}
        title={name}
      >
        <img
          alt=""
          className="h-full w-full object-contain"
          draggable={false}
          src={iconSrc}
        />
      </span>
    );
  }

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
