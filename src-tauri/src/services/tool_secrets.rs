use keyring::Entry;
use serde::{Deserialize, Serialize};
use std::{
    env, fs,
    path::PathBuf,
    time::{SystemTime, UNIX_EPOCH},
};

const KEYRING_SERVICE: &str = "SuperTerminal";

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveToolSecretEnvVarRequest {
    pub tool_id: String,
    pub name: String,
    pub value: String,
    pub enabled: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ToolSecretEnvVarRecord {
    pub id: String,
    pub tool_id: String,
    pub name: String,
    pub enabled: bool,
    pub secret_ref: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RedactSecretsRequest {
    pub text: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RedactSecretsResult {
    pub text: String,
    pub redacted: bool,
}

pub fn save_tool_secret_env_var(
    request: SaveToolSecretEnvVarRequest,
) -> Result<ToolSecretEnvVarRecord, String> {
    let tool_id = sanitize_tool_id(&request.tool_id)?;
    let name = validate_env_var_name(&request.name)?;
    if request.value.is_empty() {
        return Err("Secret value cannot be empty.".to_string());
    }

    let mut records = read_records()?;
    let existing = records
        .iter()
        .find(|record| record.tool_id == tool_id && record.name == name)
        .cloned();
    let now = now_string();
    let secret_ref = secret_ref(&tool_id, &name);

    write_secret(&secret_ref, &request.value)?;

    let record = ToolSecretEnvVarRecord {
        id: existing
            .as_ref()
            .map(|record| record.id.clone())
            .unwrap_or_else(|| format!("{}:{}", tool_id, name)),
        tool_id: tool_id.clone(),
        name: name.clone(),
        enabled: request.enabled,
        secret_ref,
        created_at: existing
            .as_ref()
            .map(|record| record.created_at.clone())
            .unwrap_or_else(|| now.clone()),
        updated_at: now,
    };

    records.retain(|candidate| !(candidate.tool_id == tool_id && candidate.name == name));
    records.push(record.clone());
    write_records(&records)?;
    Ok(record)
}

pub fn delete_tool_secret_env_var(tool_id: String, name: String) -> Result<(), String> {
    let tool_id = sanitize_tool_id(&tool_id)?;
    let name = validate_env_var_name(&name)?;
    let mut records = read_records()?;
    let secret_ref = secret_ref(&tool_id, &name);

    let _ = delete_secret(&secret_ref);
    records.retain(|candidate| !(candidate.tool_id == tool_id && candidate.name == name));
    write_records(&records)
}

pub fn list_tool_secret_env_vars(tool_id: String) -> Result<Vec<ToolSecretEnvVarRecord>, String> {
    let tool_id = sanitize_tool_id(&tool_id)?;
    let mut records = read_records()?
        .into_iter()
        .filter(|record| record.tool_id == tool_id)
        .collect::<Vec<_>>();
    records.sort_by(|left, right| left.name.cmp(&right.name));
    Ok(records)
}

pub fn set_tool_secret_env_var_enabled(
    tool_id: String,
    name: String,
    enabled: bool,
) -> Result<ToolSecretEnvVarRecord, String> {
    let tool_id = sanitize_tool_id(&tool_id)?;
    let name = validate_env_var_name(&name)?;
    let mut records = read_records()?;
    let now = now_string();
    let mut updated = None;

    for record in &mut records {
        if record.tool_id == tool_id && record.name == name {
            record.enabled = enabled;
            record.updated_at = now.clone();
            updated = Some(record.clone());
            break;
        }
    }

    let record = updated.ok_or_else(|| "Environment variable is not configured.".to_string())?;
    write_records(&records)?;
    Ok(record)
}

pub fn load_enabled_secret_values(tool_id: Option<&str>) -> Result<Vec<(String, String)>, String> {
    let Some(tool_id) = tool_id else {
        return Ok(Vec::new());
    };
    let tool_id = sanitize_tool_id(tool_id)?;
    let records = read_records()?;
    let mut values = Vec::new();

    for record in records
        .into_iter()
        .filter(|record| record.tool_id == tool_id && record.enabled)
    {
        let value = read_secret(&record.secret_ref).map_err(|error| {
            format!(
                "Unable to retrieve secret `{}` for `{}`: {error}",
                record.name, record.tool_id
            )
        })?;
        values.push((record.name, value));
    }

    Ok(values)
}

pub fn redact_configured_secrets(text: &str) -> Result<RedactSecretsResult, String> {
    if text.is_empty() {
        return Ok(RedactSecretsResult {
            text: String::new(),
            redacted: false,
        });
    }

    let records = read_records()?;
    let mut redacted_text = text.to_string();
    let mut redacted = false;

    for record in records.into_iter().filter(|record| record.enabled) {
        if let Ok(value) = read_secret(&record.secret_ref) {
            if value.len() >= 6 && redacted_text.contains(&value) {
                redacted_text = redacted_text.replace(&value, "[REDACTED_SECRET]");
                redacted = true;
            }
        }
    }

    Ok(RedactSecretsResult {
        text: redacted_text,
        redacted,
    })
}

fn read_records() -> Result<Vec<ToolSecretEnvVarRecord>, String> {
    let path = metadata_path()?;
    if !path.exists() {
        return Ok(Vec::new());
    }

    let raw = fs::read_to_string(&path)
        .map_err(|error| format!("Unable to read secret metadata: {error}"))?;
    serde_json::from_str(&raw).map_err(|error| format!("Invalid secret metadata: {error}"))
}

fn write_records(records: &[ToolSecretEnvVarRecord]) -> Result<(), String> {
    let path = metadata_path()?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|error| format!("Unable to create secret metadata directory: {error}"))?;
    }
    let raw = serde_json::to_string_pretty(records)
        .map_err(|error| format!("Unable to serialize secret metadata: {error}"))?;
    fs::write(path, raw).map_err(|error| format!("Unable to write secret metadata: {error}"))
}

fn metadata_path() -> Result<PathBuf, String> {
    Ok(app_data_dir()?.join("tool-secret-env-vars.json"))
}

fn app_data_dir() -> Result<PathBuf, String> {
    #[cfg(windows)]
    {
        if let Some(app_data) = env::var_os("APPDATA") {
            return Ok(PathBuf::from(app_data).join("SuperTerminal"));
        }
    }

    #[cfg(not(windows))]
    {
        if let Some(config_home) = env::var_os("XDG_CONFIG_HOME") {
            return Ok(PathBuf::from(config_home).join("superterminal"));
        }

        if let Some(home) = env::var_os("HOME") {
            return Ok(PathBuf::from(home).join(".config").join("superterminal"));
        }
    }

    Ok(env::temp_dir().join("superterminal"))
}

fn write_secret(secret_ref: &str, value: &str) -> Result<(), String> {
    let entry = Entry::new(KEYRING_SERVICE, secret_ref)
        .map_err(|error| format!("Secure storage is unavailable: {error}"))?;
    entry
        .set_password(value)
        .map_err(|error| format!("Unable to save secret in secure storage: {error}"))
}

fn read_secret(secret_ref: &str) -> Result<String, String> {
    let entry = Entry::new(KEYRING_SERVICE, secret_ref)
        .map_err(|error| format!("Secure storage is unavailable: {error}"))?;
    entry
        .get_password()
        .map_err(|error| format!("Unable to read secret from secure storage: {error}"))
}

fn delete_secret(secret_ref: &str) -> Result<(), String> {
    let entry = Entry::new(KEYRING_SERVICE, secret_ref)
        .map_err(|error| format!("Secure storage is unavailable: {error}"))?;
    entry
        .delete_password()
        .map_err(|error| format!("Unable to delete secret from secure storage: {error}"))
}

fn validate_env_var_name(value: &str) -> Result<String, String> {
    let name = value.trim();
    if name.is_empty() {
        return Err("Environment variable name is required.".to_string());
    }

    let mut chars = name.chars();
    let Some(first) = chars.next() else {
        return Err("Environment variable name is required.".to_string());
    };
    if !(first == '_' || first.is_ascii_alphabetic()) {
        return Err("Environment variable name must start with a letter or underscore.".to_string());
    }

    if !chars.all(|character| character == '_' || character.is_ascii_alphanumeric()) {
        return Err(
            "Environment variable names can only contain letters, numbers, and underscores."
                .to_string(),
        );
    }

    Ok(name.to_string())
}

fn sanitize_tool_id(value: &str) -> Result<String, String> {
    let tool_id = value.trim();
    if tool_id.is_empty() {
        return Err("Tool id is required.".to_string());
    }

    if !tool_id
        .chars()
        .all(|character| character == '-' || character == '_' || character.is_ascii_alphanumeric())
    {
        return Err("Tool id contains unsupported characters.".to_string());
    }

    Ok(tool_id.to_string())
}

fn secret_ref(tool_id: &str, name: &str) -> String {
    format!("tool:{tool_id}:env:{name}")
}

fn now_string() -> String {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
        .to_string()
}
