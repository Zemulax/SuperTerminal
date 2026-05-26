use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidateInstallCommandRequest {
    pub adapter_id: String,
    pub command: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InstallCommandValidationResult {
    pub is_allowed: bool,
    pub requires_manual_execution: bool,
    pub is_blocked: bool,
    pub reason: String,
    pub command: String,
    pub executable: Option<String>,
    pub args: Vec<String>,
    pub warnings: Vec<String>,
}

pub fn validate_install_command(
    request: ValidateInstallCommandRequest,
) -> Result<InstallCommandValidationResult, String> {
    Ok(validate_command_text(&request.command))
}

pub fn validate_command_text(command: &str) -> InstallCommandValidationResult {
    let trimmed = command.trim();

    if trimmed.is_empty() {
        return manual_only(trimmed, "Configure an install command before running it.");
    }

    if is_manual_guidance(trimmed) {
        return manual_only(
            trimmed,
            "This adapter provides installation guidance, not an executable command.",
        );
    }

    if let Some(fragment) = destructive_fragment(trimmed) {
        return blocked(
            trimmed,
            &format!("Install command contains a blocked destructive fragment: {fragment}."),
        );
    }

    if trimmed.to_ascii_lowercase().contains("sudo") {
        return manual_only(
            trimmed,
            "Commands requiring sudo must be run manually outside SuperTerminal v1.",
        );
    }

    if let Some(operator) = complex_operator(trimmed) {
        return manual_only(
            trimmed,
            &format!(
                "Commands with shell operators such as {operator} must be run manually in v1."
            ),
        );
    }

    let tokens = match parse_command_line(trimmed) {
        Ok(tokens) if !tokens.is_empty() => tokens,
        Ok(_) => return manual_only(trimmed, "Configure an install command before running it."),
        Err(reason) => return manual_only(trimmed, &reason),
    };

    let executable = tokens[0].clone();
    let args = tokens[1..].to_vec();
    let command_name = normalized_command_name(&executable);

    if let Some(action) = allowed_package_manager_action(&command_name, &args) {
        return InstallCommandValidationResult {
            is_allowed: true,
            requires_manual_execution: false,
            is_blocked: false,
            reason: format!("Allowed simple package-manager {action} command."),
            command: trimmed.to_string(),
            executable: Some(executable),
            args,
            warnings: vec![
                format!("This command may modify your system by {action}ing packages."),
                "SuperTerminal will run exactly the command shown after confirmation."
                    .to_string(),
            ],
        };
    }

    if is_harmless_test_pattern(&command_name, &args) {
        return InstallCommandValidationResult {
            is_allowed: true,
            requires_manual_execution: false,
            is_blocked: false,
            reason: "Allowed harmless local output command for install-flow testing."
                .to_string(),
            command: trimmed.to_string(),
            executable: Some(executable),
            args,
            warnings: vec![
                "This is a test command, not a real tool installation.".to_string(),
            ],
        };
    }

    manual_only(
        trimmed,
        "Only simple package-manager install/uninstall commands are executable in SuperTerminal v1.",
    )
}

fn manual_only(command: &str, reason: &str) -> InstallCommandValidationResult {
    InstallCommandValidationResult {
        is_allowed: false,
        requires_manual_execution: true,
        is_blocked: false,
        reason: reason.to_string(),
        command: command.to_string(),
        executable: None,
        args: Vec::new(),
        warnings: vec!["Copy this command and run it manually if you trust it.".to_string()],
    }
}

fn blocked(command: &str, reason: &str) -> InstallCommandValidationResult {
    InstallCommandValidationResult {
        is_allowed: false,
        requires_manual_execution: false,
        is_blocked: true,
        reason: reason.to_string(),
        command: command.to_string(),
        executable: None,
        args: Vec::new(),
        warnings: vec!["SuperTerminal will not run this command.".to_string()],
    }
}

fn is_manual_guidance(command: &str) -> bool {
    let lower = command.to_ascii_lowercase();
    lower.starts_with("see ")
        || lower.contains("official installation instructions")
        || lower.contains("configure install command")
        || lower.contains("configure manually")
}

fn destructive_fragment(command: &str) -> Option<&'static str> {
    let lower = command.to_ascii_lowercase();
    ["rm -rf", "del /s", "format", "shutdown", "reboot"]
        .into_iter()
        .find(|fragment| lower.contains(fragment))
}

fn complex_operator(command: &str) -> Option<&'static str> {
    [
        "&&", "||", ";", "|", ">", "<", "`", "$(", "&",
    ]
    .into_iter()
    .find(|operator| command.contains(operator))
}

