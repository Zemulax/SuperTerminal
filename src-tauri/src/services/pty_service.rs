use portable_pty::{native_pty_system, Child, CommandBuilder, MasterPty, PtySize};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    io::{Read, Write},
    path::{Path, PathBuf},
    sync::{Arc, Mutex},
    thread,
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Emitter};

use crate::services::{command_resolver, file_scanner, tool_secrets};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartPtySessionRequest {
    pub project_path: String,
    pub command: Option<String>,
    pub shell: Option<String>,
    pub args: Option<Vec<String>>,
    pub cols: u16,
    pub rows: u16,
    pub session_label: Option<String>,
    pub tool_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PtySessionRecord {
    pub id: String,
    pub project_path: String,
    pub shell: String,
    pub label: Option<String>,
    pub status: String,
    pub cols: u16,
    pub rows: u16,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub exit_code: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WritePtyInputRequest {
    pub session_id: String,
    pub data: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResizePtySessionRequest {
    pub session_id: String,
    pub cols: u16,
    pub rows: u16,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PtyOutputEvent {
    pub session_id: String,
    pub data: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PtyExitEvent {
    pub session_id: String,
    pub exit_code: Option<i32>,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PtyErrorEvent {
    pub session_id: String,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PtyStatusEvent {
    pub session_id: String,
    pub status: String,
}

pub struct PtySession {
    pub record: PtySessionRecord,
    pub master: Box<dyn MasterPty + Send>,
    pub writer: Box<dyn Write + Send>,
    pub child: Box<dyn Child + Send + Sync>,
}

#[derive(Clone, Default)]
pub struct PtyState {
    sessions: Arc<Mutex<HashMap<String, PtySession>>>,
}

impl PtyState {
    pub fn start_session(
        &self,
        app: AppHandle,
        request: StartPtySessionRequest,
    ) -> Result<PtySessionRecord, String> {
        {
            let sessions = self
                .sessions
                .lock()
                .map_err(|_| "PTY session registry lock failed.".to_string())?;
            if !sessions.is_empty() {
                return Err("A terminal session is already active.".to_string());
            }
        }

        let requested_path = request.project_path.trim();
        let project_path = if requested_path.is_empty() {
            command_resolver::safe_working_directory(None)?
        } else {
            let validation = file_scanner::validate_project_path(requested_path);
            if validation.exists && validation.is_directory && validation.readable {
                let resolved = PathBuf::from(requested_path)
                    .canonicalize()
                    .map_err(|error| format!("Unable to resolve project path: {error}"))?;
                if command_resolver::is_unsafe_windows_directory(&resolved) {
                    command_resolver::safe_working_directory(None)?
                } else {
                    command_resolver::normalize_windows_path(resolved)
                }
            } else {
                command_resolver::safe_working_directory(None)?
            }
        };
        let requested_command = request
            .command
            .or(request.shell)
            .filter(|value| !value.trim().is_empty());
        let is_default_shell = requested_command.is_none();
        let command_name = requested_command.unwrap_or_else(default_shell);
        let command_args = request.args.unwrap_or_default();
        let command_resolution = command_resolver::resolve_command(&command_name);
        if !is_default_shell && !command_resolution.found {
            return Err(format!(
                "Unable to launch `{command_name}`. {}",
                command_resolution.message
            ));
        }
        let spawn_command = command_resolution
            .resolved_path
            .clone()
            .unwrap_or_else(|| command_name.clone());
        let label = request
            .session_label
            .filter(|value| !value.trim().is_empty())
            .or_else(|| Some(command_name.clone()));
        let cols = request.cols.max(20);
        let rows = request.rows.max(5);
        let session_id = format!("pty-{}", now_millis());
        let pty_system = native_pty_system();
        let pair = pty_system
            .openpty(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|error| format!("Unable to open PTY: {error}"))?;

        let mut command = build_pty_command(
            &command_name,
            &spawn_command,
            &command_args,
            &project_path,
            is_default_shell,
        );
        set_command_cwd(&mut command, &project_path);
        apply_tool_environment(&mut command, request.tool_id.as_deref())?;

        let child = pair
            .slave
            .spawn_command(command)
            .map_err(|error| {
                if command_resolution.found {
                    format!("Unable to start command '{spawn_command}': {error}")
                } else {
                    format!(
                        "Unable to start command '{command_name}': {error}. {}",
                        command_resolution.message
                    )
                }
            })?;
        let mut reader = pair
            .master
            .try_clone_reader()
            .map_err(|error| format!("Unable to create PTY reader: {error}"))?;
        let mut writer = pair
            .master
            .take_writer()
            .map_err(|error| format!("Unable to create PTY writer: {error}"))?;
        write_startup_commands(
            &mut writer,
            &command_name,
            &spawn_command,
            &command_args,
            &project_path,
            is_default_shell,
        )?;

        let record = PtySessionRecord {
            id: session_id.clone(),
            project_path: path_to_string(&project_path),
            shell: command_name.clone(),
            label,
            status: "active".to_string(),
            cols,
            rows,
            started_at: now_string(),
            ended_at: None,
            exit_code: None,
        };

        {
            let mut sessions = self
                .sessions
                .lock()
                .map_err(|_| "PTY session registry lock failed.".to_string())?;
            sessions.insert(
                session_id.clone(),
                PtySession {
                    record: record.clone(),
                    master: pair.master,
                    writer,
                    child,
                },
            );
        }

        let reader_state = self.clone();
        let reader_app = app.clone();
        let reader_session_id = session_id.clone();
        thread::spawn(move || {
            let mut buffer = [0_u8; 8192];

            loop {
                match reader.read(&mut buffer) {
                    Ok(0) => {
                        reader_state.finish_natural_exit(&reader_app, &reader_session_id);
                        break;
                    }
                    Ok(size) => {
                        let data = String::from_utf8_lossy(&buffer[..size]).to_string();
                        let _ = reader_app.emit(
                            "pty://output",
                            PtyOutputEvent {
                                session_id: reader_session_id.clone(),
                                data,
                            },
                        );
                    }
                    Err(error) => {
                        let _ = reader_app.emit(
                            "pty://error",
                            PtyErrorEvent {
                                session_id: reader_session_id.clone(),
                                message: format!("PTY read failed: {error}"),
                            },
                        );
                        reader_state.finish_natural_exit(&reader_app, &reader_session_id);
                        break;
                    }
                }
            }
        });

        let _ = app.emit(
            "pty://status",
            PtyStatusEvent {
                session_id,
                status: "active".to_string(),
            },
        );

        Ok(record)
    }

    pub fn write_input(&self, request: WritePtyInputRequest) -> Result<(), String> {
        let mut sessions = self
            .sessions
            .lock()
            .map_err(|_| "PTY session registry lock failed.".to_string())?;
        let session = sessions
            .get_mut(&request.session_id)
            .ok_or_else(|| "PTY session is not active.".to_string())?;

        session
            .writer
            .write_all(request.data.as_bytes())
            .map_err(|error| format!("Unable to write PTY input: {error}"))?;
        session
            .writer
            .flush()
            .map_err(|error| format!("Unable to flush PTY input: {error}"))
    }

    pub fn resize_session(&self, request: ResizePtySessionRequest) -> Result<(), String> {
        let mut sessions = self
            .sessions
            .lock()
            .map_err(|_| "PTY session registry lock failed.".to_string())?;
        let session = sessions
            .get_mut(&request.session_id)
            .ok_or_else(|| "PTY session is not active.".to_string())?;
        let cols = request.cols.max(20);
        let rows = request.rows.max(5);

        session
            .master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|error| format!("Unable to resize PTY: {error}"))?;

        session.record.cols = cols;
        session.record.rows = rows;
        Ok(())
    }

    pub fn stop_session(
        &self,
        app: AppHandle,
        session_id: String,
    ) -> Result<PtySessionRecord, String> {
        let mut session = {
            let mut sessions = self
                .sessions
                .lock()
                .map_err(|_| "PTY session registry lock failed.".to_string())?;
            sessions
                .remove(&session_id)
                .ok_or_else(|| "No active PTY session found.".to_string())?
        };

        let _ = session.child.kill();
        let exit_code = session
            .child
            .try_wait()
            .ok()
            .flatten()
            .map(|status| status.exit_code() as i32);

        session.record.status = "stopped".to_string();
        session.record.ended_at = Some(now_string());
        session.record.exit_code = exit_code;

        let _ = app.emit(
            "pty://exit",
            PtyExitEvent {
                session_id,
                exit_code,
                status: "stopped".to_string(),
            },
        );

        Ok(session.record)
    }

    pub fn get_active_session(&self) -> Result<Option<PtySessionRecord>, String> {
        let sessions = self
            .sessions
            .lock()
            .map_err(|_| "PTY session registry lock failed.".to_string())?;
        Ok(sessions.values().next().map(|session| session.record.clone()))
    }

    fn finish_natural_exit(&self, app: &AppHandle, session_id: &str) {
        let maybe_session = {
            let mut sessions = match self.sessions.lock() {
                Ok(sessions) => sessions,
                Err(_) => return,
            };
            sessions.remove(session_id)
        };

        if let Some(mut session) = maybe_session {
            let exit_code = session
                .child
                .try_wait()
                .ok()
                .flatten()
                .map(|status| status.exit_code() as i32);
            session.record.status = "exited".to_string();
            session.record.ended_at = Some(now_string());
            session.record.exit_code = exit_code;

            let _ = app.emit(
                "pty://exit",
                PtyExitEvent {
                    session_id: session_id.to_string(),
                    exit_code,
                    status: "exited".to_string(),
                },
            );
        }
    }
}

fn build_pty_command(
    command_name: &str,
    spawn_command: &str,
    args: &[String],
    working_directory: &Path,
    is_default_shell: bool,
) -> CommandBuilder {
    #[cfg(windows)]
    {
        let _ = (command_name, spawn_command, args, working_directory, is_default_shell);
        let cmd_resolution = command_resolver::resolve_command("cmd.exe");
        let cmd_path = cmd_resolution
            .resolved_path
            .unwrap_or_else(|| "cmd.exe".to_string());

        let mut command = CommandBuilder::new(cmd_path);
        command.arg("/D");
        command.arg("/Q");
        command
    }

    #[cfg(not(windows))]
    {
        let mut command = CommandBuilder::new(spawn_command);
        for arg in args {
            command.arg(arg);
        }
        command
    }
}

fn write_startup_commands(
    writer: &mut Box<dyn Write + Send>,
    command_name: &str,
    spawn_command: &str,
    args: &[String],
    working_directory: &Path,
    is_default_shell: bool,
) -> Result<(), String> {
    #[cfg(windows)]
    {
        let directory = windows_cmd_path(working_directory);
        write_cmd_line(writer, &format!("cd /d {}", cmd_quote(&directory)))?;

        if !is_default_shell && !is_cmd_command(command_name) {
            let command_path = strip_windows_verbatim_prefix(spawn_command);
            let rendered_args = args
                .iter()
                .map(|arg| cmd_quote(arg))
                .collect::<Vec<_>>()
                .join(" ");
            let command_line = if rendered_args.is_empty() {
                cmd_quote(&command_path)
            } else {
                format!("{} {}", cmd_quote(&command_path), rendered_args)
            };
            write_cmd_line(writer, &command_line)?;
        }

        writer
            .flush()
            .map_err(|error| format!("Unable to flush PTY startup commands: {error}"))?;
    }

    #[cfg(not(windows))]
    {
        let _ = (
            writer,
            command_name,
            spawn_command,
            args,
            working_directory,
            is_default_shell,
        );
    }

    Ok(())
}

#[cfg(windows)]
fn write_cmd_line(writer: &mut Box<dyn Write + Send>, line: &str) -> Result<(), String> {
    writer
        .write_all(format!("{line}\r\n").as_bytes())
        .map_err(|error| format!("Unable to write PTY startup command: {error}"))
}

fn set_command_cwd(command: &mut CommandBuilder, project_path: &Path) {
    #[cfg(windows)]
    {
        let normalized = command_resolver::normalize_windows_path(project_path.to_path_buf());
        command.cwd(normalized.as_os_str());
    }

    #[cfg(not(windows))]
    {
        command.cwd(project_path.as_os_str());
    }
}

fn apply_tool_environment(
    command: &mut CommandBuilder,
    tool_id: Option<&str>,
) -> Result<(), String> {
    for (name, value) in tool_secrets::load_enabled_secret_values(tool_id)? {
        command.env(name, value);
    }

    Ok(())
}

#[cfg(windows)]
fn is_cmd_command(command: &str) -> bool {
    let lower = command.to_ascii_lowercase();
    lower == "cmd" || lower == "cmd.exe" || lower.ends_with("\\cmd.exe") || lower.ends_with("/cmd.exe")
}

#[cfg(windows)]
fn cmd_quote(value: &str) -> String {
    format!("\"{}\"", value.replace('"', "\"\""))
}

#[cfg(windows)]
fn windows_cmd_path(path: &Path) -> String {
    strip_windows_verbatim_prefix(&path.to_string_lossy())
}

#[cfg(windows)]
fn strip_windows_verbatim_prefix(value: &str) -> String {
    if let Some(rest) = value.strip_prefix(r"\\?\UNC\") {
        format!(r"\\{rest}")
    } else if let Some(rest) = value.strip_prefix(r"\\?\") {
        rest.to_string()
    } else {
        value.to_string()
    }
}

fn default_shell() -> String {
    #[cfg(windows)]
    {
        "cmd.exe".to_string()
    }

    #[cfg(not(windows))]
    {
        if let Ok(shell) = env::var("SHELL") {
            if Path::new(&shell).exists() {
                return shell;
            }
        }

        if Path::new("/bin/bash").exists() {
            "/bin/bash".to_string()
        } else {
            "/bin/sh".to_string()
        }
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

fn path_to_string(path: &Path) -> String {
    #[cfg(windows)]
    {
        return strip_windows_verbatim_prefix(&path.to_string_lossy());
    }

    #[cfg(not(windows))]
    {
        path.to_string_lossy().to_string()
    }
}
