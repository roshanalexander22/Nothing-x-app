//! Tauri application entrypoint, system tray, and window lifecycle.

mod bluetooth;
mod commands;
mod state;

use tauri::{
    Manager, WindowEvent,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};

use bluetooth::OutboundAction;
use bluetooth::protocol::AncMode;
use state::AppState;

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

fn dispatch_tray_anc(app: &tauri::AppHandle, mode: AncMode) {
    let app_handle = app.clone();
    tauri::async_runtime::spawn(async move {
        let state = app_handle.state::<AppState>();
        let guard = state.session.lock().await;
        if let Some(session) = guard.as_ref() {
            let _ = session.tx.send(OutboundAction::SetAnc(mode)).await;
        }
    });
}

#[cfg(windows)]
struct SingleInstanceGuard(windows::Win32::Foundation::HANDLE);

#[cfg(windows)]
impl Drop for SingleInstanceGuard {
    fn drop(&mut self) {
        if !self.0.is_invalid() {
            unsafe {
                let _ = windows::Win32::Foundation::CloseHandle(self.0);
            }
        }
    }
}

/// Ensures only one desktop instance owns the WebView2 profile and wakes an
/// existing tray/minimized window when re-launched.
#[cfg(windows)]
fn acquire_single_instance() -> Option<SingleInstanceGuard> {
    use windows::Win32::Foundation::{ERROR_ALREADY_EXISTS, GetLastError};
    use windows::Win32::System::Threading::CreateMutexW;
    use windows::Win32::UI::WindowsAndMessaging::{
        FindWindowW, SW_RESTORE, SW_SHOW, SetForegroundWindow, ShowWindow,
    };
    use windows::core::w;

    unsafe {
        let handle = CreateMutexW(
            None,
            false,
            w!("Local\\com.roshan.nothingxdesktop.singleinstance"),
        )
        .ok()?;
        if GetLastError() == ERROR_ALREADY_EXISTS {
            let _ = windows::Win32::Foundation::CloseHandle(handle);
            if let Ok(hwnd) = FindWindowW(None, w!("Nothing X")) {
                if !hwnd.is_invalid() {
                    let _ = ShowWindow(hwnd, SW_SHOW);
                    let _ = ShowWindow(hwnd, SW_RESTORE);
                    let _ = SetForegroundWindow(hwnd);
                }
            }
            return None;
        }
        Some(SingleInstanceGuard(handle))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(windows)]
    let Some(_instance_guard) = acquire_single_instance() else {
        return;
    };

    tauri::Builder::default()
        .setup(|app| {
            let data_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| std::env::temp_dir().join("nothing-x-desktop"));
            let prefs_path = data_dir.join("preferences.json");
            let app_state = AppState::new(prefs_path);
            let auto_connect = app_state
                .prefs
                .try_lock()
                .map(|p| (p.auto_connect, p.last_address.clone()))
                .unwrap_or((true, None));

            app.manage(app_state);

            // Build Windows system tray menu with quick ANC controls.
            let open_item = MenuItem::with_id(app, "open", "Open Nothing X", true, None::<&str>)?;
            let sep1 = PredefinedMenuItem::separator(app)?;
            let anc_nc = MenuItem::with_id(app, "anc_nc", "Noise Cancellation", true, None::<&str>)?;
            let anc_trans = MenuItem::with_id(app, "anc_trans", "Transparency", true, None::<&str>)?;
            let anc_off = MenuItem::with_id(app, "anc_off", "ANC Off", true, None::<&str>)?;
            let sep2 = PredefinedMenuItem::separator(app)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            let tray_menu = Menu::with_items(
                app,
                &[&open_item, &sep1, &anc_nc, &anc_trans, &anc_off, &sep2, &quit_item],
            )?;

            let mut tray_builder = TrayIconBuilder::with_id("main-tray")
                .menu(&tray_menu)
                .tooltip("Nothing X • CMF Buds 2a")
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "open" => show_main_window(app),
                    "anc_nc" => dispatch_tray_anc(app, AncMode::NoiseCancellation),
                    "anc_trans" => dispatch_tray_anc(app, AncMode::Transparency),
                    "anc_off" => dispatch_tray_anc(app, AncMode::Off),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_main_window(tray.app_handle());
                    }
                });

            if let Some(icon) = app.default_window_icon().cloned() {
                tray_builder = tray_builder.icon(icon);
            }
            tray_builder.build(app)?;

            // Attempt silent auto-connect in background if enabled.
            if auto_connect.0 {
                let handle = app.handle().clone();
                let target_addr = auto_connect.1;
                tauri::async_runtime::spawn(async move {
                    #[cfg(windows)]
                    {
                        let state = handle.state::<AppState>();
                        let custom_name = state.prefs.lock().await.custom_name.clone();
                        if let Ok(session) = bluetooth::start_windows_session(
                            handle.clone(),
                            target_addr,
                            state.snapshot.clone(),
                            state.logs.clone(),
                            custom_name,
                        )
                        .await
                        {
                            *state.session.lock().await = Some(session);
                        }
                    }
                });
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                let state = window.state::<AppState>();
                let minimize_to_tray = state
                    .prefs
                    .try_lock()
                    .map(|p| p.minimize_to_tray)
                    .unwrap_or(true);
                if minimize_to_tray {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::scan_bluetooth_devices,
            commands::connect_device,
            commands::disconnect_device,
            commands::get_device_state,
            commands::refresh_device_state,
            commands::set_anc_mode,
            commands::set_ultra_bass,
            commands::set_eq_preset,
            commands::set_custom_eq,
            commands::set_low_lag_mode,
            commands::set_gesture,
            commands::reset_gestures,
            commands::set_dual_connection,
            commands::set_dual_device_link,
            commands::refresh_dual_devices,
            commands::ring_bud,
            commands::get_protocol_logs,
            commands::clear_protocol_logs,
            commands::get_preferences,
            commands::update_preferences,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Nothing X Desktop");
}