fn parse_command_line(command: &str) -> Result<Vec<String>, String> {
    let mut tokens = Vec::new();
    let mut current = String::new();
    let mut chars = command.chars().peekable();
    let mut quote: Option<char> = None;

    while let Some(ch) = chars.next() {
        match ch {
            '"' | '\'' => {
                if quote == Some(ch) {
                    quote = None;
                } else if quote.is_none() {
                    quote = Some(ch);
                } else {
                    current.push(ch);
                }
            }
            '\\' if quote == Some('"') => {
                if let Some(next) = chars.peek().copied() {
                    if next == '"' || next == '\\' {
                        let _ = chars.next();
                        current.push(next);
                    } else {
                        current.push(ch);
                    }
                } else {
                    current.push(ch);
                }
            }
            value if value.is_whitespace() && quote.is_none() => {
                if !current.is_empty() {
                    tokens.push(current.clone());
                    current.clear();
                }
            }
            value => current.push(value),
        }
    }

    if quote.is_some() {
        return Err("Command has an unterminated quote and must be run manually.".to_string());
    }

    if !current.is_empty() {
        tokens.push(current);
    }

    Ok(tokens)
}

fn normalized_command_name(executable: &str) -> String {
    let file_name = Path::new(executable)
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or(executable)
        .to_ascii_lowercase();

    for suffix in [".exe", ".cmd", ".bat"] {
        if let Some(stripped) = file_name.strip_suffix(suffix) {
            return stripped.to_string();
        }
    }

    file_name
}

fn allowed_package_manager_action(command_name: &str, args: &[String]) -> Option<&'static str> {
    match command_name {
        "npm" if args.len() >= 3
            && args[0] == "install"
            && args[1] == "-g"
            && args[2..].iter().all(is_package_token) => Some("install"),
        "npm" if args.len() >= 3
            && ["uninstall", "remove", "rm"].contains(&args[0].as_str())
            && args[1] == "-g"
            && args[2..].iter().all(is_package_token) => Some("uninstall"),
        "pnpm" if args.len() >= 3
            && args[0] == "add"
            && args[1] == "-g"
            && args[2..].iter().all(is_package_token) => Some("install"),
        "pnpm" if args.len() >= 3
            && ["remove", "rm"].contains(&args[0].as_str())
            && args[1] == "-g"
            && args[2..].iter().all(is_package_token) => Some("uninstall"),
        "yarn" if args.len() >= 3
            && args[0] == "global"
            && args[1] == "add"
            && args[2..].iter().all(is_package_token) => Some("install"),
        "yarn" if args.len() >= 3
            && args[0] == "global"
            && ["remove", "rm"].contains(&args[1].as_str())
            && args[2..].iter().all(is_package_token) => Some("uninstall"),
        "cargo" if args.len() >= 2
            && args[0] == "install"
            && args[1..].iter().all(is_package_token) => Some("install"),
        "cargo" if args.len() >= 2
            && args[0] == "uninstall"
            && args[1..].iter().all(is_package_token) => Some("uninstall"),
        "pipx" if args.len() >= 2
            && args[0] == "install"
            && args[1..].iter().all(is_package_token) => Some("install"),
        "pipx" if args.len() >= 2
            && args[0] == "uninstall"
            && args[1..].iter().all(is_package_token) => Some("uninstall"),
        "python" | "python3" | "py" if args.len() >= 4
            && args[0] == "-m"
            && args[1] == "pip"
            && args[2] == "install"
            && args[3..].iter().all(is_package_token) => Some("install"),
        "python" | "python3" | "py" if args.len() >= 4
            && args[0] == "-m"
            && args[1] == "pip"
            && ["uninstall", "remove"].contains(&args[2].as_str())
            && args[3..].iter().all(is_package_token) => Some("uninstall"),
        _ => None,
    }
}

fn is_harmless_test_pattern(command_name: &str, args: &[String]) -> bool {
    match command_name {
        "cmd" => args.len() >= 2
            && args[0].eq_ignore_ascii_case("/c")
            && args[1].eq_ignore_ascii_case("echo"),
        "echo" => !args.is_empty(),
        _ => false,
    }
}

fn is_package_token(token: &String) -> bool {
    !token.trim().is_empty()
        && !token.starts_with('-')
        && token
            .chars()
            .all(|ch| ch.is_ascii_alphanumeric() || matches!(ch, '@' | '/' | '-' | '_' | '.' | ':'))
}
