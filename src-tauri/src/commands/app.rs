#[tauri::command]
pub fn get_app_version() -> Result<String, String> {
    Ok(env!("CARGO_PKG_VERSION").to_string())
}

#[tauri::command]
pub fn get_home_directory() -> Result<String, String> {
    #[cfg(windows)]
    {
        std::env::var("USERPROFILE")
            .or_else(|_| {
                let drive = std::env::var("HOMEDRIVE").unwrap_or_default();
                let path = std::env::var("HOMEPATH").unwrap_or_default();
                if drive.is_empty() || path.is_empty() {
                    Err(std::env::VarError::NotPresent)
                } else {
                    Ok(format!("{drive}{path}"))
                }
            })
            .map_err(|_| "Unable to resolve the Windows home directory.".to_string())
    }

    #[cfg(not(windows))]
    {
        std::env::var("HOME")
            .map_err(|_| "Unable to resolve the home directory.".to_string())
    }
}
