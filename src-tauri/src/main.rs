mod commands;
mod services;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::app::get_app_version,
            commands::project::validate_project_path,
            commands::project::scan_project_folder,
            commands::project::open_project_folder,
            commands::project::read_text_file_preview,
            commands::tools::get_mock_environment_status,
            commands::terminal::get_terminal_placeholder_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running SuperTerminal");
}
