use crate::services::command_resolver::{
    self, CommandResolutionDiagnostics, EnvironmentDiagnostics,
};

#[tauri::command]
pub fn get_command_resolution_diagnostics(
    command: String,
) -> Result<CommandResolutionDiagnostics, String> {
    Ok(command_resolver::resolve_command(&command))
}

#[tauri::command]
pub fn get_environment_diagnostics() -> Result<EnvironmentDiagnostics, String> {
    Ok(command_resolver::get_environment_diagnostics())
}
