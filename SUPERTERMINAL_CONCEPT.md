# SuperTerminal

**One interface for every coding agent CLI.**

SuperTerminal is a local-first desktop app that gives developers one common interface for running AI coding CLI tools such as Codex CLI, OpenCode, OpenClaude, Grok CLI, Claude CLI, and other agent tools.

SuperTerminal does **not** bundle, redistribute, replace, or compete with those tools. Instead, it detects installed tools, helps users install missing tools through official install commands, launches tools inside a richer embedded terminal experience, and keeps each tool session organised around the selected project folder.

The goal is simple:

> Keep your agents. Use them from one place.

---

## Core Idea

Developers increasingly use multiple coding agents and CLI tools:

- Codex CLI
- Claude CLI
- OpenCode
- OpenClaude
- Grok CLI
- Aider
- Gemini CLI
- Custom local tools
- Framework CLIs
- Build/test/lint commands

Each tool has its own install command, launch command, auth flow, terminal behaviour, prompt style, and output.

SuperTerminal provides one shared desktop surface for them.

It gives the user:

- a project folder/file explorer
- a top tool switcher for agent CLIs
- an embedded interactive terminal
- per-tool adapter configuration
- install guidance for missing tools
- session history
- command/output capture
- optional context injection
- safer visibility into what is being executed

SuperTerminal is not a full DevOS workflow manager. It is the lean terminal-first version of the same idea.

---

## What SuperTerminal Is

SuperTerminal is a **desktop control surface for coding CLIs**.

It provides:

1. A common UI for multiple agent tools
2. Project-folder awareness
3. Embedded PTY terminal sessions
4. Tool detection and configuration
5. Guided installation for missing tools
6. Context/prompt preparation
7. Session tracking and output history
8. A richer terminal experience around coding agents

It is the layer that connects tools, not the tool that replaces them.

---

## What SuperTerminal Is Not

SuperTerminal is **not**:

- bundling or redistributing third-party CLI binaries
- managing user credentials or API keys for external tools
- competing with Codex, Claude, OpenClaude, OpenCode, Grok, or similar tools
- replacing the terminal entirely
- a full IDE
- a cloud agent platform
- a team collaboration platform
- an autonomous multi-agent system in v1

SuperTerminal provides a richer interface on top of local tools and terminals.

---

## Product Positioning

### One-sentence pitch

**SuperTerminal is a local-first desktop terminal for running all your coding agent CLIs from one project-aware interface.**

### Alternative pitch

**A unified terminal cockpit for Codex, Claude, OpenCode, OpenClaude, Grok, and your other coding agents.**

### Short tagline options

- One terminal. Every coding agent.
- Your AI coding CLIs, one workspace.
- A shared cockpit for agentic development.
- Stop juggling agent terminals.
- The terminal layer for coding agents.

---

## Why This Exists

The current AI coding workflow is fragmented.

A developer may have:

- one terminal running Codex
- another running Claude
- another running OpenCode
- browser tabs for docs
- VS Code open for files
- Git status in another shell
- prompts copied between tools
- install commands scattered across documentation

The pain is not only switching tools. The pain is that every tool lives in a separate terminal context.

SuperTerminal solves this by giving every tool a shared project-aware shell.

---

## MVP Goal

The MVP should prove one thing:

> A developer can open a project folder, choose an agent tool, launch it in an embedded terminal, and manage installed/missing tools from one clean desktop app.

The first MVP should focus on:

1. Opening a local project folder
2. Displaying project files
3. Detecting configured CLI tools
4. Showing installed/missing tool status
5. Launching tools inside an embedded PTY terminal
6. Supporting guided install commands
7. Capturing session metadata and output previews
8. Letting users switch between tool sessions

Do not build the full DevOS workflow system first.

---

## Main Interface

SuperTerminal has three core regions:

```text
┌─────────────────────────────────────────────────────────────┐
│ Header: Project name | Tool switcher | Status | Settings    │
├───────────────────────┬─────────────────────────────────────┤
│ Project Files         │ Active Tool Terminal                │
│                       │                                     │
│ folder tree           │ Codex / Claude / OpenCode / etc.    │
│ changed files         │                                     │
│ detected commands     │ interactive PTY terminal            │
│                       │                                     │
├───────────────────────┴─────────────────────────────────────┤
│ Session footer: current tool | cwd | status | transcript     │
└─────────────────────────────────────────────────────────────┘
```

---

## Core UI Sections

### 1. Header / Tool Switcher

The header lets users switch between available agent tools.

Example tabs/buttons:

- Codex
- Claude
- OpenCode
- OpenClaude
- Grok
- Gemini
- Aider
- Custom

Each tool shows a status:

