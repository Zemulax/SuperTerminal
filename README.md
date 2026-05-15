# SuperTerminal

SuperTerminal is a local-first desktop shell for working with AI coding CLI tools from one focused interface.

Phase 3 adds a real local PTY-backed terminal host. It still does not detect tools, install CLIs, manage credentials, inject prompts, or upload project code.

## What Is Included

- Tauri v2 desktop app scaffold
- React + TypeScript + Vite frontend
- Tailwind CSS styling
- shadcn/ui-compatible component structure
- Zustand stores for project, tool, and session state
- Mock tool switcher for Codex CLI, Claude CLI, OpenCode, OpenClaude, Grok CLI, and Generic CLI
- Demo project fallback
- Real local project folder scanning
- Expandable file explorer
- Safe text file preview
- xterm.js terminal UI shell
- Rust/Tauri PTY host for one local shell session
- Frontend-only demo terminal sessions
- Session/status panel
- Settings placeholder
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

## Demo Terminal

After opening a project, click `Start Terminal` in the terminal toolbar. SuperTerminal starts a local shell in the selected project folder and streams it through xterm.js.

On Windows the default shell is `powershell.exe`, with `cmd.exe` fallback. On macOS/Linux the default comes from `SHELL`, then `/bin/bash`, then `/bin/sh`.

Input is forwarded directly to the local PTY session. This supports normal shell interaction such as typing, Enter, Ctrl+C, arrow keys where the shell supports them, and pasted text.

Click `Stop Terminal` to kill the hosted shell session. Natural shell exit is detected and updates the UI.

## Demo Terminal

`Demo Mode` remains available as a frontend-only fallback. The xterm surface writes a demo banner with the selected tool and project context.

Typing is captured locally in frontend state. Pressing Enter prints a no-execution message and returns to the prompt. No command is spawned in demo mode.

## Build

```powershell
npm.cmd run build
npm.cmd run tauri:build
```

## Current Boundaries

SuperTerminal does not bundle or replace Codex CLI, Claude CLI, OpenCode, OpenClaude, Grok CLI, or any other third-party CLI. Future phases may add explicit detection, launch, install guidance, PTY hosting, project context injection, and transcript capture.
