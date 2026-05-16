export type ToolAdapterId =
  | "codex"
  | "claude"
  | "opencode"
  | "openclaude"
  | "grok"
  | "generic"
  | string;

export type ToolStatus =
  | "not_checked"
  | "checking"
  | "ready"
  | "missing"
  | "needs_setup"
  | "error";

export type ToolAdapterDefinition = {
  id: ToolAdapterId;
  name: string;
  description: string;
  defaultCommand: string;
  detectionArgs: string[][];
  installCommandPreview?: string;
};

export type ToolAdapterConfig = {
  adapterId: ToolAdapterId;
  enabled: boolean;
  commandOverride?: string;
  installCommandOverride?: string;
};

export type ToolAdapterState = {
  definition: ToolAdapterDefinition;
  config: ToolAdapterConfig;
  status: ToolStatus;
  resolvedCommand: string;
  version?: string;
  message?: string;
  lastCheckedAt?: string;
};

export type ToolDefinition = ToolAdapterDefinition & {
  status: ToolStatus;
  resolvedCommand?: string;
  version?: string;
  message?: string;
  installCommand?: string;
};

export type ToolCheckResult = {
  status: ToolStatus;
  resolvedCommand: string;
  version?: string;
  message: string;
};

export type ToolLaunchSpec = {
  adapterId: ToolAdapterId;
  name: string;
  command: string;
  args: string[];
  workingDirectory: string;
  launchMode: ToolLaunchMode;
  preview: string;
  warnings: string[];
};

export type ToolLaunchMode = "pty" | "manual";

export type ToolWorkingDirectoryMode = "project_root" | "home" | "custom";

export type ToolLaunchProfile = {
  adapterId: ToolAdapterId;
  command: string;
  args: string[];
  rawArgs: string;
  launchMode: ToolLaunchMode;
  workingDirectoryMode: ToolWorkingDirectoryMode;
  customWorkingDirectory?: string;
  confirmBeforeLaunch: boolean;
};

export type InstallAttemptStatus =
  | "planned"
  | "running"
  | "succeeded"
  | "failed"
  | "manual_only"
  | "blocked"
  | "cancelled";

export type InstallCommandValidationResult = {
  isAllowed: boolean;
  requiresManualExecution: boolean;
  isBlocked: boolean;
  reason: string;
  command: string;
  executable?: string;
  args: string[];
  warnings: string[];
};

export type InstallAttemptResult = {
  id: string;
  adapterId: ToolAdapterId;
  command: string;
  status: InstallAttemptStatus;
  exitCode?: number;
  stdout: string;
  stderr: string;
  startedAt: string;
  completedAt?: string;
  message: string;
};

export type ContextInjectionMode =
  | "manual"
  | "clipboard"
  | "prompt_file"
  | "stdin";

export type ContextInjectionStatus =
  | "prepared"
  | "copied"
  | "file_created"
  | "injected"
  | "failed";

export type ContextOptions = {
  includeProjectSummary: boolean;
  includeFileTreeSummary: boolean;
  includeSelectedFileMetadata: boolean;
  includeSelectedFilePreview: boolean;
  includeUserTask: boolean;
  includeToolInformation: boolean;
  includeDefaultInstructions: boolean;
};

export type ContextPayloadInput = {
  project?: Project;
  selectedFile?: ProjectFileNode;
  filePreview?: TextFilePreview;
  previewError?: string;
  tool?: ToolAdapterState;
  userTask: string;
  options: ContextOptions;
};

export type ContextPromptFileRecord = {
  path: string;
  sizeBytes: number;
  createdAt: string;
};

export type ContextInjectionRecord = {
  id: string;
  toolId: string;
  toolName: string;
  mode: ContextInjectionMode | "launch_and_inject";
  status: ContextInjectionStatus;
  characterCount: number;
  promptFilePath?: string;
  sessionId?: string;
  message: string;
  createdAt: string;
};

export type TerminalSessionKind =
  | "shell"
  | "tool"
  | "install"
  | "context_injection";

export type TerminalSessionRecord = {
  id: string;
  kind: TerminalSessionKind;
  projectName?: string;
  projectPath?: string;
  workingDirectory: string;
  toolId?: string;
  toolName?: string;
  command: string;
  args: string[];
  launchPreview: string;
  status: Exclude<TerminalSessionStatus, "idle">;
  startedAt: string;
  endedAt?: string;
  exitCode?: number;
  transcriptCaptured: boolean;
  transcriptPreview?: string;
  transcriptCharCount?: number;
  contextInjectionIds?: string[];
};

export type HistorySettings = {
  saveSessionHistory: boolean;
  captureTranscript: boolean;
  transcriptMaxChars: number;
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
  | "exited"
  | "failed";

export type TerminalMode = "demo" | "pty";

export type TerminalSession = {
  id: string;
  projectId?: string;
  toolId?: string;
  status: TerminalSessionStatus;
  startedAt?: string;
  endedAt?: string;
};

export type PtySessionRecord = {
  id: string;
  projectPath: string;
  shell: string;
  label?: string;
  status: string;
  cols: number;
  rows: number;
  startedAt: string;
  endedAt?: string;
  exitCode?: number;
};

export type PtyOutputEvent = {
  sessionId: string;
  data: string;
};

export type PtyExitEvent = {
  sessionId: string;
  exitCode?: number;
  status: "stopped" | "exited" | "failed";
};

export type PtyErrorEvent = {
  sessionId: string;
  message: string;
};

export type PtyStatusEvent = {
  sessionId: string;
  status: TerminalSessionStatus;
};
