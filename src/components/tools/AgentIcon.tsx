import ClaudeCodeColor from "@lobehub/icons/es/ClaudeCode/components/Color";
import ClaudeCodeMono from "@lobehub/icons/es/ClaudeCode/components/Mono";
import CodexColor from "@lobehub/icons/es/Codex/components/Color";
import CodexMono from "@lobehub/icons/es/Codex/components/Mono";
import GeminiCLIColor from "@lobehub/icons/es/GeminiCLI/components/Color";
import GeminiCLIMono from "@lobehub/icons/es/GeminiCLI/components/Mono";
import GooseMono from "@lobehub/icons/es/Goose/components/Mono";
import GrokMono from "@lobehub/icons/es/Grok/components/Mono";
import OpenCodeMono from "@lobehub/icons/es/OpenCode/components/Mono";
import type { ComponentType } from "react";
import { getAgentIconLabel } from "@/lib/statusIcons";
import { cn } from "@/lib/utils";

type LobeIcon = ComponentType<{
  className?: string;
  color?: string;
  size?: number | string;
  title?: string;
}>;

type AgentIconPair = {
  color: LobeIcon;
  mono: LobeIcon;
};

const lobeIcons: Record<string, AgentIconPair | undefined> = {
  claude: { color: ClaudeCodeColor, mono: ClaudeCodeMono },
  codex: { color: CodexColor, mono: CodexMono },
  gemini: { color: GeminiCLIColor, mono: GeminiCLIMono },
  goose: { color: GooseMono, mono: GooseMono },
  grok: { color: GrokMono, mono: GrokMono },
  opencode: { color: OpenCodeMono, mono: OpenCodeMono },
};

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
  const Icon = iconKey ? lobeIcons[iconKey] : undefined;

  if (Icon) {
    const BrandIcon = muted ? Icon.mono : Icon.color;

    return (
      <BrandIcon
        aria-hidden
        className={cn(muted && "text-slate-400", className)}
        size={size}
        title={name}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn("font-mono text-[11px] font-semibold", className)}
    >
      {getAgentIconLabel(iconKey, name)}
    </span>
  );
}
