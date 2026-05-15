use serde::{Deserialize, Serialize};
use std::{
    ffi::OsStr,
    fs,
    io::Read,
    path::{Path, PathBuf},
};

const MAX_DEPTH: usize = 6;
const MAX_NODES: usize = 3000;
const MAX_PREVIEW_BYTES: u64 = 100 * 1024;

const IGNORED_DIRS: &[&str] = &[
    ".git",
    "node_modules",
    "bin",
    "obj",
    "dist",
    "build",
    ".next",
    "target",
    "coverage",
    ".vite",
    ".turbo",
    ".cache",
    "venv",
    ".venv",
    "__pycache__",
    ".idea",
    ".vscode",
];

const IGNORED_FILES: &[&str] = &[".DS_Store", "Thumbs.db"];

const PREVIEW_EXTENSIONS: &[&str] = &[
    "ts", "tsx", "js", "jsx", "json", "md", "txt", "css", "scss", "html", "cs", "rs", "py",
    "toml", "yaml", "yml", "xml", "config",
];

const PREVIEW_EXTENSIONLESS: &[&str] = &["README", "LICENSE", "Dockerfile"];

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectScanResult {
    pub name: String,
    pub path: String,
    pub files: Vec<ProjectFileNode>,
    pub total_files: usize,
    pub total_directories: usize,
    pub ignored_count: usize,
    pub truncated: bool,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectFileNode {
    pub name: String,
    pub path: String,
    pub relative_path: String,
    pub node_type: String,
    pub extension: Option<String>,
    pub size_bytes: Option<u64>,
    pub children: Option<Vec<ProjectFileNode>>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectPathValidation {
    pub exists: bool,
    pub is_directory: bool,
    pub readable: bool,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TextFilePreview {
    pub path: String,
    pub relative_path: String,
    pub content: String,
    pub truncated: bool,
    pub size_bytes: u64,
}

#[derive(Default)]
struct ScanStats {
    total_files: usize,
    total_directories: usize,
    ignored_count: usize,
    nodes_seen: usize,
    truncated: bool,
}

pub fn validate_project_path(path: &str) -> ProjectPathValidation {
    let candidate = Path::new(path);

    if !candidate.exists() {
        return ProjectPathValidation {
            exists: false,
            is_directory: false,
            readable: false,
            message: "Path does not exist.".to_string(),
        };
    }

    if !candidate.is_dir() {
        return ProjectPathValidation {
            exists: true,
            is_directory: false,
            readable: false,
            message: "Path exists, but it is not a directory.".to_string(),
        };
    }

    match fs::read_dir(candidate) {
        Ok(_) => ProjectPathValidation {
            exists: true,
            is_directory: true,
            readable: true,
            message: "Project folder is readable.".to_string(),
        },
        Err(error) => ProjectPathValidation {
            exists: true,
            is_directory: true,
            readable: false,
            message: format!("Project folder is not readable: {error}"),
        },
    }
}

pub fn scan_project_folder(path: &str) -> Result<ProjectScanResult, String> {
    let root = PathBuf::from(path);
    let validation = validate_project_path(path);

    if !validation.exists || !validation.is_directory || !validation.readable {
        return Err(validation.message);
    }

    let root = root
        .canonicalize()
        .map_err(|error| format!("Unable to resolve project path: {error}"))?;

    let mut stats = ScanStats::default();
    let files = scan_children(&root, &root, 0, &mut stats)?;
    let name = root
        .file_name()
        .and_then(OsStr::to_str)
        .unwrap_or("project")
        .to_string();

    Ok(ProjectScanResult {
        name,
        path: path_to_string(&root),
        files,
        total_files: stats.total_files,
        total_directories: stats.total_directories,
        ignored_count: stats.ignored_count,
        truncated: stats.truncated,
    })
}

pub fn read_text_file_preview(path: &str) -> Result<TextFilePreview, String> {
    let file_path = PathBuf::from(path);

    if !file_path.exists() {
        return Err("File no longer exists.".to_string());
    }

    if !file_path.is_file() {
        return Err("Preview is only available for files.".to_string());
    }

    let name = file_path
        .file_name()
        .and_then(OsStr::to_str)
        .unwrap_or_default();

    if is_env_file(name) {
        return Err("Preview disabled for secret/env files.".to_string());
    }

    if !is_preview_allowed(&file_path) {
        return Err("Preview disabled for this file type.".to_string());
    }

    let metadata = fs::metadata(&file_path)
        .map_err(|error| format!("Unable to read file metadata: {error}"))?;
    let size_bytes = metadata.len();
    let preview_len = size_bytes.min(MAX_PREVIEW_BYTES) as usize;
    let truncated = size_bytes > MAX_PREVIEW_BYTES;

    let mut file = fs::File::open(&file_path)
        .map_err(|error| format!("Unable to open file for preview: {error}"))?;
    let mut buffer = vec![0; preview_len];
    file.read_exact(&mut buffer)
        .map_err(|error| format!("Unable to read file preview: {error}"))?;

    if buffer.iter().any(|byte| *byte == 0) {
        return Err("Preview disabled for binary files.".to_string());
    }

    let content = String::from_utf8(buffer)
        .map_err(|_| "Preview disabled because the file is not valid UTF-8 text.".to_string())?;

    Ok(TextFilePreview {
        path: path_to_string(&file_path),
        relative_path: name.to_string(),
        content,
        truncated,
        size_bytes,
    })
}

fn scan_children(
    root: &Path,
    directory: &Path,
    depth: usize,
    stats: &mut ScanStats,
) -> Result<Vec<ProjectFileNode>, String> {
    if depth >= MAX_DEPTH || stats.nodes_seen >= MAX_NODES {
        stats.truncated = true;
        return Ok(Vec::new());
    }

    let entries = match fs::read_dir(directory) {
        Ok(entries) => entries,
        Err(_) => {
            stats.ignored_count += 1;
            return Ok(Vec::new());
        }
    };

    let mut nodes = Vec::new();

    for entry_result in entries {
        if stats.nodes_seen >= MAX_NODES {
            stats.truncated = true;
            break;
        }

        let entry = match entry_result {
            Ok(entry) => entry,
            Err(_) => {
                stats.ignored_count += 1;
                continue;
            }
        };

        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();

        if should_ignore(&path, &name) {
            stats.ignored_count += 1;
            continue;
        }

        let metadata = match entry.metadata() {
            Ok(metadata) => metadata,
            Err(_) => {
                stats.ignored_count += 1;
                continue;
            }
        };

        stats.nodes_seen += 1;

        if metadata.is_dir() {
            stats.total_directories += 1;
            let children = scan_children(root, &path, depth + 1, stats)?;
            nodes.push(ProjectFileNode {
                name,
                path: path_to_string(&path),
                relative_path: relative_path(root, &path),
                node_type: "directory".to_string(),
                extension: None,
                size_bytes: None,
                children: Some(children),
            });
        } else if metadata.is_file() {
            stats.total_files += 1;
            nodes.push(ProjectFileNode {
                name,
                path: path_to_string(&path),
                relative_path: relative_path(root, &path),
                node_type: "file".to_string(),
                extension: path
                    .extension()
                    .and_then(OsStr::to_str)
                    .map(|extension| extension.to_lowercase()),
                size_bytes: Some(metadata.len()),
                children: None,
            });
        } else {
            stats.ignored_count += 1;
        }
    }

    nodes.sort_by(|a, b| match (a.node_type.as_str(), b.node_type.as_str()) {
        ("directory", "file") => std::cmp::Ordering::Less,
        ("file", "directory") => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });

    Ok(nodes)
}

fn should_ignore(path: &Path, name: &str) -> bool {
    if path.is_dir() {
        IGNORED_DIRS.iter().any(|ignored| ignored.eq_ignore_ascii_case(name))
    } else {
        IGNORED_FILES
            .iter()
            .any(|ignored| ignored.eq_ignore_ascii_case(name))
    }
}

fn is_preview_allowed(path: &Path) -> bool {
    if let Some(extension) = path.extension().and_then(OsStr::to_str) {
        return PREVIEW_EXTENSIONS
            .iter()
            .any(|allowed| allowed.eq_ignore_ascii_case(extension));
    }

    let name = path.file_name().and_then(OsStr::to_str).unwrap_or_default();
    PREVIEW_EXTENSIONLESS
        .iter()
        .any(|allowed| allowed.eq_ignore_ascii_case(name))
}

fn is_env_file(name: &str) -> bool {
    name.eq_ignore_ascii_case(".env") || name.to_ascii_lowercase().starts_with(".env.")
}

fn relative_path(root: &Path, path: &Path) -> String {
    path.strip_prefix(root)
        .unwrap_or(path)
        .to_string_lossy()
        .replace('\\', "/")
}

fn path_to_string(path: &Path) -> String {
    path.to_string_lossy().to_string()
}
