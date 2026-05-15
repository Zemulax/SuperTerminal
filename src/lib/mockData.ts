import type { Project, ToolAdapterDefinition, ToolDefinition } from "./types";

export const defaultToolAdapters: ToolAdapterDefinition[] = [
  {
    id: "codex",
    name: "Codex CLI",
    description: "OpenAI Codex CLI for AI-assisted coding workflows.",
    defaultCommand: "codex",
    detectionArgs: [["--version"], ["-V"]],
    installCommandPreview: "npm install -g @openai/codex",
  },
  {
    id: "claude",
    name: "Claude CLI",
    description: "Claude command-line coding assistant.",
    defaultCommand: "claude",
    detectionArgs: [["--version"], ["-v"]],
    installCommandPreview: "See official Claude CLI installation instructions.",
  },
  {
    id: "opencode",
    name: "OpenCode",
    description: "OpenCode-compatible AI coding CLI.",
    defaultCommand: "opencode",
    detectionArgs: [["--version"], ["-v"]],
    installCommandPreview: "Configure install command in settings.",
  },
  {
    id: "openclaude",
    name: "OpenClaude",
    description: "OpenClaude-compatible AI coding CLI.",
    defaultCommand: "openclaude",
    detectionArgs: [["--version"], ["-v"]],
    installCommandPreview: "Configure install command in settings.",
  },
  {
    id: "grok",
    name: "Grok CLI",
    description: "Grok-compatible AI coding CLI.",
    defaultCommand: "grok",
    detectionArgs: [["--version"], ["-v"]],
    installCommandPreview: "Configure install command in settings.",
  },
  {
    id: "generic",
    name: "Generic CLI",
    description: "User-configured CLI tool.",
    defaultCommand: "custom-tool",
    detectionArgs: [
      ["--version"],
      ["-v"],
      ["-Command", "$PSVersionTable.PSVersion.ToString()"],
      ["/c", "ver"],
    ],
    installCommandPreview: "Configure manually.",
  },
];

export const mockTools: ToolDefinition[] = defaultToolAdapters.map((definition) => ({
  ...definition,
  status: definition.id === "generic" ? "needs_setup" : "not_checked",
  installCommand: definition.installCommandPreview,
}));

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
