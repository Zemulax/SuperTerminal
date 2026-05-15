use crate::services::tool_detection::{
    self, BuildToolLaunchSpecRequest, CheckToolRequest, ToolCheckResult, ToolLaunchSpecRecord,
};

#[tauri::command]
pub fn get_mock_environment_status() -> Result<String, String> {
    Ok("Phase 4: local tool detection is available.".to_string())
}

#[tauri::command]
pub fn check_tool(request: CheckToolRequest) -> Result<ToolCheckResult, String> {
    tool_detection::check_tool(request)
}

#[tauri::command]
pub fn build_tool_launch_spec(
    request: BuildToolLaunchSpecRequest,
) -> Result<ToolLaunchSpecRecord, String> {
    tool_detection::build_tool_launch_spec(request)
}
