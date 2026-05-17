use serde::{Deserialize, Serialize};
use std::{
    io::Read,
    path::{Path, PathBuf},
    process::{Command, Stdio},
    thread,
    time::{Duration, Instant},
};

use crate::services::{command_resolver, file_scanner};

const TOOL_CHECK_TIMEOUT: Duration = Duration::from_secs(5);
const OUTPUT_LIMIT: usize = 600;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CheckToolRequest {
    pub command: String,
    pub detection_args: Vec<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BuildToolLaunchSpecRequest {
    pub command: String,
    pub args: Vec<String>,
    pub project_path: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolCheckResult {
    pub status: String,
    pub resolved_command: String,
    pub version: Option<String>,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolLaunchSpecRecord {
    pub command: String,
    pub args: Vec<String>,
    pub working_directory: String,
    pub preview: String,
}

struct ProcessResult {
    code: Option<i32>,
    stdout: String,
    stderr: String,
    timed_out: bool,
}

pub fn check_tool(request: CheckToolRequest) -> Result<ToolCheckResult, String> {
    let command = request.command.trim();

    if command.is_empty() {
        return Ok(ToolCheckResult {
            status: "needs_setup".to_string(),
            resolved_command: String::new(),
            version: None,
            message: "Configure a command before checking this adapter.".to_string(),
        });
    }

    let detection_args = if request.detection_args.is_empty() {
        vec![vec!["--version".to_string()]]
    } else {
        request.detection_args
    };

    let command_resolution = command_resolver::resolve_command(command);
    if !command_resolution.found {
        return Ok(ToolCheckResult {
            status: "missing".to_string(),
            resolved_command: command.to_string(),
            version: None,
            message: command_resolution.message,
        });
    }

    let resolved_command = command_resolution
        .resolved_path
        .clone()
        .unwrap_or_else(|| command.to_string());
    let mut last_error = None;

    for args in detection_args {
        match run_check_command(&resolved_command, &args) {
            Ok(result) => {
                if result.timed_out {
                    return Ok(ToolCheckResult {
                        status: "error".to_string(),
                        resolved_command: resolved_command.clone(),
                        version: None,
                        message: "Tool check timed out.".to_string(),
                    });
                }

                let combined = useful_output(&result.stdout, &result.stderr);
                if result.code == Some(0) {
                    return Ok(ToolCheckResult {
                        status: "ready".to_string(),
                        resolved_command: resolved_command.clone(),
                        version: first_useful_line(&combined),
                        message: if combined.is_empty() {
                            "Command responded successfully.".to_string()
                        } else {
                            truncate(&combined)
                        },
                    });
                }

                last_error = Some(if combined.is_empty() {
                    format!("Command exited with code {:?}.", result.code)
                } else {
                    truncate(&combined)
                });
            }
            Err(error) => {
                if is_not_found_error(&error) {
                    return Ok(ToolCheckResult {
                        status: "missing".to_string(),
                        resolved_command: resolved_command.clone(),
                        version: None,
                        message: command_resolution.message,
                    });
                }

                last_error = Some(error);
            }
        }
    }

    Ok(ToolCheckResult {
        status: "error".to_string(),
        resolved_command,
        version: None,
        message: last_error.unwrap_or_else(|| "Tool check failed.".to_string()),
    })
}

pub fn build_tool_launch_spec(
    request: BuildToolLaunchSpecRequest,
) -> Result<ToolLaunchSpecRecord, String> {
    let command = request.command.trim();

    if command.is_empty() {
        return Err("Configure a command before building a launch spec.".to_string());
    }

    let validation = file_scanner::validate_project_path(&request.project_path);
    if !validation.exists || !validation.is_directory || !validation.readable {
        return Err(validation.message);
    }

    let working_directory = PathBuf::from(&request.project_path)
        .canonicalize()
        .map_err(|error| format!("Unable to resolve project path: {error}"))?;
    if command_resolver::is_unsafe_windows_directory(&working_directory) {
        return Err(
            "Refusing to launch a tool from a Windows system directory. Choose a project folder or user directory."
                .to_string(),
        );
    }
    let preview = build_preview(command, &request.args, &working_directory);

    Ok(ToolLaunchSpecRecord {
        command: command.to_string(),
        args: request.args,
        working_directory: working_directory.to_string_lossy().to_string(),
        preview,
    })
}

fn run_check_command(command: &str, args: &[String]) -> Result<ProcessResult, String> {
    let mut child = Command::new(command)
        .args(args)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| error.to_string())?;

    let mut stdout = child
        .stdout
        .take()
        .ok_or_else(|| "Unable to capture stdout.".to_string())?;
    let mut stderr = child
        .stderr
        .take()
        .ok_or_else(|| "Unable to capture stderr.".to_string())?;

    let stdout_reader = thread::spawn(move || {
        let mut output = Vec::new();
        let _ = stdout.read_to_end(&mut output);
        output
    });
    let stderr_reader = thread::spawn(move || {
        let mut output = Vec::new();
        let _ = stderr.read_to_end(&mut output);
        output
    });

    let started = Instant::now();
    let mut timed_out = false;
    let code;

    loop {
        match child.try_wait() {
            Ok(Some(status)) => {
                code = status.code();
                break;
            }
            Ok(None) => {
                if started.elapsed() >= TOOL_CHECK_TIMEOUT {
                    timed_out = true;
                    let _ = child.kill();
                    let status = child.wait().map_err(|error| error.to_string())?;
                    code = status.code();
                    break;
                }
                thread::sleep(Duration::from_millis(50));
            }
            Err(error) => return Err(error.to_string()),
        }
    }

    let stdout = stdout_reader
        .join()
        .unwrap_or_default();
    let stderr = stderr_reader
        .join()
        .unwrap_or_default();

    Ok(ProcessResult {
        code,
        stdout: String::from_utf8_lossy(&stdout).to_string(),
        stderr: String::from_utf8_lossy(&stderr).to_string(),
        timed_out,
    })
}

fn useful_output(stdout: &str, stderr: &str) -> String {
    [stdout.trim(), stderr.trim()]
        .into_iter()
        .filter(|value| !value.is_empty())
        .collect::<Vec<_>>()
        .join("\n")
}

fn first_useful_line(output: &str) -> Option<String> {
    output
        .lines()
        .map(str::trim)
        .find(|line| !line.is_empty())
        .map(truncate)
}

fn truncate(value: &str) -> String {
    let trimmed = value.trim();
    if trimmed.len() <= OUTPUT_LIMIT {
        trimmed.to_string()
    } else {
        let truncated: String = trimmed.chars().take(OUTPUT_LIMIT).collect();
        format!("{truncated}...")
    }
}

fn is_not_found_error(error: &str) -> bool {
    let lower = error.to_ascii_lowercase();
    lower.contains("not found")
        || lower.contains("os error 2")
        || lower.contains("cannot find")
        || lower.contains("the system cannot find")
        || lower.contains("no such file")
}

fn build_preview(command: &str, args: &[String], working_directory: &Path) -> String {
    let rendered_args = if args.is_empty() {
        String::new()
    } else {
        format!(
            " {}",
            args.iter()
                .map(|arg| preview_token(arg))
                .collect::<Vec<_>>()
                .join(" ")
        )
    };

    format!(
        "cd {}\n{}{}",
        preview_token(&working_directory.to_string_lossy()),
        preview_token(command),
        rendered_args
    )
}

fn preview_token(value: &str) -> String {
    if value.contains(' ') {
        format!("\"{}\"", value.replace('"', "\\\""))
    } else {
        value.to_string()
    }
}
