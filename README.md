# SuperTerminal

SuperTerminal is a local-first desktop shell for working with AI coding CLI tools from one focused interface.

Phase 6 adds per-tool launch profiles and clearer tool switching around one shared local PTY surface. SuperTerminal can launch configured tools with tool-specific args and working-directory behavior, but it still does not bundle CLIs, manage credentials, inject prompts, or upload project code.

## What Is Included

- Tauri v2 desktop app scaffold
- React + TypeScript + Vite frontend
- Tailwind CSS styling
- shadcn/ui-compatible component structure
- Zustand stores for project, tool, and session state
- Tool Adapter Registry for Codex CLI, Claude CLI, OpenCode, OpenClaude, Grok CLI, and Generic CLI
- Local version/status checks with short timeouts
- Command overrides stored in frontend local state
- Launch previews for ready adapters
- Per-tool launch profiles for args, launch mode, working directory, and confirmation
- Direct launch of ready adapters through the local PTY host
- Guided install command validation and confirmation
- Captured install output and in-session install history
- Demo project fallback
- Real local project folder scanning
- Expandable file explorer
- Safe text file preview
- xterm.js terminal UI shell
- Rust/Tauri PTY host for one local shell session
- Frontend-only demo terminal sessions
- Session/status panel
- Settings panel with adapter, install, and launch profile configuration
- Rust/Tauri filesystem commands for project scanning and file preview

## Prerequisites

- Node.js
- npm
- Rust and Cargo
- Tauri system prerequisites for your operating system

On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm`.

If Tauri cannot find Cargo but Rust is installed, add Cargo to the current shell path:

```powershell
$env:PATH="$env:USERPROFILE\.cargo\bin;$env:PATH"
```

## Setup

```powershell
npm.cmd install
```

## Run Frontend Only

```powershell
npm.cmd run dev
```

The Vite dev server runs at `http://localhost:1420`.

## Run Desktop App

```powershell
npm.cmd run tauri:dev
```

## Open A Project

Phase 1 uses a local path input instead of a native folder dialog.

1. Run the desktop app.
2. Paste a local project folder path into the Project sidebar.
3. Click `Open`.
4. Expand folders and select files in the sidebar.

The scanner skips noisy folders such as `.git`, `node_modules`, `dist`, `build`, `.next`, `target`, `.venv`, `.vscode`, and related cache folders.

## File Preview

Safe text files can be previewed read-only in the sidebar. Supported examples include `.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.md`, `.txt`, `.css`, `.html`, `.rs`, `.py`, `.toml`, `.yaml`, and `.xml`.

Secret/env files such as `.env` are never previewed. Large files are truncated at 100 KB. Binary files are rejected.

## Real Terminal

After opening a project, click `Start Terminal` in the terminal toolbar. SuperTerminal starts a local shell in the selected project folder and streams it through xterm.js.

On Windows the default shell is `powershell.exe`, with `cmd.exe` fallback. On macOS/Linux the default comes from `SHELL`, then `/bin/bash`, then `/bin/sh`.

Input is forwarded directly to the local PTY session. This supports normal shell interaction such as typing, Enter, Ctrl+C, arrow keys where the shell supports them, and pasted text.

Click `Stop Terminal` to kill the hosted shell session. Natural shell exit is detected and updates the UI.

## Demo Terminal

`Demo Mode` remains available as a frontend-only fallback. The xterm surface writes a demo banner with the selected tool and project context.

Typing is captured locally in frontend state. Pressing Enter prints a no-execution message and returns to the prompt. No command is spawned in demo mode.

## Tool Adapters

Open Settings to inspect adapter definitions, command overrides, status, detected version output, install command previews, and install overrides.

Use `Check` for one adapter or `Check All` from the header switcher. Detection only runs short local version commands such as `codex --version` or `claude --version`.

Generic CLI starts as `needs setup`. Set its command override to a command available on your machine, such as `powershell.exe` or `cmd.exe` on Windows, then run `Check`.

After opening a project and checking a ready adapter, use `Build Launch Preview` in Settings or `Launch Tool` in the terminal toolbar. Launch starts the selected command with that adapter's launch profile through the local PTY host. No prompts or project context are injected.

## Launch Profiles

Each adapter has a launch profile stored in frontend local state:

- command from the adapter command override or default command
- raw launch args, parsed into process args
- launch mode: `PTY` or `Manual preview`
- working directory mode: project root, home directory, or custom path
- confirm before launch

Use `Edit Profile` in the terminal toolbar or the Launch Profile section on each Settings adapter card. Args support whitespace-separated values and simple quoted values. The command itself is changed through the adapter command override, not through the launch profile.

Only one PTY session can run at a time. If you switch tools while a shell or tool is active, SuperTerminal keeps the current session running, shows which tool is active, and blocks launching another tool until you stop the session.

## Guided Installation

If an adapter is missing, Settings shows its install command preview and setup controls. SuperTerminal does not bundle or redistribute tools; it only runs the command shown after explicit confirmation.

Use `Validate Install` to classify a command before running it. `Install with SuperTerminal` opens a confirmation dialog showing the exact command and working directory. After completion, SuperTerminal captures stdout/stderr, adds the attempt to in-session history, and re-checks the adapter.

Allowed v1 install patterns are intentionally narrow:

```powershell
npm install -g <package>
pnpm add -g <package>
yarn global add <package>
cargo install <package>
pipx install <package>
python -m pip install <package>
```

Commands with `sudo`, shell pipelines, redirects, or command chaining are manual-only. Destructive fragments such as `rm -rf`, `del /s`, `format`, `shutdown`, and `reboot` are blocked.

For harmless install-flow testing on Windows, set an install override such as:

```powershell
cmd /c echo SuperTerminal install test
```

That test command is allowed only to exercise confirmation, output capture, and history. It does not install a tool.

## Build

```powershell
npm.cmd run build
npm.cmd run tauri:build
```

## Current Boundaries

SuperTerminal does not bundle or replace Codex CLI, Claude CLI, OpenCode, OpenClaude, Grok CLI, or any other third-party CLI. Future phases may add project context injection, stronger adapter launch templates, and transcript capture.
