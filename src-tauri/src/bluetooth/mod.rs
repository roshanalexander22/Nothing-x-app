//! Bluetooth RFCOMM session manager bridging the Windows socket stream with
//! the React frontend via Tauri commands and real-time events.

pub mod protocol;

#[cfg(windows)]
pub mod windows;

#[cfg(not(windows))]
pub mod windows {
    use anyhow::bail;
    use serde::Serialize;

    #[derive(Clone, Debug, Serialize)]
    #[serde(rename_all = "camelCase")]
    pub struct PairedBluetoothDevice {
        pub address: String,
        pub name: String,
        pub connected: bool,
        pub supports_control: bool,
    }

    pub async fn list_paired_devices() -> anyhow::Result<Vec<PairedBluetoothDevice>> {
        Ok(Vec::new())
    }

    pub async fn open_device(_address: Option<&str>) -> anyhow::Result<()> {
        bail!("Bluetooth RFCOMM is only supported on Windows")
    }
}

use std::collections::VecDeque;
use std::sync::Arc;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::sync::{Mutex, mpsc};

use protocol::{
    AncMode, Command, CustomEqBands, DeviceStateSnapshot, EqPreset, FrameParser, GestureMapping,
    OpCounter, ProtocolLogEntry, colorway_from_model_id, encode_custom_eq, encode_frame, parse_mac,
    reply, to_hex,
};

const MAX_LOG_ENTRIES: usize = 120;

#[derive(Debug)]
pub enum OutboundAction {
    SetAnc(AncMode),
    SetUltraBass { enabled: bool, level: u8 },
    SetEqPreset(EqPreset),
    SetCustomEq(CustomEqBands),
    SetLowLag(bool),
    SetGesture(GestureMapping),
    ResetGestures(Vec<GestureMapping>),
    SetDualEnabled(bool),
    SetDualDeviceConnect { mac: String, connect: bool },
    RefreshDualList,
    RingBud { left: bool, enable: bool },
    RefreshAll,
}

pub struct ActiveSession {
    pub tx: mpsc::Sender<OutboundAction>,
    pub abort_handle: tokio::task::AbortHandle,
}

pub fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

pub fn push_log(logs: &mut VecDeque<ProtocolLogEntry>, entry: ProtocolLogEntry) {
    if logs.len() >= MAX_LOG_ENTRIES {
        logs.pop_front();
    }
    logs.push_back(entry);
}