- Ready
- Missing
- Needs setup
- Running
- Error

The header should also show:

- active project name
- current tool
- install/setup warnings
- settings shortcut

---

### 2. Project Files Section

A left sidebar showing the selected project folder.

MVP features:

- open project folder
- file tree
- basic file icons
- search/filter files
- show current Git branch if available
- show changed file count if Git repo
- show detected project type
- show detected commands

This is not a full editor in v1.

File actions for MVP:

- open file preview
- copy relative path
- reveal in system file explorer
- mark file as context for prompt

---

### 3. Tool Terminal Area

The main panel is an embedded interactive terminal using a PTY.

MVP features:

- start tool session
- stop tool session
- send keyboard input
- stream output
- resize terminal
- clear terminal view
- copy output
- optional transcript preview
- switch between active tool sessions

This is the heart of the app.

---

### 4. Tool Setup / Adapter Panel

Each tool has an adapter card.

Adapter card shows:

- tool name
- description
- command
- detected status
- detected version
- install command preview
- launch command preview
- command override
- install command override
- check status button
- install button if safe
- open terminal button

---

### 5. Session History

SuperTerminal should store basic session history locally.

A session record should include:

- tool name
- project path
- working directory
- started time
- ended time
- status
- exit code if available
- transcript preview if enabled
- command used

This is useful for debugging and recall.

---

## Tool Adapter System

A Tool Adapter defines how SuperTerminal interacts with a CLI tool.

Each adapter should define:

- id
- display name
- description
- default command
- detection command
- version command
- install command preview
- launch mode
- supported context injection modes
- default context injection mode

Example adapter definition:

```ts
export type ToolAdapter = {
  id: string;
  displayName: string;
  description: string;
  defaultCommand: string;
  detectionArgs: string[][];
  installCommandPreview?: string;
  supportedInjectionModes: ContextInjectionMode[];
  defaultInjectionMode: ContextInjectionMode;
  launchMode: "pty" | "manual" | "external";
};
```

---

## Default Tool Adapters

### Codex CLI

```text
Adapter ID: codex
Display Name: Codex CLI
Default command: codex
Detection: codex --version, codex -V
Install preview: npm install -g @openai/codex
Launch mode: PTY
Default injection: clipboard
```

---

### Claude CLI

```text
Adapter ID: claude
Display Name: Claude CLI
Default command: claude
Detection: claude --version, claude -v
Install preview: manual / official instructions unless user configures one
Launch mode: PTY
Default injection: clipboard
```

---

### OpenCode

```text
Adapter ID: opencode
Display Name: OpenCode
Default command: opencode
Detection: opencode --version, opencode -v
Install preview: configurable
Launch mode: PTY
Default injection: clipboard
```

---

### OpenClaude

```text
Adapter ID: openclaude
Display Name: OpenClaude
Default command: openclaude
Detection: openclaude --version, openclaude -v
Install preview: configurable
Launch mode: PTY
Default injection: clipboard
```

---

### Grok CLI

```text
Adapter ID: grok
Display Name: Grok CLI
Default command: grok
Detection: grok --version, grok -v
Install preview: configurable
Launch mode: PTY
Default injection: clipboard
```

---

### Generic CLI

```text
Adapter ID: generic
Display Name: Generic CLI Tool
Default command: user-configured
Detection: user-configured
Install preview: user-configured
Launch mode: PTY
Default injection: manual
```

---

## Adapter Statuses

Supported statuses:

```text
unknown
checking
ready
installed
missing
needs_setup
needs_auth
misconfigured
running
error
```

Definitions:

- `unknown`: not checked yet
- `checking`: status check in progress
- `ready`: installed and launchable
- `installed`: detected but may need auth/setup
- `missing`: command not found
- `needs_setup`: install command or launch command is missing
- `needs_auth`: tool likely requires login/auth handled by the tool itself
- `misconfigured`: configured command/path is invalid
- `running`: active session exists
- `error`: unexpected failure

---

## Guided Tool Installation

SuperTerminal can help install missing tools, but it does not bundle anything.

Install flow:

```text
Tool missing
↓
Show install command
↓
User reviews command
↓
User confirms
↓
SuperTerminal runs command locally
↓
Output streams in terminal panel
↓
SuperTerminal re-checks tool status
```

Rules:

- no silent installs
- no bundled binaries
- no redistribution
- no credential management
- no automatic login
- no hidden commands
- user sees exact command before execution
- user can copy command instead of running it

---

## Install Safety Rules

Install commands should be validated before execution.

Block or mark as manual-only if command contains:

