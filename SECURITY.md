# Security Policy

SuperTerminal is a local-first desktop app that interacts with local shells, CLI tools, project folders, context prompts, and optional API key environment variables.

Security and privacy issues are taken seriously.

## Reporting a Vulnerability

Please do not open public GitHub issues for security vulnerabilities.

If you discover a vulnerability involving any of the following, please report it privately:

- API key or secret leakage
- Unsafe command execution
- Tool installation behaviour
- Context injection behaviour
- Transcript capture or redaction
- Project file exposure
- Path traversal or filesystem access issues
- PTY/session handling issues

Use GitHub Security Advisories if available for this repository, or contact the maintainer through the contact method listed in the README.

## Security Principles

SuperTerminal should:

- Keep project data local
- Avoid silent command execution
- Require confirmation before running install commands
- Require confirmation before injecting context into tools
- Avoid storing API keys in plaintext
- Avoid including secrets in prompts, prompt files, diagnostics, or transcript previews
- Avoid uploading project files, terminal output, transcripts, or API keys

## Supported Versions

SuperTerminal is currently in public alpha.

Security fixes will target the latest public release unless otherwise stated.

## Third-Party Tools

SuperTerminal can launch third-party CLI tools, but it does not bundle or redistribute them.

Third-party tools are governed by their own licenses, security policies, and terms of service.
