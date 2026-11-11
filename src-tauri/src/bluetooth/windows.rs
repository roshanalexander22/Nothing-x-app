//! Windows Bluetooth Classic transport using WinRT device discovery and
//! Winsock `AF_BTH` RFCOMM sockets (channel resolved automatically via SDP).

use std::io;
use std::pin::Pin;
use std::task::{Context as TaskContext, Poll, ready};
use std::time::Duration;

use anyhow::{Context, anyhow, bail};
use serde::Serialize;
use tokio::io::{AsyncRead, AsyncReadExt, AsyncWrite, ReadBuf};
use tokio::sync::mpsc;
use windows::Devices::Bluetooth::Rfcomm::RfcommServiceId;
use windows::Devices::Bluetooth::{BluetoothCacheMode, BluetoothConnectionStatus, BluetoothDevice};
use windows::Devices::Enumeration::DeviceInformation;
use windows::Win32::Devices::Bluetooth::{AF_BTH, BTHPROTO_RFCOMM, SOCKADDR_BTH};
use windows::Win32::Networking::WinSock::{
    SD_BOTH, SEND_RECV_FLAGS, SOCK_STREAM, SOCKADDR, SOCKET, WSADATA, WSAGetLastError, WSAStartup,
    closesocket, connect, recv, send, shutdown, socket,
};
use windows::core::GUID;

use super::protocol::{CONTROL_UUID, FAST_PAIR_UUID, to_hex};

const FAST_PAIR_TIMEOUT: Duration = Duration::from_millis(2500);

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PairedBluetoothDevice {
    pub address: String,
    pub name: String,
    pub connected: bool,
    pub supports_control: bool,
}

pub struct OpenedConnection {
    pub device: PairedBluetoothDevice,
    pub model_id: Option<String>,
    pub stream: BthStream,
}

fn guid(s: &str) -> GUID {
    GUID::from_u128(u128::from_str_radix(&s.replace('-', ""), 16).expect("valid constant uuid"))
}

pub fn format_bt_address(addr: u64) -> String {
    let b = addr.to_be_bytes();
    format!(
        "{:02X}:{:02X}:{:02X}:{:02X}:{:02X}:{:02X}",
        b[2], b[3], b[4], b[5], b[6], b[7]
    )
}

#[allow(dead_code)]
pub fn parse_bt_address(addr: &str) -> anyhow::Result<u64> {
    let parts: Vec<&str> = addr.split(':').collect();
    if parts.len() != 6 {
        bail!("invalid Bluetooth address: {addr}");
    }
    let mut bytes = [0u8; 8];
    for (i, part) in parts.iter().enumerate() {
        bytes[2 + i] = u8::from_str_radix(part, 16)
            .with_context(|| format!("invalid hex byte '{part}' in {addr}"))?;
    }
    Ok(u64::from_be_bytes(bytes))
}

fn offers_service(device: &BluetoothDevice, uuid_str: &str) -> bool {
    let Ok(id) = RfcommServiceId::FromUuid(guid(uuid_str)) else {
        return false;
    };
    let Ok(op) = device.GetRfcommServicesForIdWithCacheModeAsync(&id, BluetoothCacheMode::Cached) else {
        return false;
    };
    let Ok(result) = op.join() else {
        return false;
    };
    result.Services().and_then(|s| s.Size()).unwrap_or(0) > 0
}

fn enumerate_paired_sync() -> anyhow::Result<Vec<(u64, PairedBluetoothDevice)>> {
    let selector = BluetoothDevice::GetDeviceSelectorFromPairingState(true)?;
    let infos = DeviceInformation::FindAllAsyncAqsFilter(&selector)?
        .join()
        .context("failed to enumerate paired Windows Bluetooth devices")?;

    let mut out = Vec::new();
    for info in infos {
        let Ok(id) = info.Id() else { continue };
        let Ok(device) = BluetoothDevice::FromIdAsync(&id).and_then(|op| op.join()) else {
            continue;
        };
        let Ok(bt_addr) = device.BluetoothAddress() else { continue };
        let name = device.Name().map(|n| n.to_string()).unwrap_or_else(|_| "Bluetooth Device".into());
        let supports_control = offers_service(&device, CONTROL_UUID);
        let lower = name.to_lowercase();
        let likely_nothing = lower.contains("cmf") || lower.contains("nothing") || lower.contains("ear (");
        if !supports_control && !likely_nothing {
            continue;
        }
        let connected = device
            .ConnectionStatus()
            .map(|s| s == BluetoothConnectionStatus::Connected)
            .unwrap_or(false);

        out.push((
            bt_addr,
            PairedBluetoothDevice {
                address: format_bt_address(bt_addr),
                name,
                connected,
                supports_control,
            },
        ));
    }
    Ok(out)
}

pub async fn list_paired_devices() -> anyhow::Result<Vec<PairedBluetoothDevice>> {
    let items = tokio::task::spawn_blocking(enumerate_paired_sync).await??;
    Ok(items.into_iter().map(|(_, dev)| dev).collect())
}

struct SocketHandle(SOCKET);

impl Drop for SocketHandle {
    fn drop(&mut self) {
        unsafe {
            shutdown(self.0, SD_BOTH);
            closesocket(self.0);
        }
    }
}

fn wsa_error(context_label: &str) -> io::Error {
    let code = unsafe { WSAGetLastError() };
    let raw = io::Error::from_raw_os_error(code.0);
    io::Error::new(raw.kind(), format!("{context_label}: {raw}"))
}

