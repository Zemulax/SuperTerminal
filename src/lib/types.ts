export type ToolStatus = "ready" | "missing" | "needs_setup" | "not_checked";

export type ToolDefinition = {
  id: string;
  name: string;
  description: string;
  defaultCommand: string;
  installCommand?: string;
  status: ToolStatus;
};

export type ProjectFileNode = {
  name: string;
  path: string;
  relativePath: string;
  nodeType: "file" | "directory";
  extension?: string;
  sizeBytes?: number;
  children?: ProjectFileNode[];
};

export type Project = {
  id: string;
  name: string;
  path: string;
  files: ProjectFileNode[];
  totalFiles?: number;
  totalDirectories?: number;
  ignoredCount?: number;
  truncated?: boolean;
};

export type ProjectScanResult = {
  name: string;
  path: string;
  files: ProjectFileNode[];
  totalFiles: number;
  totalDirectories: number;
  ignoredCount: number;
  truncated: boolean;
};

export type ProjectPathValidation = {
  exists: boolean;
  isDirectory: boolean;
  readable: boolean;
  message: string;
};

export type TextFilePreview = {
  path: string;
  relativePath: string;
  content: string;
  truncated: boolean;
  sizeBytes: number;
};

export type TerminalSessionStatus =
  | "idle"
  | "starting"
  | "active"
  | "stopped"
  | "failed";

export type TerminalSession = {
  id: string;
  projectId?: string;
  toolId: string;
  status: TerminalSessionStatus;
  startedAt?: string;
  endedAt?: string;
};