#[cfg(windows)]
pub async fn start_windows_session(
    app: AppHandle,
    address: Option<String>,
    snapshot_state: Arc<Mutex<DeviceStateSnapshot>>,
    logs_state: Arc<Mutex<VecDeque<ProtocolLogEntry>>>,
    custom_name: Option<String>,
) -> anyhow::Result<ActiveSession> {
    let opened = windows::open_device(address.as_deref()).await?;
    let (mut reader, mut writer) = tokio::io::split(opened.stream);

    {
        let mut snap = snapshot_state.lock().await;
        *snap = DeviceStateSnapshot {
            connected: true,
            device_name: opened.device.name.clone(),
            custom_name,
            model_name: "CMF Buds 2a".to_string(),
            model_base: "B185".to_string(),
            colorway: opened
                .model_id
                .as_deref()
                .map(colorway_from_model_id)
                .unwrap_or("Dark Grey")
                .to_string(),
            model_id: opened.model_id.clone(),
            bluetooth_address: opened.device.address.clone(),
            ..DeviceStateSnapshot::default()
        };
    }

    emit_snapshot(&app, &snapshot_state).await;

    let (tx, mut rx) = mpsc::channel::<OutboundAction>(32);
    let tx_internal = tx.clone();

    let handle = tokio::spawn(async move {
        let mut ops = OpCounter::default();
        let mut parser = FrameParser::default();
        let mut read_buf = [0u8; 2048];
        let mut custom_eq_requested = false;
        let mut dual_pages_requested: u8 = 0;
        let mut known_dual_macs: usize = 0;

        // Kick off B185 connect sequence in a staggered task via channel or inline.
        let init_steps: &[(u64, Command, &[u8])] = &[
            (0, Command::BatteryRead, &[]),
            (120, Command::ListeningModeRead, &[]),
            (220, Command::FirmwareRead, &[]),
            (320, Command::SerialRead, &[]),
            (420, Command::LatencyRead, &[]),
            (520, Command::GesturesRead, &[]),
            (620, Command::AncRead, &[]),
            (720, Command::BassRead, &[]),
            (820, Command::DualEnabledRead, &[]),
            (920, Command::DualListRead, &[0x00]),
        ];

        let mut next_step = 0usize;
        let start = tokio::time::Instant::now();

        loop {
            let step_sleep = if next_step < init_steps.len() {
                let target = start + Duration::from_millis(init_steps[next_step].0);
                Some(tokio::time::sleep_until(target))
            } else {
                None
            };

            tokio::select! {
                _ = async {
                    if let Some(s) = step_sleep {
                        s.await;
                    } else {
                        std::future::pending::<()>().await;
                    }
                } => {
                    let (_, cmd, payload) = init_steps[next_step];
                    next_step += 1;
                    if let Err(e) = send_and_log(&app, &mut writer, &mut ops, cmd, payload, &logs_state).await {
                        eprintln!("[nothing-x] connect step failed: {e}");
                        break;
                    }
                }
                read_res = reader.read(&mut read_buf) => {
                    match read_res {
                        Ok(0) | Err(_) => {
                            break;
                        }
                        Ok(n) => {
                            let chunk = &read_buf[..n];
                            record_log(&app, &logs_state, "RX", "rfcomm rx", to_hex(chunk)).await;
                            let frames = parser.push(chunk);
                            ops.after_chunk();

                            let mut changed = false;
                            let mut request_custom_eq = false;
                            let mut next_dual_start: Option<u8> = None;
                            let mut restart_dual_list = false;

                            {
                                let mut snap = snapshot_state.lock().await;
                                for f in &frames {
                                    changed |= snap.apply_frame(f);
                                    if f.cmd() == reply::LISTENING_MODE
                                        && snap.eq_preset == EqPreset::Custom
                                        && !custom_eq_requested
                                    {
                                        custom_eq_requested = true;
                                        request_custom_eq = true;
                                    }
                                    if f.cmd() == reply::DUAL_LIST {
                                        let len = snap.dual_devices.len();
                                        if len > known_dual_macs && dual_pages_requested < 20 {
                                            known_dual_macs = len;
                                            dual_pages_requested += 1;
                                            next_dual_start = Some(len as u8);
                                        }
                                    }
                                    if f.cmd() == reply::DUAL_EVENT_PUSH {
                                        restart_dual_list = true;
                                    }
                                }
                            }

                            if changed {
                                emit_snapshot(&app, &snapshot_state).await;
                            }
                            if request_custom_eq {
                                let _ = send_and_log(&app, &mut writer, &mut ops, Command::CustomEqRead, &[], &logs_state).await;
                            }
                            if restart_dual_list {
                                dual_pages_requested = 0;
                                known_dual_macs = 0;
                                let _ = send_and_log(&app, &mut writer, &mut ops, Command::DualListRead, &[0x00], &logs_state).await;
                            } else if let Some(idx) = next_dual_start {
                                let _ = send_and_log(&app, &mut writer, &mut ops, Command::DualListRead, &[idx], &logs_state).await;
                            }
                        }
                    }
                }
                maybe_action = rx.recv() => {
                    let Some(action) = maybe_action else { break };
                    if let Err(e) = handle_outbound(
                        &app,
                        &mut writer,
                        &mut ops,
                        &snapshot_state,
                        &logs_state,
                        action,
                    ).await {
                        let _ = app.emit("bluetooth-error", e.to_string());
                    }
                }
            }
        }

        // Link closed — update connected state and notify frontend.
        {
            let mut snap = snapshot_state.lock().await;
            snap.connected = false;
        }
        emit_snapshot(&app, &snapshot_state).await;
        drop(tx_internal);
    });

    Ok(ActiveSession {
        tx,
        abort_handle: handle.abort_handle(),
    })
}

