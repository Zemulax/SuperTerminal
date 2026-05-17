use crate::services::file_scanner::{
    self, ProjectPathValidation, ProjectScanResult, TextFilePreview,
};
use std::process::Command;

#[tauri::command]
pub fn validate_project_path(path: String) -> Result<ProjectPathValidation, String> {
    Ok(file_scanner::validate_project_path(&path))
}

#[tauri::command]
pub fn scan_project_folder(path: String) -> Result<ProjectScanResult, String> {
    file_scanner::scan_project_folder(&path)
}

#[tauri::command]
pub fn open_project_folder(path: String) -> Result<ProjectScanResult, String> {
    file_scanner::scan_project_folder(&path)
}

#[tauri::command]
pub fn pick_project_folder() -> Result<Option<String>, String> {
    #[cfg(windows)]
    {
        let script = r#"
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = 'Choose a SuperTerminal project folder'
$dialog.ShowNewFolderButton = $false
if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
  [Console]::Out.Write($dialog.SelectedPath)
}
"#;
        let output = Command::new("powershell.exe")
            .args(["-NoProfile", "-STA", "-Command", script])
            .output()
            .map_err(|error| format!("Unable to open folder picker: {error}"))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
            return Err(if stderr.is_empty() {
                "Folder picker failed.".to_string()
            } else {
                stderr
            });
        }

        let selected = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if selected.is_empty() {
            Ok(None)
        } else {
            Ok(Some(selected))
        }
    }

    #[cfg(not(windows))]
    {
        Err("Native folder picker is not configured on this platform. Paste a path manually.".to_string())
    }
}

#[tauri::command]
pub fn read_text_file_preview(path: String) -> Result<TextFilePreview, String> {
    file_scanner::read_text_file_preview(&path)
}
