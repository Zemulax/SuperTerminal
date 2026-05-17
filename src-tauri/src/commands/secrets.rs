use crate::services::tool_secrets::{
    self, RedactSecretsRequest, RedactSecretsResult, SaveToolSecretEnvVarRequest,
    ToolSecretEnvVarRecord,
};

#[tauri::command]
pub fn save_tool_secret_env_var(
    request: SaveToolSecretEnvVarRequest,
) -> Result<ToolSecretEnvVarRecord, String> {
    tool_secrets::save_tool_secret_env_var(request)
}

#[tauri::command]
pub fn delete_tool_secret_env_var(tool_id: String, name: String) -> Result<(), String> {
    tool_secrets::delete_tool_secret_env_var(tool_id, name)
}

#[tauri::command]
pub fn list_tool_secret_env_vars(tool_id: String) -> Result<Vec<ToolSecretEnvVarRecord>, String> {
    tool_secrets::list_tool_secret_env_vars(tool_id)
}

#[tauri::command]
pub fn set_tool_secret_env_var_enabled(
    tool_id: String,
    name: String,
    enabled: bool,
) -> Result<ToolSecretEnvVarRecord, String> {
    tool_secrets::set_tool_secret_env_var_enabled(tool_id, name, enabled)
}

#[tauri::command]
pub fn redact_configured_secrets(
    request: RedactSecretsRequest,
) -> Result<RedactSecretsResult, String> {
    tool_secrets::redact_configured_secrets(&request.text)
}