fn connect_rfcomm_sync(bt_addr: u64, service_uuid: &str) -> anyhow::Result<SocketHandle> {
    let mut wsa = WSADATA::default();
    let rc = unsafe { WSAStartup(0x0202, &mut wsa) };
    if rc != 0 {
        bail!("WSAStartup failed with code {rc}");
    }
    let sock = unsafe { socket(AF_BTH as i32, SOCK_STREAM, BTHPROTO_RFCOMM as i32) }
        .map_err(|e| anyhow!("cannot create AF_BTH RFCOMM socket: {e}"))?;
    let handle = SocketHandle(sock);

    let sockaddr = SOCKADDR_BTH {
        addressFamily: AF_BTH,
        btAddr: bt_addr,
        serviceClassId: guid(service_uuid),
        port: 0,
    };
    let rc = unsafe {
        connect(
            handle.0,
            &sockaddr as *const SOCKADDR_BTH as *const SOCKADDR,
            size_of::<SOCKADDR_BTH>() as i32,
        )
    };
    if rc != 0 {
        let err = wsa_error("RFCOMM connect");
        bail!(
            "Could not connect RFCOMM service on {} ({err}). Make sure the earbuds are out of the case, connected to Windows, and disconnected from the phone Nothing X app.",
            format_bt_address(bt_addr)
        );
    }
    Ok(handle)
}

/// Asynchronous wrapper around a blocking Winsock RFCOMM stream.
pub struct BthStream {
    socket: SocketHandle,
    rx: mpsc::UnboundedReceiver<io::Result<Vec<u8>>>,
    pending: Vec<u8>,
}

impl BthStream {
    fn new(socket: SocketHandle) -> Self {
        let (tx, rx) = mpsc::unbounded_channel();
        let raw_socket = socket.0;
        std::thread::spawn(move || {
            let mut buf = [0u8; 1024];
            loop {
                let n = unsafe { recv(raw_socket, &mut buf, SEND_RECV_FLAGS(0)) };
                let msg = match n {
                    0 => break,
                    n if n < 0 => Err(wsa_error("recv")),
                    n => Ok(buf[..n as usize].to_vec()),
                };
                let is_err = msg.is_err();
                if tx.send(msg).is_err() || is_err {
                    break;
                }
            }
        });
        Self {
            socket,
            rx,
            pending: Vec::new(),
        }
    }
}

impl AsyncRead for BthStream {
    fn poll_read(
        mut self: Pin<&mut Self>,
        cx: &mut TaskContext<'_>,
        out: &mut ReadBuf<'_>,
    ) -> Poll<io::Result<()>> {
        if self.pending.is_empty() {
            match ready!(self.rx.poll_recv(cx)) {
                Some(Ok(chunk)) => self.pending = chunk,
                Some(Err(e)) => return Poll::Ready(Err(e)),
                None => return Poll::Ready(Ok(())),
            }
        }
        let n = self.pending.len().min(out.remaining());
        out.put_slice(&self.pending[..n]);
        self.pending.drain(..n);
        Poll::Ready(Ok(()))
    }
}

impl AsyncWrite for BthStream {
    fn poll_write(
        self: Pin<&mut Self>,
        _cx: &mut TaskContext<'_>,
        data: &[u8],
    ) -> Poll<io::Result<usize>> {
        let n = unsafe { send(self.socket.0, data, SEND_RECV_FLAGS(0)) };
        Poll::Ready(if n < 0 {
            Err(wsa_error("send"))
        } else {
            Ok(n as usize)
        })
    }

    fn poll_flush(self: Pin<&mut Self>, _cx: &mut TaskContext<'_>) -> Poll<io::Result<()>> {
        Poll::Ready(Ok(()))
    }

    fn poll_shutdown(self: Pin<&mut Self>, _cx: &mut TaskContext<'_>) -> Poll<io::Result<()>> {
        Poll::Ready(Ok(()))
    }
}

async fn try_read_fast_pair_model_id(bt_addr: u64) -> Option<String> {
    let sock = tokio::task::spawn_blocking(move || connect_rfcomm_sync(bt_addr, FAST_PAIR_UUID))
        .await
        .ok()?
        .ok()?;
    let mut stream = BthStream::new(sock);
    let mut buf = [0u8; 256];
    let result = tokio::time::timeout(FAST_PAIR_TIMEOUT, async {
        loop {
            let n = stream.read(&mut buf).await.ok()?;
            if n == 0 {
                return None;
            }
            if n == 7 {
                return Some(to_hex(&buf[4..7]).to_uppercase());
            }
        }
    })
    .await;
    result.ok().flatten()
}

pub async fn open_device(address: Option<&str>) -> anyhow::Result<OpenedConnection> {
    let devices = tokio::task::spawn_blocking(enumerate_paired_sync).await??;
    let chosen = if let Some(target) = address {
        devices
            .into_iter()
            .find(|(_, d)| d.address.eq_ignore_ascii_case(target))
            .ok_or_else(|| anyhow!("Paired Bluetooth device {target} was not found."))?
    } else {
        devices
            .clone()
            .into_iter()
            .find(|(_, d)| d.connected && d.supports_control)
            .or_else(|| devices.into_iter().find(|(_, d)| d.supports_control))
            .ok_or_else(|| anyhow!("No paired Nothing/CMF audio device found on Windows Bluetooth."))?
    };

    let (bt_addr, device_info) = chosen;

    // Best-effort Fast Pair model ID probe (identifies Dark Grey / White / Orange B185).
    let model_id = try_read_fast_pair_model_id(bt_addr).await;

    let control_sock =
        tokio::task::spawn_blocking(move || connect_rfcomm_sync(bt_addr, CONTROL_UUID)).await??;
    let stream = BthStream::new(control_sock);

    Ok(OpenedConnection {
        device: device_info,
        model_id,
        stream,
    })
}

