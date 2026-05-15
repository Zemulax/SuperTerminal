#[tauri::command]
pub fn get_terminal_placeholder_status() -> Result<String, String> {
    Ok("Phase 0 placeholder: PTY execution is disabled.".to_string())
}
