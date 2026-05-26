# Contributing to SuperTerminal

Thank you for your interest in contributing to SuperTerminal.

SuperTerminal is a local-first desktop app for launching, prompting, and tracking AI coding agents and CLI tools from one interface.

## Contribution License

By submitting a pull request or other contribution to this repository, you agree that your contribution is licensed under the Apache License 2.0.

## Development Principles

Please keep contributions aligned with SuperTerminal's core principles:

- Local-first by default
- No silent command execution
- No bundled third-party CLI binaries
- No hidden credential handling
- No uploading project files, API keys, transcripts, or terminal output without explicit user consent
- Clear confirmation before installing tools or injecting context
- Respect user control over terminals, agents, and environment variables

## What SuperTerminal Is Not

SuperTerminal is not:

- A replacement for Codex, Claude, OpenCode, OpenClaude, Grok, or other coding agents
- A distributor of third-party CLI tools
- A cloud agent platform
- An API key broker
- A tool that silently installs software or runs commands without confirmation

## Pull Request Guidelines

Before opening a pull request:

1. Keep the change focused.
2. Explain what changed and why.
3. Include screenshots for UI changes where useful.
4. Mention any security/privacy impact.
5. Avoid adding heavy dependencies without justification.
6. Run the relevant checks/build commands.

## Development Setup

Install dependencies:

```bash
npm install
```

Run the frontend only:

```bash
npm run dev
```

Run the app in development:

```bash
npm run tauri:dev
```

Build the frontend:

```bash
npm run build
```

Build the app:

```bash
npm run tauri:build
```

## Security-Sensitive Changes

Changes involving command execution, PTY behaviour, API keys, environment variables, transcript capture, tool installation, or context injection should be reviewed carefully.

Please explain the safety model in the pull request description.
