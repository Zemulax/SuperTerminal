use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::PathBuf,
    time::{SystemTime, UNIX_EPOCH},
};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateContextPromptFileRequest {
    pub content: String,
    pub file_name_hint: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContextPromptFileRecord {
    pub path: String,
    pub size_bytes: u64,
    pub created_at: String,
}

#[tauri::command]
pub fn create_context_prompt_file(
    request: CreateContextPromptFileRequest,
) -> Result<ContextPromptFileRecord, String> {
    if request.content.trim().is_empty() {
        return Err("Generate context before creating a prompt file.".to_string());
    }

    let prompt_dir = std::env::temp_dir()
        .join("superterminal")
        .join("prompts");
    fs::create_dir_all(&prompt_dir)
        .map_err(|error| format!("Unable to create prompt directory: {error}"))?;

    let now = now_millis();
    let hint = request
        .file_name_hint
        .as_deref()
        .map(sanitize_file_name)
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| "context".to_string());
    let mut path = prompt_dir.join(format!(
        "superterminal-context-{now}-{hint}.md"
    ));

    let mut suffix = 1;
    while path.exists() {
        path = prompt_dir.join(format!(
            "superterminal-context-{now}-{hint}-{suffix}.md"
        ));
        suffix += 1;
    }

    fs::write(&path, request.content.as_bytes())
        .map_err(|error| format!("Unable to write context prompt file: {error}"))?;
    let size_bytes = fs::metadata(&path)
        .map_err(|error| format!("Unable to inspect context prompt file: {error}"))?
        .len();

    Ok(ContextPromptFileRecord {
        path: path_to_string(path),
        size_bytes,
        created_at: now.to_string(),
    })
}

fn sanitize_file_name(value: &str) -> String {
    value
        .chars()
        .filter(|ch| ch.is_ascii_alphanumeric() || *ch == '-' || *ch == '_')
        .take(32)
        .collect::<String>()
}

fn now_millis() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
}

fn path_to_string(path: PathBuf) -> String {
    path.to_string_lossy().to_string()
}
