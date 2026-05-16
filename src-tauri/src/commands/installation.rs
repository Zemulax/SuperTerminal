use crate::services::{
    install_runner::{self, InstallAttemptResult, RunInstallCommandRequest},
    install_validator::{
        self, InstallCommandValidationResult, ValidateInstallCommandRequest,
    },
};

#[tauri::command]
pub fn validate_install_command(
    request: ValidateInstallCommandRequest,
) -> Result<InstallCommandValidationResult, String> {
    install_validator::validate_install_command(request)
}

#[tauri::command]
pub fn run_install_command(
    request: RunInstallCommandRequest,
) -> Result<InstallAttemptResult, String> {
    install_runner::run_install_command(request)
}
