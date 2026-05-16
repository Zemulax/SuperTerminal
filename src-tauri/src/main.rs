mod commands;
mod services;

fn main() {
    tauri::Builder::default()
        .manage(services::pty_service::PtyState::default())
        .invoke_handler(tauri::generate_handler![
            commands::app::get_app_version,
            commands::app::get_home_directory,
            commands::project::validate_project_path,
            commands::project::scan_project_folder,
            commands::project::open_project_folder,
            commands::project::read_text_file_preview,
            commands::tools::get_mock_environment_status,
            commands::terminal::get_terminal_placeholder_status,
            commands::installation::validate_install_command,
            commands::installation::run_install_command,
            commands::tools::check_tool,
            commands::tools::build_tool_launch_spec,
            commands::terminal::start_pty_session,
            commands::terminal::write_pty_input,
            commands::terminal::resize_pty_session,
            commands::terminal::stop_pty_session,
            commands::terminal::get_active_pty_session
        ])
        .run(tauri::generate_context!())
        .expect("error while running SuperTerminal");
}
