mod commands;
mod services;

fn main() {
    tauri::Builder::default()
        .manage(services::pty_service::PtyState::default())
        .invoke_handler(tauri::generate_handler![
            commands::app::get_app_version,
            commands::app::get_home_directory,
            commands::context::create_context_prompt_file,
            commands::diagnostics::get_command_resolution_diagnostics,
            commands::diagnostics::get_environment_diagnostics,
            commands::project::validate_project_path,
            commands::project::scan_project_folder,
            commands::project::open_project_folder,
            commands::project::pick_project_folder,
            commands::project::read_text_file_preview,
            commands::secrets::save_tool_secret_env_var,
            commands::secrets::delete_tool_secret_env_var,
            commands::secrets::list_tool_secret_env_vars,
            commands::secrets::set_tool_secret_env_var_enabled,
            commands::secrets::redact_configured_secrets,
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
