use serde::{Deserialize, Serialize};
use std::{
    collections::HashSet,
    env,
    path::{Path, PathBuf},
};

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CommandResolutionDiagnostics {
    pub command: String,
    pub found: bool,
    pub resolved_path: Option<String>,
    pub checked_paths: Vec<String>,
    pub attempted_variants: Vec<String>,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct EnvironmentDiagnostics {
    pub os: String,
    pub home_dir: Option<String>,
    pub path_entries: Vec<String>,
    pub npm: CommandResolutionDiagnostics,
    pub node: CommandResolutionDiagnostics,
    pub pnpm: CommandResolutionDiagnostics,
    pub yarn: CommandResolutionDiagnostics,
    pub cargo: CommandResolutionDiagnostics,
}

pub fn resolve_command(command: &str) -> CommandResolutionDiagnostics {
    let command = command.trim();
    if command.is_empty() {
        return CommandResolutionDiagnostics {
            command: String::new(),
            found: false,
            resolved_path: None,
            checked_paths: search_paths()
                .into_iter()
                .map(|path| path.to_string_lossy().to_string())
                .collect(),
            attempted_variants: Vec::new(),
            message: "No command was provided.".to_string(),
        };
    }

    let variants = command_variants(command);
    let paths = search_paths();
    let mut checked_paths = Vec::new();

    if has_path_separator(command) || Path::new(command).is_absolute() {
        for variant in &variants {
            let candidate = PathBuf::from(variant);
            checked_paths.push(candidate.to_string_lossy().to_string());
            if candidate.is_file() {
                return found(command, candidate, checked_paths, variants);
            }
        }

        return missing(command, checked_paths, variants);
    }

    for dir in &paths {
        for variant in &variants {
            let candidate = dir.join(variant);
            checked_paths.push(candidate.to_string_lossy().to_string());
            if candidate.is_file() {
                return found(command, candidate, checked_paths, variants);
            }
        }
    }

    missing(command, checked_paths, variants)
}

pub fn get_environment_diagnostics() -> EnvironmentDiagnostics {
    EnvironmentDiagnostics {
        os: env::consts::OS.to_string(),
        home_dir: home_dir().map(|path| path.to_string_lossy().to_string()),
        path_entries: search_paths()
            .into_iter()
            .map(|path| path.to_string_lossy().to_string())
            .collect(),
        npm: resolve_command("npm"),
        node: resolve_command("node"),
        pnpm: resolve_command("pnpm"),
        yarn: resolve_command("yarn"),
        cargo: resolve_command("cargo"),
    }
}

pub fn home_dir() -> Option<PathBuf> {
    #[cfg(windows)]
    {
        env::var_os("USERPROFILE")
            .map(PathBuf::from)
            .or_else(|| {
                let drive = env::var_os("HOMEDRIVE")?;
                let path = env::var_os("HOMEPATH")?;
                Some(PathBuf::from(format!(
                    "{}{}",
                    drive.to_string_lossy(),
                    path.to_string_lossy()
                )))
            })
    }

    #[cfg(not(windows))]
    {
        env::var_os("HOME").map(PathBuf::from)
    }
}

pub fn safe_working_directory(path: Option<&str>) -> Result<PathBuf, String> {
    if let Some(value) = path.map(str::trim).filter(|value| !value.is_empty()) {
        let resolved = PathBuf::from(value)
            .canonicalize()
            .map_err(|error| format!("Unable to resolve working directory: {error}"))?;
        if resolved.is_dir() {
            return Ok(resolved);
        }
    }

    if let Some(home) = home_dir() {
        if home.is_dir() {
            return home
                .canonicalize()
                .map_err(|error| format!("Unable to resolve home directory: {error}"));
        }
    }

    env::current_dir()
        .map_err(|error| format!("Unable to determine a safe working directory: {error}"))
}

fn found(
    command: &str,
    path: PathBuf,
    checked_paths: Vec<String>,
    attempted_variants: Vec<String>,
) -> CommandResolutionDiagnostics {
    let resolved_path = path.to_string_lossy().to_string();
    CommandResolutionDiagnostics {
        command: command.to_string(),
        found: true,
        resolved_path: Some(resolved_path.clone()),
        checked_paths,
        attempted_variants,
        message: format!("Resolved `{command}` to `{resolved_path}`."),
    }
}

fn missing(
    command: &str,
    checked_paths: Vec<String>,
    attempted_variants: Vec<String>,
) -> CommandResolutionDiagnostics {
    CommandResolutionDiagnostics {
        command: command.to_string(),
        found: false,
        resolved_path: None,
        checked_paths,
        attempted_variants,
        message: format!(
            "Unable to find `{command}`. Checked PATH and common Windows tool folders."
        ),
    }
}

fn command_variants(command: &str) -> Vec<String> {
    #[cfg(windows)]
    {
        let path = Path::new(command);
        if path.extension().is_some() {
            return vec![command.to_string()];
        }

        vec![
            format!("{command}.exe"),
            format!("{command}.cmd"),
            format!("{command}.bat"),
            command.to_string(),
        ]
    }

    #[cfg(not(windows))]
    {
        vec![command.to_string()]
    }
}

fn search_paths() -> Vec<PathBuf> {
    let mut seen = HashSet::new();
    let mut paths = Vec::new();

    if let Some(raw_path) = env::var_os("PATH") {
        for path in env::split_paths(&raw_path) {
            push_unique(&mut paths, &mut seen, path);
        }
    }

    #[cfg(windows)]
    {
        if let Some(program_files) = env::var_os("ProgramFiles") {
            push_unique(
                &mut paths,
                &mut seen,
                PathBuf::from(program_files).join("nodejs"),
            );
        } else {
            push_unique(
                &mut paths,
                &mut seen,
                PathBuf::from(r"C:\Program Files\nodejs"),
            );
        }

        if let Some(app_data) = env::var_os("APPDATA") {
            push_unique(&mut paths, &mut seen, PathBuf::from(app_data).join("npm"));
        }

        if let Some(user_profile) = env::var_os("USERPROFILE") {
            push_unique(
                &mut paths,
                &mut seen,
                PathBuf::from(&user_profile).join(".cargo").join("bin"),
            );
        }

        if let Some(local_app_data) = env::var_os("LOCALAPPDATA") {
            push_unique(
                &mut paths,
                &mut seen,
                PathBuf::from(local_app_data)
                    .join("Microsoft")
                    .join("WindowsApps"),
            );
        }
    }

    paths
}

fn push_unique(paths: &mut Vec<PathBuf>, seen: &mut HashSet<String>, path: PathBuf) {
    let key = path.to_string_lossy().to_ascii_lowercase();
    if seen.insert(key) {
        paths.push(path);
    }
}

fn has_path_separator(command: &str) -> bool {
    command.contains('/') || command.contains('\\')
}