```text
&&
||
;
|
>
<
`
$()
sudo
rm -rf
del /s
format
shutdown
reboot
```

Allowed simple examples:

```text
npm install -g @openai/codex
pnpm add -g some-tool
yarn global add some-tool
cargo install some-tool
pipx install some-tool
```

If SuperTerminal is unsure, it should show the command and ask the user to run it manually.

---

## Context Injection

SuperTerminal can prepare context and pass it to tools.

Injection modes:

```text
manual
clipboard
prompt_file
stdin
args
```

### Manual

Show generated prompt/context. User handles it.

### Clipboard

Copy context to clipboard and launch the tool. User pastes manually.

### Prompt File

Write context to a safe app-data prompt file and pass or show the file path.

### Stdin

Launch tool and write context into stdin after user confirms.

### Args

Pass short context as command arguments. Use carefully because of size/security limits.

Default MVP mode should be `clipboard` because it is safest.

---

## Project Context

SuperTerminal does not need the full DevOS Project Context Graph in the lean MVP.

But it should support a basic context builder:

- selected project path
- project stack summary
- selected files
- current Git branch
- changed files
- user-written task/prompt
- detected commands

This can later evolve into the full DevOS context system.

---

## MVP User Flow

```text
1. User opens SuperTerminal
2. User selects a project folder
3. SuperTerminal scans basic project metadata
4. SuperTerminal detects configured CLI tools
5. Header shows Codex / Claude / OpenCode / OpenClaude / Grok tabs
6. User clicks Codex
7. If Codex is missing, SuperTerminal shows setup/install options
8. If Codex is ready, user clicks Start Session
9. Codex opens inside embedded terminal
10. User interacts with Codex normally
11. User switches to Claude tab
12. Claude session opens or resumes
13. User prepares context from selected files/task
14. SuperTerminal copies/injects context into selected tool
15. Session history is saved locally
```

---

## Recommended Tech Stack

This project should keep the same general stack as DevOS.

### Desktop App

**Tauri**

Reason:

- lightweight desktop app
- good native access
- Rust backend fits process/PTY work
- easier local-first architecture

---

### Frontend

**React + TypeScript**

Use:

- React
- TypeScript
- Tailwind CSS
- shadcn/ui-style components
- Zustand for state
- xterm.js for terminal UI

Recommended packages:

```text
@xterm/xterm
@xterm/addon-fit
zustand
lucide-react
```

---

### Native Layer

**Rust via Tauri**

Responsibilities:

- project folder access
- file scanning
- Git status commands
- PTY process hosting
- tool detection
- tool installation command execution
- SQLite persistence
- app-data prompt file creation

Recommended Rust crates:

```text
portable-pty
serde
serde_json
uuid
chrono
sqlx or rusqlite
```

---

### Local Database

**SQLite**

Use SQLite for:

- projects
- tool adapters
- tool configs
- terminal sessions
- install attempts
- context injections
- settings

Keep the data model smaller than DevOS.

---

## Suggested Folder Structure

```text
superterminal/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── providers.tsx
│   │
│   ├── components/
│   │   ├── layout/
│   │   ├── files/
│   │   ├── terminal/
│   │   ├── tools/
│   │   └── ui/
│   │
│   ├── workspaces/
│   │   ├── TerminalWorkspace/
│   │   ├── ToolSetupWorkspace/
│   │   └── SettingsWorkspace/
│   │
│   ├── stores/
│   │   ├── projectStore.ts
│   │   ├── toolAdapterStore.ts
│   │   ├── terminalSessionStore.ts
│   │   ├── installStore.ts
│   │   └── contextStore.ts
│   │
│   ├── lib/
│   │   ├── types.ts
│   │   ├── adapters.ts
│   │   ├── contextBuilder.ts
│   │   └── utils.ts
│   │
│   └── styles/
│       └── globals.css
│
├── src-tauri/
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands/
│   │   │   ├── project.rs
│   │   │   ├── terminal.rs
│   │   │   ├── tool_adapters.rs
│   │   │   ├── installation.rs
│   │   │   └── context_injection.rs
│   │   │
│   │   ├── services/
│   │   │   ├── project_scanner.rs
│   │   │   ├── pty_service.rs
│   │   │   ├── adapter_registry.rs
│   │   │   ├── install_service.rs
│   │   │   └── context_service.rs
│   │   │
│   │   └── db/
│   │       ├── mod.rs
│   │       ├── migrations.rs
│   │       └── models.rs
│   │
│   └── Cargo.toml
│
├── package.json
├── README.md
└── CONCEPT.md
```

---

## Lean Data Model

### projects

```sql
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  stack_summary TEXT,
  current_branch TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_opened_at TEXT
);
```

---

### tool_adapter_configs

```sql
CREATE TABLE IF NOT EXISTS tool_adapter_configs (
  adapter_id TEXT PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 1,
  command_override TEXT,
  install_command_override TEXT,
  default_injection_mode TEXT,
  launch_mode TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

---

### terminal_sessions

```sql
CREATE TABLE IF NOT EXISTS terminal_sessions (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  adapter_id TEXT,
  tool_name TEXT NOT NULL,
  command TEXT NOT NULL,
  working_directory TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  exit_code INTEGER,
  transcript_preview TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL
);
```

---

### install_attempts

```sql
CREATE TABLE IF NOT EXISTS install_attempts (
  id TEXT PRIMARY KEY,
  adapter_id TEXT NOT NULL,
  command TEXT NOT NULL,
  working_directory TEXT,
  status TEXT NOT NULL,
  exit_code INTEGER,
  stdout_preview TEXT,
  stderr_preview TEXT,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

---

### context_injections

```sql
CREATE TABLE IF NOT EXISTS context_injections (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  adapter_id TEXT NOT NULL,
  terminal_session_id TEXT,
  injection_mode TEXT NOT NULL,
  payload_title TEXT NOT NULL,
  payload_preview TEXT,
  payload_char_count INTEGER NOT NULL,
  prompt_file_path TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY(terminal_session_id) REFERENCES terminal_sessions(id) ON DELETE SET NULL
);
```

---

### settings

```sql
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

---

## MVP Features

### Phase 1 — App Shell

- Tauri + React + TypeScript scaffold
- header tool switcher
- project file sidebar
- terminal area placeholder
- settings panel

---

### Phase 2 — Project Folder Support

- open local folder
- scan basic project files
- show file tree
- detect Git branch/status
- detect simple stack summary

---

### Phase 3 — PTY Terminal

- embedded xterm.js UI
- Rust PTY host
- start shell in project folder
- stream output
- send input
- resize terminal
- stop session

---

### Phase 4 — Tool Adapter Registry

- define default adapters
- detect installed tools
- show tool statuses
- command override
- launch preview
- adapter settings

---

### Phase 5 — Tool Sessions

- launch selected tool in PTY
- switch between tool tabs
- session status
- session history
- transcript preview

---

### Phase 6 — Guided Installation

- show install command preview
- validate install command
- confirmation modal
- run safe install commands
- stream output
- re-check adapter after install

---

### Phase 7 — Context Builder + Injection

- select files as context
- write task prompt
- generate context payload
- copy to clipboard
- create prompt file
- inject via stdin where user confirms

---

### Phase 8 — Polish + Full Flow Testing

- error states
- settings persistence
- session cleanup
- Windows/macOS/Linux checks
- UX polish
- packaging

---

## Safety Principles

1. **No bundling**
   SuperTerminal does not ship third-party CLI binaries.

2. **No silent installs**
   Every install command is shown before execution.

3. **No credential management**
   Tools handle their own auth/login flows.

4. **No hidden commands**
   Users see launch/install commands.

5. **No automatic prompt injection**
   Context injection requires confirmation.

6. **Local-first**
   Project paths, sessions, transcripts, and settings stay local.

7. **User control first**
   SuperTerminal accelerates workflows but does not take over.

---

## UX Principles

- Make tool state obvious
- Make commands visible
- Make install/setup friction low
- Keep terminal interaction familiar
- Keep tool switching fast
- Avoid pretending to be an IDE
- Do not overcomplicate v1 with review/PR/memory systems
- Treat the terminal as the main product surface

---

## MVP Success Criteria

The MVP is successful if a user can:

1. Open a local project folder
2. See the project files
3. See available/missing coding tools
4. Install or configure a missing tool through guided setup
5. Launch Codex/Claude/OpenCode/etc. in an embedded terminal
6. Switch between tool sessions
7. Copy or inject a prepared context prompt
8. Stop sessions safely
9. Reopen the app and see previous sessions/tool configs

If this works, SuperTerminal proves the core concept.

---

## Relationship To DevOS

SuperTerminal can be treated as either:

1. a lean spin-off product, or
2. an isolated test branch of DevOS focused only on PTY/tool adapter execution.

DevOS is the broader project operating system:

- tasks
- runs
- handoffs
- reviews
- PR drafts
- Project Context Graph
- validation workflow

SuperTerminal is the execution-focused core:

- project folder
- tool switcher
- embedded terminal
- adapters
- guided install
- context injection

A successful SuperTerminal can later become the execution layer inside DevOS.

---

## Final Product Definition

SuperTerminal is a local-first desktop app that gives developers one project-aware terminal interface for all their AI coding CLI tools.

It does not bundle tools, manage credentials, or compete with agent providers.

It detects tools, helps install them transparently, launches them in embedded terminals, and provides a common UI for working with coding agents from one place.
