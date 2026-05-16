import type { ContextPayloadInput, ProjectFileNode } from "@/lib/types";
import { formatBytes } from "@/lib/utils";

const MAX_TREE_LINES = 150;

export function buildContextPayload(input: ContextPayloadInput) {
  const lines: string[] = ["# SuperTerminal Context", ""];
  const { project, selectedFile, filePreview, previewError, tool, options } = input;

  if (options.includeProjectSummary) {
    lines.push("## Project", "");
    if (project) {
      lines.push(`Name: ${project.name}`);
      lines.push(`Path: ${project.path}`);
      lines.push(`Files: ${project.totalFiles ?? "unknown"}`);
      lines.push(`Directories: ${project.totalDirectories ?? "unknown"}`);
      if (project.truncated) {
        lines.push("Scan note: file tree scan was truncated.");
      }
    } else {
      lines.push("No project selected.");
    }
    lines.push("");
  }

  if (options.includeToolInformation) {
    lines.push("## Selected Tool", "");
    if (tool) {
      lines.push(`Tool: ${tool.definition.name}`);
      lines.push(`Command: ${tool.resolvedCommand}`);
      lines.push(`Status: ${tool.status}`);
    } else {
      lines.push("No tool selected.");
    }
    lines.push("");
  }

  if (options.includeFileTreeSummary) {
    lines.push("## Project Files", "");
    if (project) {
      const summary = buildFileTreeSummary(project.name, project.files);
      lines.push(...summary.lines);
      if (summary.truncated) {
        lines.push("");
        lines.push(`... truncated after ${MAX_TREE_LINES} lines ...`);
      }
    } else {
      lines.push("No project file tree available.");
    }
    lines.push("");
  }

  if (options.includeSelectedFileMetadata) {
    lines.push("## Selected File", "");
    if (selectedFile) {
      const isEnv = isEnvLikeFile(selectedFile.name);
      lines.push(`Path: ${selectedFile.relativePath}`);
      lines.push(`Extension: ${selectedFile.extension ?? "none"}`);
      lines.push(`Size: ${formatBytes(selectedFile.sizeBytes)}`);
      lines.push(
        `Preview included: ${
          options.includeSelectedFilePreview && filePreview && !isEnv
            ? "yes"
            : "no"
        }`,
      );
      lines.push(
        `Preview truncated: ${
          options.includeSelectedFilePreview && filePreview?.truncated ? "yes" : "no"
        }`,
      );

      if (options.includeSelectedFilePreview) {
        lines.push("");
        if (isEnv) {
          lines.push("Selected file preview is blocked for privacy/safety.");
        } else if (filePreview?.content) {
          lines.push("```");
          lines.push(filePreview.content);
          lines.push("```");
        } else {
          lines.push(previewError ?? "Selected file preview is not loaded.");
        }
      }
    } else {
      lines.push("No file selected.");
    }
    lines.push("");
  }

  if (options.includeUserTask) {
    lines.push("## User Task", "");
    lines.push(input.userTask.trim() || "No task provided.");
    lines.push("");
  }

  if (options.includeDefaultInstructions) {
    lines.push("## Instructions", "");
    lines.push("You are working inside this local project through SuperTerminal.");
    lines.push("");
    lines.push("Please:");
    lines.push("- Respect the existing project structure.");
    lines.push("- Keep changes focused.");
    lines.push("- Do not modify unrelated files.");
    lines.push("- Explain what you changed.");
    lines.push("- Tell me what commands/tests I should run.");
    lines.push("- If you need more context, ask before making large assumptions.");
    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}

function buildFileTreeSummary(projectName: string, nodes: ProjectFileNode[]) {
  const lines = [`${projectName}/`];
  let truncated = false;

  function walk(children: ProjectFileNode[], depth: number) {
    for (const node of children) {
      if (lines.length >= MAX_TREE_LINES) {
        truncated = true;
        return;
      }

      const suffix = node.nodeType === "directory" ? "/" : "";
      lines.push(`${"  ".repeat(depth)}${node.name}${suffix}`);

      if (node.nodeType === "directory" && node.children) {
        walk(node.children, depth + 1);
        if (truncated) {
          return;
        }
      }
    }
  }

  walk(nodes, 1);
  return { lines, truncated };
}

function isEnvLikeFile(name: string) {
  const normalized = name.toLowerCase();
  return normalized === ".env" || normalized.startsWith(".env.");
}
