import type { Project, ToolDefinition } from "./types";

export const mockTools: ToolDefinition[] = [
  {
    id: "codex",
    name: "Codex CLI",
    description: "OpenAI coding agent CLI for local project work.",
    defaultCommand: "codex",
    installCommand: "npm install -g @openai/codex",
    status: "ready",
  },
  {
    id: "claude",
    name: "Claude CLI",
    description: "Anthropic Claude command line workflow for coding tasks.",
    defaultCommand: "claude",
    status: "needs_setup",
  },
  {
    id: "opencode",
    name: "OpenCode",
    description: "Open source terminal agent interface for software projects.",
    defaultCommand: "opencode",
    status: "missing",
  },
  {
    id: "openclaude",
    name: "OpenClaude",
    description: "Community Claude-compatible coding CLI adapter.",
    defaultCommand: "openclaude",
    status: "not_checked",
  },
  {
    id: "grok",
    name: "Grok CLI",
    description: "Grok-powered terminal workflow placeholder.",
    defaultCommand: "grok",
    status: "missing",
  },
  {
    id: "generic",
    name: "Generic CLI",
    description: "Bring your own coding CLI command later.",
    defaultCommand: "<custom-command>",
    status: "not_checked",
  },
];

export const mockProject: Project = {
  id: "budget-cargo",
  name: "budget-cargo",
  path: "C:\\Users\\mozay\\Projects\\budget-cargo",
  files: [
    {
      name: "src",
      path: "src",
      relativePath: "src",
      nodeType: "directory",
      children: [
        {
          name: "api",
          path: "src/api",
          relativePath: "src/api",
          nodeType: "directory",
          children: [],
        },
        {
          name: "components",
          path: "src/components",
          relativePath: "src/components",
          nodeType: "directory",
          children: [],
        },
        {
          name: "pages",
          path: "src/pages",
          relativePath: "src/pages",
          nodeType: "directory",
          children: [],
        },
      ],
    },
    {
      name: "package.json",
      path: "package.json",
      relativePath: "package.json",
      nodeType: "file",
      extension: "json",
      sizeBytes: 1184,
    },
    {
      name: "README.md",
      path: "README.md",
      relativePath: "README.md",
      nodeType: "file",
      extension: "md",
      sizeBytes: 2048,
    },
    {
      name: "tailwind.config.js",
      path: "tailwind.config.js",
      relativePath: "tailwind.config.js",
      nodeType: "file",
      extension: "js",
      sizeBytes: 720,
    },
  ],
  totalFiles: 3,
  totalDirectories: 4,
  ignoredCount: 0,
  truncated: false,
};
