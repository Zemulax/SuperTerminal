#[tauri::command]
pub fn get_app_version() -> Result<String, String> {
    Ok(env!("CARGO_PKG_VERSION").to_string())
}

#[tauri::command]
pub fn get_home_directory() -> Result<String, String> {
    crate::services::command_resolver::home_dir()
        .map(|path| path.to_string_lossy().to_string())
        .ok_or_else(|| "Unable to resolve the home directory.".to_string())
}
