use tauri::{AppHandle, State};

use crate::services::pty_service::{
    PtySessionRecord, PtyState, ResizePtySessionRequest, StartPtySessionRequest,
    WritePtyInputRequest,
};

#[tauri::command]
pub fn get_terminal_placeholder_status() -> Result<String, String> {
    Ok("Phase 3: PTY execution is available after explicit user start.".to_string())
}

#[tauri::command]
pub fn start_pty_session(
    app: AppHandle,
    state: State<'_, PtyState>,
    request: StartPtySessionRequest,
) -> Result<PtySessionRecord, String> {
    state.start_session(app, request)
}

#[tauri::command]
pub fn write_pty_input(
    state: State<'_, PtyState>,
    request: WritePtyInputRequest,
) -> Result<(), String> {
    state.write_input(request)
}

#[tauri::command]
pub fn resize_pty_session(
    state: State<'_, PtyState>,
    request: ResizePtySessionRequest,
) -> Result<(), String> {
    state.resize_session(request)
}

#[tauri::command]
pub fn stop_pty_session(
    app: AppHandle,
    state: State<'_, PtyState>,
    session_id: String,
) -> Result<PtySessionRecord, String> {
    state.stop_session(app, session_id)
}

#[tauri::command]
pub fn get_active_pty_session(
    state: State<'_, PtyState>,
) -> Result<Option<PtySessionRecord>, String> {
    state.get_active_session()
}
