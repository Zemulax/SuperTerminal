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
