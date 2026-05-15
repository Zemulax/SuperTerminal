# SuperTerminal

SuperTerminal is a local-first desktop shell for working with AI coding CLI tools from one focused interface.

Phase 1 adds a real local project file explorer. It still does not execute terminal commands, detect installed tools, install CLIs, manage credentials, or upload project code.

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
- Terminal placeholder panel
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

## Build

```powershell
npm.cmd run build
npm.cmd run tauri:build
```

## Current Boundaries

SuperTerminal does not bundle or replace Codex CLI, Claude CLI, OpenCode, OpenClaude, Grok CLI, or any other third-party CLI. Future phases may add explicit detection, launch, install guidance, PTY hosting, project context injection, and transcript capture.
