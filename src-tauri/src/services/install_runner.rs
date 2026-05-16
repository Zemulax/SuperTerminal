use serde::{Deserialize, Serialize};
use std::{
    io::Read,
    path::PathBuf,
    process::{Command, Stdio},
    thread,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

use crate::services::install_validator::{self, InstallCommandValidationResult};

const DEFAULT_TIMEOUT_SECONDS: u64 = 300;
const OUTPUT_LIMIT: usize = 20_000;

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RunInstallCommandRequest {
    pub adapter_id: String,
    pub command: String,
    pub working_directory: Option<String>,
    pub timeout_seconds: Option<u64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InstallAttemptResult {
    pub id: String,
    pub adapter_id: String,
    pub command: String,
    pub status: String,
    pub exit_code: Option<i32>,
    pub stdout: String,
    pub stderr: String,
    pub started_at: String,
    pub completed_at: Option<String>,
    pub message: String,
}

struct ProcessResult {
    code: Option<i32>,
    stdout: String,
    stderr: String,
    timed_out: bool,
}

pub fn run_install_command(
    request: RunInstallCommandRequest,
) -> Result<InstallAttemptResult, String> {
    let started_at = now_string();
    let validation = install_validator::validate_command_text(&request.command);
    let attempt_id = format!("install-{}", now_millis());

    if validation.is_blocked || validation.requires_manual_execution || !validation.is_allowed {
        let status = if validation.is_blocked {
            "blocked"
        } else {
            "manual_only"
        };

        return Ok(InstallAttemptResult {
            id: attempt_id,
            adapter_id: request.adapter_id,
            command: request.command,
            status: status.to_string(),
            exit_code: None,
            stdout: String::new(),
            stderr: String::new(),
            started_at,
            completed_at: Some(now_string()),
            message: validation.reason,
        });
    }

    let working_directory = resolve_working_directory(request.working_directory)?;
    let timeout = Duration::from_secs(
        request
            .timeout_seconds
            .unwrap_or(DEFAULT_TIMEOUT_SECONDS)
            .clamp(5, DEFAULT_TIMEOUT_SECONDS),
    );

    match run_process(&validation, working_directory, timeout) {
        Ok(result) => {
            let status = if result.timed_out {
                "failed"
            } else if result.code == Some(0) {
                "succeeded"
            } else {
                "failed"
            };
            let message = if result.timed_out {
                "Install command timed out.".to_string()
            } else if result.code == Some(0) {
                "Install command completed successfully.".to_string()
            } else {
                format!("Install command exited with code {:?}.", result.code)
            };

            Ok(InstallAttemptResult {
                id: attempt_id,
                adapter_id: request.adapter_id,
                command: request.command,
                status: status.to_string(),
                exit_code: result.code,
                stdout: truncate(&result.stdout),
                stderr: truncate(&result.stderr),
                started_at,
                completed_at: Some(now_string()),
                message,
            })
        }
        Err(error) => Ok(InstallAttemptResult {
            id: attempt_id,
            adapter_id: request.adapter_id,
            command: request.command,
            status: "failed".to_string(),
            exit_code: None,
            stdout: String::new(),
            stderr: String::new(),
            started_at,
            completed_at: Some(now_string()),
            message: error,
        }),
    }
}

fn run_process(
    validation: &InstallCommandValidationResult,
    working_directory: PathBuf,
    timeout: Duration,
) -> Result<ProcessResult, String> {
    let executable = validation
        .executable
        .as_ref()
        .ok_or_else(|| "Install command has no executable.".to_string())?;

    let mut child = Command::new(executable)
        .args(&validation.args)
        .current_dir(working_directory)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| format!("Unable to start install command: {error}"))?;

    let mut stdout = child
        .stdout
        .take()
        .ok_or_else(|| "Unable to capture install stdout.".to_string())?;
    let mut stderr = child
        .stderr
        .take()
        .ok_or_else(|| "Unable to capture install stderr.".to_string())?;

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
                if started.elapsed() >= timeout {
                    timed_out = true;
                    let _ = child.kill();
                    let status = child.wait().map_err(|error| error.to_string())?;
                    code = status.code();
                    break;
                }
                thread::sleep(Duration::from_millis(100));
            }
            Err(error) => return Err(error.to_string()),
        }
    }

    let stdout = stdout_reader.join().unwrap_or_default();
    let stderr = stderr_reader.join().unwrap_or_default();

    Ok(ProcessResult {
        code,
        stdout: String::from_utf8_lossy(&stdout).to_string(),
        stderr: String::from_utf8_lossy(&stderr).to_string(),
        timed_out,
    })
}

fn resolve_working_directory(path: Option<String>) -> Result<PathBuf, String> {
    match path {
        Some(value) if !value.trim().is_empty() => {
            let resolved = PathBuf::from(value)
                .canonicalize()
                .map_err(|error| format!("Unable to resolve working directory: {error}"))?;
            if resolved.is_dir() {
                Ok(resolved)
            } else {
                Err("Install working directory is not a folder.".to_string())
            }
        }
        _ => std::env::current_dir()
            .map_err(|error| format!("Unable to determine current directory: {error}")),
    }
}

fn truncate(value: &str) -> String {
    if value.len() <= OUTPUT_LIMIT {
        value.to_string()
    } else {
        let truncated: String = value.chars().take(OUTPUT_LIMIT).collect();
        format!("{truncated}\n... output truncated ...")
    }
}

fn now_millis() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
}

fn now_string() -> String {
    now_millis().to_string()
}
