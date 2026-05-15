use crate::services::file_scanner::{
    self, ProjectPathValidation, ProjectScanResult, TextFilePreview,
};

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
pub fn read_text_file_preview(path: String) -> Result<TextFilePreview, String> {
    file_scanner::read_text_file_preview(&path)
}
