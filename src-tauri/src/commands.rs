//! Tauri IPC commands bridging the React UI to the Rust Bluetooth engine.

use tauri::{AppHandle, Emitter, State};

use crate::bluetooth::protocol::{
    AncMode, CustomEqBands, DeviceStateSnapshot, EqPreset, GestureMapping, ProtocolLogEntry,
    default_b185_gestures,
};
use crate::bluetooth::windows::{PairedBluetoothDevice, list_paired_devices};
use crate::bluetooth::{OutboundAction, start_windows_session};
use crate::state::{AppPreferences, AppState};

async fn dispatch(state: &AppState, action: OutboundAction) -> Result<(), String> {
    let guard = state.session.lock().await;
    let session = guard
        .as_ref()
        .ok_or_else(|| "No earbuds connected. Connect your CMF Buds 2a first.".to_string())?;
    session
        .tx
        .send(action)
        .await
        .map_err(|_| "Bluetooth session closed. Please reconnect.".to_string())
}

#[tauri::command]
pub async fn scan_bluetooth_devices() -> Result<Vec<PairedBluetoothDevice>, String> {
    list_paired_devices().await.map_err(|e| format!("{e:#}"))
}

#[tauri::command]
pub async fn connect_device(
    app: AppHandle,
    address: Option<String>,
    state: State<'_, AppState>,
) -> Result<DeviceStateSnapshot, String> {
    // Tear down any previous RFCOMM session cleanly before opening a new one.
    if let Some(prev) = state.session.lock().await.take() {
        prev.abort_handle.abort();
    }

    let custom_name = state.prefs.lock().await.custom_name.clone();

    #[cfg(windows)]
    {
        let session = start_windows_session(
            app.clone(),
            address.clone(),
            state.snapshot.clone(),
            state.logs.clone(),
            custom_name,
        )
        .await
        .map_err(|e| format!("{e:#}"))?;

        let snap = state.snapshot.lock().await.clone();
        {
            let mut prefs = state.prefs.lock().await;
            prefs.last_address = Some(snap.bluetooth_address.clone());
        }
        let _ = state.save_prefs().await;
        *state.session.lock().await = Some(session);
        Ok(snap)
    }

    #[cfg(not(windows))]
    {
        let _ = (app, address, custom_name);
        Err("Bluetooth RFCOMM is only supported on Windows".to_string())
    }
}

#[tauri::command]
pub async fn disconnect_device(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<DeviceStateSnapshot, String> {
    if let Some(prev) = state.session.lock().await.take() {
        prev.abort_handle.abort();
    }
    let mut snap = state.snapshot.lock().await;
    snap.connected = false;
    let copy = snap.clone();
    drop(snap);
    let _ = app.emit("device-state", copy.clone());
    Ok(copy)
}

#[tauri::command]
pub async fn get_device_state(state: State<'_, AppState>) -> Result<DeviceStateSnapshot, String> {
    Ok(state.snapshot.lock().await.clone())
}

#[tauri::command]
pub async fn refresh_device_state(state: State<'_, AppState>) -> Result<(), String> {
    dispatch(&state, OutboundAction::RefreshAll).await
}

#[tauri::command]
pub async fn set_anc_mode(mode: AncMode, state: State<'_, AppState>) -> Result<(), String> {
    dispatch(&state, OutboundAction::SetAnc(mode)).await
}

#[tauri::command]
pub async fn set_ultra_bass(
    enabled: bool,
    level: u8,
    state: State<'_, AppState>,
) -> Result<(), String> {
    dispatch(&state, OutboundAction::SetUltraBass { enabled, level }).await
}

#[tauri::command]
pub async fn set_eq_preset(preset: EqPreset, state: State<'_, AppState>) -> Result<(), String> {
    dispatch(&state, OutboundAction::SetEqPreset(preset)).await
}

#[tauri::command]
pub async fn set_custom_eq(
    bands: CustomEqBands,
    state: State<'_, AppState>,
) -> Result<(), String> {
    dispatch(&state, OutboundAction::SetCustomEq(bands)).await
}

#[tauri::command]
pub async fn set_low_lag_mode(enabled: bool, state: State<'_, AppState>) -> Result<(), String> {
    dispatch(&state, OutboundAction::SetLowLag(enabled)).await
}

#[tauri::command]
pub async fn set_gesture(
    mapping: GestureMapping,
    state: State<'_, AppState>,
) -> Result<(), String> {
    dispatch(&state, OutboundAction::SetGesture(mapping)).await
}

#[tauri::command]
pub async fn reset_gestures(state: State<'_, AppState>) -> Result<(), String> {
    dispatch(&state, OutboundAction::ResetGestures(default_b185_gestures())).await
}

#[tauri::command]
pub async fn set_dual_connection(enabled: bool, state: State<'_, AppState>) -> Result<(), String> {
    dispatch(&state, OutboundAction::SetDualEnabled(enabled)).await
}

#[tauri::command]
pub async fn set_dual_device_link(
    mac: String,
    connect: bool,
    state: State<'_, AppState>,
) -> Result<(), String> {
    dispatch(&state, OutboundAction::SetDualDeviceConnect { mac, connect }).await
}

#[tauri::command]
pub async fn refresh_dual_devices(state: State<'_, AppState>) -> Result<(), String> {
    dispatch(&state, OutboundAction::RefreshDualList).await
}

#[tauri::command]
pub async fn ring_bud(
    left: bool,
    enable: bool,
    state: State<'_, AppState>,
) -> Result<(), String> {
    dispatch(&state, OutboundAction::RingBud { left, enable }).await
}

#[tauri::command]
pub async fn get_protocol_logs(
    state: State<'_, AppState>,
) -> Result<Vec<ProtocolLogEntry>, String> {
    Ok(state.logs.lock().await.iter().cloned().collect())
}

#[tauri::command]
pub async fn clear_protocol_logs(state: State<'_, AppState>) -> Result<(), String> {
    state.logs.lock().await.clear();
    Ok(())
}

#[tauri::command]
pub async fn get_preferences(state: State<'_, AppState>) -> Result<AppPreferences, String> {
    Ok(state.prefs.lock().await.clone())
}

#[tauri::command]
pub async fn update_preferences(
    app: AppHandle,
    prefs: AppPreferences,
    state: State<'_, AppState>,
) -> Result<AppPreferences, String> {
    {
        let mut stored = state.prefs.lock().await;
        *stored = prefs.clone();
    }
    state.save_prefs().await?;

    let mut snap = state.snapshot.lock().await;
    snap.custom_name = prefs.custom_name.clone();
    let copy = snap.clone();
    drop(snap);
    let _ = app.emit("device-state", copy);
    Ok(prefs)
}