async fn handle_outbound<W: AsyncWriteExt + Unpin>(
    app: &AppHandle,
    writer: &mut W,
    ops: &mut OpCounter,
    snapshot_state: &Arc<Mutex<DeviceStateSnapshot>>,
    logs_state: &Arc<Mutex<VecDeque<ProtocolLogEntry>>>,
    action: OutboundAction,
) -> anyhow::Result<()> {
    match action {
        OutboundAction::SetAnc(mode) => {
            send_and_log(app, writer, ops, Command::AncSet, &[0x01, mode.to_wire(), 0x00], logs_state).await?;
            snapshot_state.lock().await.anc_mode = mode;
        }
        OutboundAction::SetUltraBass { enabled, level } => {
            let clamped = level.clamp(1, 5);
            let payload = [u8::from(enabled), clamped * 2];
            send_and_log(app, writer, ops, Command::BassSet, &payload, logs_state).await?;
            snapshot_state.lock().await.ultra_bass = protocol::UltraBassState {
                enabled,
                level: clamped,
            };
        }
        OutboundAction::SetEqPreset(preset) => {
            send_and_log(app, writer, ops, Command::ListeningModeSet, &[preset.to_wire(), 0x00], logs_state).await?;
            snapshot_state.lock().await.eq_preset = preset;
            if preset == EqPreset::Custom {
                send_and_log(app, writer, ops, Command::CustomEqRead, &[], logs_state).await?;
            }
        }
        OutboundAction::SetCustomEq(bands) => {
            let payload = encode_custom_eq(bands);
            send_and_log(app, writer, ops, Command::CustomEqSet, &payload, logs_state).await?;
            let mut snap = snapshot_state.lock().await;
            snap.eq_preset = EqPreset::Custom;
            snap.custom_eq = bands;
        }
        OutboundAction::SetLowLag(enabled) => {
            let payload = if enabled { [0x01, 0x00] } else { [0x02, 0x00] };
            send_and_log(app, writer, ops, Command::LatencySet, &payload, logs_state).await?;
            snapshot_state.lock().await.low_lag_mode = enabled;
        }
        OutboundAction::SetGesture(g) => {
            let payload = [0x01, g.device, g.button, g.gesture, g.action];
            send_and_log(app, writer, ops, Command::GestureSet, &payload, logs_state).await?;
            let mut snap = snapshot_state.lock().await;
            if let Some(existing) = snap
                .gestures
                .iter_mut()
                .find(|item| item.device == g.device && item.gesture == g.gesture)
            {
                existing.action = g.action;
            } else {
                snap.gestures.push(g);
            }
        }
        OutboundAction::ResetGestures(defaults) => {
            for g in &defaults {
                let payload = [0x01, g.device, g.button, g.gesture, g.action];
                send_and_log(app, writer, ops, Command::GestureSet, &payload, logs_state).await?;
                tokio::time::sleep(Duration::from_millis(40)).await;
            }
            snapshot_state.lock().await.gestures = defaults;
        }
        OutboundAction::SetDualEnabled(enabled) => {
            send_and_log(app, writer, ops, Command::DualEnabledSet, &[u8::from(enabled)], logs_state).await?;
            snapshot_state.lock().await.dual_connection_enabled = enabled;
            if enabled {
                tokio::time::sleep(Duration::from_millis(300)).await;
                send_and_log(app, writer, ops, Command::DualListRead, &[0x00], logs_state).await?;
            }
        }
        OutboundAction::SetDualDeviceConnect { mac, connect } => {
            let mac_bytes = parse_mac(&mac).map_err(|e| anyhow::anyhow!(e))?;
            let mut payload = Vec::with_capacity(7);
            payload.push(u8::from(connect));
            payload.extend_from_slice(&mac_bytes);
            send_and_log(app, writer, ops, Command::DualDeviceSet, &payload, logs_state).await?;
            tokio::time::sleep(Duration::from_millis(300)).await;
            send_and_log(app, writer, ops, Command::DualListRead, &[0x00], logs_state).await?;
        }
        OutboundAction::RefreshDualList => {
            snapshot_state.lock().await.dual_devices.clear();
            send_and_log(app, writer, ops, Command::DualListRead, &[0x00], logs_state).await?;
        }
        OutboundAction::RingBud { left, enable } => {
            let device = if left { 0x02 } else { 0x03 };
            send_and_log(app, writer, ops, Command::RingSet, &[device, u8::from(enable)], logs_state).await?;
        }
        OutboundAction::RefreshAll => {
            for (cmd, payload) in [
                (Command::BatteryRead, &[][..]),
                (Command::AncRead, &[]),
                (Command::ListeningModeRead, &[]),
                (Command::BassRead, &[]),
                (Command::LatencyRead, &[]),
                (Command::GesturesRead, &[]),
                (Command::DualEnabledRead, &[]),
                (Command::DualListRead, &[0x00]),
            ] {
                send_and_log(app, writer, ops, cmd, payload, logs_state).await?;
                tokio::time::sleep(Duration::from_millis(60)).await;
            }
        }
    }
    emit_snapshot(app, snapshot_state).await;
    Ok(())
}

async fn send_and_log<W: AsyncWriteExt + Unpin>(
    app: &AppHandle,
    writer: &mut W,
    ops: &mut OpCounter,
    cmd: Command,
    payload: &[u8],
    logs_state: &Arc<Mutex<VecDeque<ProtocolLogEntry>>>,
) -> anyhow::Result<()> {
    let frame = encode_frame(cmd, ops.next(), payload);
    record_log(app, logs_state, "TX", cmd.label(), to_hex(&frame)).await;
    writer.write_all(&frame).await?;
    writer.flush().await?;
    Ok(())
}

async fn record_log(
    app: &AppHandle,
    logs_state: &Arc<Mutex<VecDeque<ProtocolLogEntry>>>,
    direction: &'static str,
    label: &str,
    hex: String,
) {
    let entry = ProtocolLogEntry {
        timestamp_ms: now_ms(),
        direction,
        label: label.to_string(),
        hex,
    };
    push_log(&mut *logs_state.lock().await, entry.clone());
    let _ = app.emit("protocol-log", entry);
}

async fn emit_snapshot(app: &AppHandle, snapshot_state: &Arc<Mutex<DeviceStateSnapshot>>) {
    let snap = snapshot_state.lock().await.clone();
    update_tray_tooltip(app, &snap);
    let _ = app.emit("device-state", snap);
}

fn update_tray_tooltip(app: &AppHandle, snap: &DeviceStateSnapshot) {
    if let Some(tray) = app.tray_by_id("main-tray") {
        let tooltip = if snap.connected {
            let l = snap.battery.left.map(|b| format!("L {}%", b.level)).unwrap_or_else(|| "L --".into());
            let r = snap.battery.right.map(|b| format!("R {}%", b.level)).unwrap_or_else(|| "R --".into());
            let name = snap.custom_name.as_deref().unwrap_or(&snap.device_name);
            format!("{name} • {l}  {r} • {}", snap.anc_mode)
        } else {
            "Nothing X • Disconnected".to_string()
        };
        let _ = tray.set_tooltip(Some(tooltip));
    }
}


