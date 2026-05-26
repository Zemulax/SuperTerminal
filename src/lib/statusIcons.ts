import type { ToolStatus } from "@/lib/types";

export function getToolStatusIcon(status: ToolStatus): string {
  switch (status) {
    case "ready":
      return "OK";
    case "missing":
      return "X";
    case "needs_setup":
      return "!";
    case "checking":
      return "...";
    case "error":
      return "ERR";
    case "not_checked":
    default:
      return "?";
  }
}

export function getToolStatusLabel(status: ToolStatus): string {
  switch (status) {
    case "ready":
      return "Ready";
    case "missing":
      return "Missing";
    case "needs_setup":
      return "Needs setup";
    case "checking":
      return "Checking";
    case "error":
      return "Error";
    case "not_checked":
    default:
      return "Not checked";
  }
}

export function getCompactToolName(name: string): string {
  return name.replace(" CLI", "").replace("OpenClaude", "OpenClaude");
}

export function getAgentIconLabel(iconKey?: string, name = ""): string {
  switch (iconKey) {
    case "codex":
      return "Cx";
    case "claude":
      return "Cl";
    case "opencode":
      return "OC";
    case "openclaude":
      return "OCl";
    case "grok":
      return "G";
    case "codebuff":
      return "Cb";
    case "freebuff":
      return "Fb";
    case "aider":
      return "Ai";
    case "gemini":
      return "Ge";
    case "goose":
      return "Go";
    case "generic":
      return "+";
    default:
      return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .slice(0, 3)
        .toUpperCase();
  }
}
