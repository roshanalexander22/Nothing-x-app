//! Pure Nothing / CMF RFCOMM control protocol for CMF Buds 2a (B185).
//!
//! Zero OS dependencies — all packet encoding, CRC-16/MODBUS framing, stream
//! parsing, and reply decoding live here and are covered by unit tests.

use serde::{Deserialize, Serialize};
use std::fmt;

/// Primary RFCOMM Service Class UUID used for Nothing/CMF control packets.
pub const CONTROL_UUID: &str = "aeac4a03-dff5-498f-843a-34487cf133eb";

/// Fast Pair RFCOMM Service Class UUID used to read the 3-byte hardware model ID.
pub const FAST_PAIR_UUID: &str = "df21fe2c-2515-4fdb-8886-f12c4d67927c";

/// Known Fast Pair 3-byte model IDs for CMF Buds 2a (B185) colourways.
pub const B185_MODEL_IDS: &[(&str, &str)] = &[
    ("70F8E3", "Dark Grey"),
    ("ED5412", "Light Grey"),
    ("509CAE", "Orange"),
];

pub const START_BYTE: u8 = 0x55;
pub const HEADER_PROTO: u8 = 0x60;
pub const HEADER_VERSION: u8 = 0x01;
const FRAME_HEADER_LEN: usize = 8;
const MAX_PARSER_BUFFER: usize = 4096;

/// Known Nothing/CMF wire command identifiers.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[allow(dead_code)]
#[repr(u16)]
pub enum Command {
    SerialRead = 0xC006,
    BatteryRead = 0xC007,
    GesturesRead = 0xC018,
    AncRead = 0xC01E,
    DualEnabledRead = 0xC027,
    DualListRead = 0xC028,
    LatencyRead = 0xC041,
    FirmwareRead = 0xC042,
    CustomEqRead = 0xC044,
    AdvancedEqRead = 0xC04C,
    BassRead = 0xC04E,
    ListeningModeRead = 0xC050,

    RingSet = 0xF002,
    GestureSet = 0xF003,
    UtcTimeSet = 0xF00A,
    AncSet = 0xF00F,
    DualEnabledSet = 0xF01A,
    DualDeviceSet = 0xF01B,
    ListeningModeSet = 0xF01D,
    LatencySet = 0xF040,
    CustomEqSet = 0xF041,
    BassSet = 0xF051,
}

impl Command {
    pub const fn id(self) -> u16 {
        self as u16
    }

    pub const fn label(self) -> &'static str {
        match self {
            Self::SerialRead => "serial read",
            Self::BatteryRead => "battery read",
            Self::GesturesRead => "gestures read",
            Self::AncRead => "anc read",
            Self::DualEnabledRead => "dual enabled read",
            Self::DualListRead => "dual list read",
            Self::LatencyRead => "latency read",
            Self::FirmwareRead => "firmware read",
            Self::CustomEqRead => "custom eq read",
            Self::AdvancedEqRead => "advanced eq read",
            Self::BassRead => "ultra bass read",
            Self::ListeningModeRead => "eq preset read",
            Self::RingSet => "ring buds",
            Self::GestureSet => "gesture set",
            Self::UtcTimeSet => "utc time sync",
            Self::AncSet => "anc set",
            Self::DualEnabledSet => "dual connection toggle",
            Self::DualDeviceSet => "dual device link",
            Self::ListeningModeSet => "eq preset set",
            Self::LatencySet => "low lag set",
            Self::CustomEqSet => "custom eq set",
            Self::BassSet => "ultra bass set",
        }
    }
}

pub mod reply {
    pub const SERIAL: u16 = 0x4006;
    pub const BATTERY: u16 = 0x4007;
    pub const BATTERY_PUSH: u16 = 0xE001;
    pub const GESTURES: u16 = 0x4018;
    pub const ANC: u16 = 0x401E;
    pub const ANC_PUSH: u16 = 0xE003;
    pub const ANC_PUSH_ALT: u16 = 0x6003;
    pub const DUAL_ENABLED: u16 = 0x4027;
    pub const DUAL_LIST: u16 = 0x4028;
    pub const DUAL_EVENT_PUSH: u16 = 0xE00E;
    pub const LATENCY: u16 = 0x4041;
    pub const FIRMWARE: u16 = 0x4042;
    pub const CUSTOM_EQ: u16 = 0x4044;
    pub const BASS: u16 = 0x404E;
    pub const LISTENING_MODE: u16 = 0x4050;
}

/// CRC-16/MODBUS (polynomial 0x8005 reflected -> 0xA001, initial 0xFFFF).
pub fn crc16(data: &[u8]) -> u16 {
    let mut crc: u16 = 0xFFFF;
    for &b in data {
        crc ^= u16::from(b);
        for _ in 0..8 {
            crc = if crc & 1 != 0 { (crc >> 1) ^ 0xA001 } else { crc >> 1 };
        }
    }
    crc
}

/// Encodes an outbound packet with `55 60 01` header, command ID, length, op ID, payload, and CRC-16 LE.
pub fn encode_frame(cmd: Command, op_id: u8, payload: &[u8]) -> Vec<u8> {
    let len = u8::try_from(payload.len()).expect("protocol payload exceeds 255 bytes");
    let [id_lo, id_hi] = cmd.id().to_le_bytes();
    let mut frame = Vec::with_capacity(FRAME_HEADER_LEN + payload.len() + 2);
    frame.extend_from_slice(&[
        START_BYTE,
        HEADER_PROTO,
        HEADER_VERSION,
        id_lo,
        id_hi,
        len,
        0x00,
        op_id,
    ]);
    frame.extend_from_slice(payload);
    let crc = crc16(&frame);
    frame.extend_from_slice(&crc.to_le_bytes());
    frame
}

pub fn to_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

/// Sequential operation ID counter matching Nothing X / ear-web wrap behavior.
#[derive(Debug, Default)]
pub struct OpCounter(u32);

impl OpCounter {
    pub fn next(&mut self) -> u8 {
        self.0 += 1;
        (self.0 % 256) as u8
    }

    pub fn after_chunk(&mut self) {
        if self.0 >= 250 {
            self.0 = 1;
        }
    }
}

/// Validated inbound frame parsed from the RFCOMM stream.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct InboundFrame {
    bytes: Vec<u8>,
}

impl InboundFrame {
    pub fn cmd(&self) -> u16 {
        u16::from_le_bytes([self.bytes[3], self.bytes[4]])
    }

    #[allow(dead_code)]
    pub fn payload_len(&self) -> usize {
        usize::from(self.bytes[5])
    }

    pub fn byte(&self, offset: usize) -> Option<u8> {
        self.bytes.get(offset).copied()
    }

    pub fn slice(&self, from: usize, len: usize) -> Option<&[u8]> {
        self.bytes.get(from..from.checked_add(len)?)
    }

    pub fn payload(&self) -> &[u8] {
        &self.bytes[FRAME_HEADER_LEN..]
    }

    #[allow(dead_code)]
    pub fn raw(&self) -> &[u8] {
        &self.bytes
    }
}

/// Streaming frame parser handling chunk splits, coalesced frames, and optional trailing CRCs.
#[derive(Debug, Default)]
pub struct FrameParser {
    buf: Vec<u8>,
    expect_crc: Vec<u8>,
}

impl FrameParser {
    pub fn push(&mut self, chunk: &[u8]) -> Vec<InboundFrame> {
        self.buf.extend_from_slice(chunk);
        let mut out = Vec::new();
        loop {
            self.strip_crc();
            if self.buf.is_empty() {
                break;
            }
            match self.buf.iter().position(|&b| b == START_BYTE) {
                Some(0) => {}
                Some(idx) => {
                    self.buf.drain(..idx);
                }
                None => {
                    self.buf.clear();
                    break;
                }
            }
            if self.buf.len() < FRAME_HEADER_LEN {
                break;
            }
            let total_body = FRAME_HEADER_LEN + usize::from(self.buf[5]);
            if self.buf.len() < total_body {
                if self.buf.len() > MAX_PARSER_BUFFER {
                    self.buf.drain(..1);
                    continue;
                }
                break;
            }
            let frame_bytes: Vec<u8> = self.buf.drain(..total_body).collect();
            self.expect_crc = crc16(&frame_bytes).to_le_bytes().to_vec();
            out.push(InboundFrame { bytes: frame_bytes });
        }
        out
    }

    fn strip_crc(&mut self) {
        if self.expect_crc.is_empty() || self.buf.is_empty() {
            return;
        }
        let n = self.expect_crc.len().min(self.buf.len());
        if self.buf[..n] == self.expect_crc[..n] {
            self.buf.drain(..n);
            self.expect_crc.drain(..n);
        } else {
            self.expect_crc.clear();
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum AncMode {
    NoiseCancellation,
    Transparency,
    Off,
}

impl AncMode {
    pub fn to_wire(self) -> u8 {
        match self {
            Self::NoiseCancellation => 0x01,
            Self::Transparency => 0x07,
            Self::Off => 0x05,
        }
    }

    pub fn from_wire(code: u8) -> Option<Self> {
        match code {
            0x01..=0x04 => Some(Self::NoiseCancellation),
            0x07 => Some(Self::Transparency),
            0x05 => Some(Self::Off),
            _ => None,
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum EqPreset {
    Dirac,
    Rock,
    Electronic,
    Pop,
    Vocals,
    Classical,
    Custom,
}

impl EqPreset {
    /// Wire value sent in `0xF01D` (`ListeningModeSet`) for CMF Buds 2a (B185).
    /// Note that B185 sends `0x07` for Dirac, while reads may report `0x00` or `0x07`.
    pub fn to_wire(self) -> u8 {
        match self {
            Self::Dirac => 0x07,
            Self::Rock => 0x01,
            Self::Electronic => 0x02,
            Self::Pop => 0x03,
            Self::Vocals => 0x04,
            Self::Classical => 0x05,
            Self::Custom => 0x06,
        }
    }

    pub fn from_wire(code: u8) -> Option<Self> {
        match code {
            0x00 | 0x07 => Some(Self::Dirac),
            0x01 => Some(Self::Rock),
            0x02 => Some(Self::Electronic),
            0x03 => Some(Self::Pop),
            0x04 => Some(Self::Vocals),
            0x05 => Some(Self::Classical),
            0x06 => Some(Self::Custom),
            _ => None,
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomEqBands {
    pub bass: f32,
    pub mid: f32,
    pub treble: f32,
}

impl Default for CustomEqBands {
    fn default() -> Self {
        Self {
            bass: 0.0,
            mid: 0.0,
            treble: 0.0,
        }
    }
}

/// B185 custom 3-band EQ filter parameters (in payload order: Peak 980Hz, High Shelf 6900Hz, Low Shelf 140Hz).
struct EqBandSpec {
    filter: u8,
    freq: f32,
    q: f32,
    pick: fn(&CustomEqBands) -> f32,
}

const B185_EQ_BANDS: [EqBandSpec; 3] = [
    EqBandSpec { filter: 0x01, freq: 980.0, q: 0.7, pick: |b| b.mid },
    EqBandSpec { filter: 0x02, freq: 6900.0, q: 1.0, pick: |b| b.treble },
    EqBandSpec { filter: 0x00, freq: 140.0, q: 0.8, pick: |b| b.bass },
];

pub fn encode_custom_eq(bands: CustomEqBands) -> [u8; 53] {
    let clamped = CustomEqBands {
        bass: bands.bass.clamp(-6.0, 6.0).round(),
        mid: bands.mid.clamp(-6.0, 6.0).round(),
        treble: bands.treble.clamp(-6.0, 6.0).round(),
    };
    let max_gain = clamped.bass.max(clamped.mid).max(clamped.treble).max(0.0);
    let total_gain = if max_gain == 0.0 { -0.0f32 } else { -max_gain };

    let mut payload = [0u8; 53];
    payload[0] = 0x03;
    payload[1..5].copy_from_slice(&total_gain.to_le_bytes());

    for (idx, spec) in B185_EQ_BANDS.iter().enumerate() {
        let base = 5 + idx * 13;
        let gain = (spec.pick)(&clamped);
        let gain_val = if gain == 0.0 { 0.0f32 } else { gain };
        payload[base] = spec.filter;
        payload[base + 1..base + 5].copy_from_slice(&gain_val.to_le_bytes());
        payload[base + 5..base + 9].copy_from_slice(&spec.freq.to_le_bytes());
        payload[base + 9..base + 13].copy_from_slice(&spec.q.to_le_bytes());
    }
    payload
}

fn decode_eq_float(b: [u8; 4]) -> f32 {
    if b[1] == 0 && b[2] == 0 && b[3] == 0 && (b[0] & 0x80) != 0 {
        -f32::from_le_bytes([b[0] & 0x7F, 0, 0, 0])
    } else {
        let v = f32::from_le_bytes(b);
        if v == 0.0 { 0.0 } else { v }
    }
}

pub fn decode_custom_eq(frame: &InboundFrame) -> Option<CustomEqBands> {
    let mid_bytes: [u8; 4] = frame.slice(14, 4)?.try_into().ok()?;
    let treble_bytes: [u8; 4] = frame.slice(27, 4)?.try_into().ok()?;
    let bass_bytes: [u8; 4] = frame.slice(40, 4)?.try_into().ok()?;
    Some(CustomEqBands {
        bass: decode_eq_float(bass_bytes),
        mid: decode_eq_float(mid_bytes),
        treble: decode_eq_float(treble_bytes),
    })
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BatteryReading {
    pub level: u8,
    pub charging: bool,
}

#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BatteryInfo {
    pub left: Option<BatteryReading>,
    pub right: Option<BatteryReading>,
    pub case: Option<BatteryReading>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UltraBassState {
    pub enabled: bool,
    pub level: u8,
}

impl Default for UltraBassState {
    fn default() -> Self {
        Self { enabled: false, level: 3 }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GestureMapping {
    pub device: u8,  // 2 = Left, 3 = Right
    pub button: u8,  // 1 on B185
    pub gesture: u8, // 2 = Double, 3 = Triple, 7 = Tap & Hold, 9 = Double Tap & Hold
    pub action: u8,
}

pub fn default_b185_gestures() -> Vec<GestureMapping> {
    vec![
        GestureMapping { device: 2, button: 1, gesture: 2, action: 9 },  // L Double: Skip Forward
        GestureMapping { device: 2, button: 1, gesture: 3, action: 8 },  // L Triple: Skip Back
        GestureMapping { device: 2, button: 1, gesture: 7, action: 22 }, // L Hold: Noise Control
        GestureMapping { device: 2, button: 1, gesture: 9, action: 1 },  // L Double Hold: No Action
        GestureMapping { device: 3, button: 1, gesture: 2, action: 9 },  // R Double: Skip Forward
        GestureMapping { device: 3, button: 1, gesture: 3, action: 8 },  // R Triple: Skip Back
        GestureMapping { device: 3, button: 1, gesture: 7, action: 22 }, // R Hold: Noise Control
        GestureMapping { device: 3, button: 1, gesture: 9, action: 1 },  // R Double Hold: No Action
    ]
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DualDeviceEntry {
    pub mac: String,
    pub name: String,
    pub is_self: bool,
    pub is_connected: bool,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceStateSnapshot {
    pub connected: bool,
    pub device_name: String,
    pub custom_name: Option<String>,
    pub model_name: String,
    pub model_base: String,
    pub model_id: Option<String>,
    pub colorway: String,
    pub bluetooth_address: String,
    pub serial_number: Option<String>,
    pub firmware_version: Option<String>,
    pub battery: BatteryInfo,
    pub anc_mode: AncMode,
    pub ultra_bass: UltraBassState,
    pub eq_preset: EqPreset,
    pub custom_eq: CustomEqBands,
    pub low_lag_mode: bool,
    pub dual_connection_enabled: bool,
    pub dual_devices: Vec<DualDeviceEntry>,
    pub gestures: Vec<GestureMapping>,
}

impl Default for DeviceStateSnapshot {
    fn default() -> Self {
        Self {
            connected: false,
            device_name: "CMF Buds 2a".to_string(),
            custom_name: None,
            model_name: "CMF Buds 2a".to_string(),
            model_base: "B185".to_string(),
            model_id: None,
            colorway: "Dark Grey".to_string(),
            bluetooth_address: String::new(),
            serial_number: None,
            firmware_version: None,
            battery: BatteryInfo::default(),
            anc_mode: AncMode::Off,
            ultra_bass: UltraBassState::default(),
            eq_preset: EqPreset::Dirac,
            custom_eq: CustomEqBands::default(),
            low_lag_mode: false,
            dual_connection_enabled: false,
            dual_devices: Vec::new(),
            gestures: default_b185_gestures(),
        }
    }
}

pub fn format_mac(bytes: &[u8]) -> Option<String> {
    if bytes.len() < 6 {
        return None;
    }
    Some(format!(
        "{:02X}:{:02X}:{:02X}:{:02X}:{:02X}:{:02X}",
        bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5]
    ))
}

pub fn parse_mac(mac: &str) -> Result<[u8; 6], String> {
    let parts: Vec<&str> = mac.split(':').collect();
    if parts.len() != 6 {
        return Err(format!("invalid MAC address: {mac}"));
    }
    let mut out = [0u8; 6];
    for (i, part) in parts.iter().enumerate() {
        out[i] = u8::from_str_radix(part, 16).map_err(|_| format!("invalid MAC byte: {part}"))?;
    }
    Ok(out)
}

pub fn parse_serial_payload(payload: &[u8]) -> Option<String> {
    if payload.len() >= 8 {
        let text = String::from_utf8_lossy(&payload[7..]);
        for line in text.lines() {
            let parts: Vec<&str> = line.split(',').collect();
            if parts.len() == 3 && parts[1].trim() == "4" {
                let value = parts[2].trim();
                if !value.is_empty() {
                    return Some(value.to_string());
                }
            }
        }
    }
    // Fallback: look for standard Nothing/CMF serial prefixes inside ASCII payload.
    let ascii = String::from_utf8_lossy(payload);
    for token in ascii.split(|c: char| !c.is_ascii_alphanumeric()) {
        if token.len() >= 12 && (token.starts_with("SH") || token.starts_with("MA") || token.starts_with("13")) {
            return Some(token.to_string());
        }
    }
    None
}

impl DeviceStateSnapshot {
    /// Applies one inbound RFCOMM frame and returns true if any visible state changed.
    pub fn apply_frame(&mut self, frame: &InboundFrame) -> bool {
        let before = self.clone();
        match frame.cmd() {
            reply::BATTERY | reply::BATTERY_PUSH => {
                if let Some(count) = frame.byte(8) {
                    for i in 0..usize::from(count) {
                        let (Some(id), Some(raw)) = (frame.byte(9 + 2 * i), frame.byte(10 + 2 * i)) else {
                            break;
                        };
                        let reading = BatteryReading {
                            level: (raw & 0x7F).min(100),
                            charging: (raw & 0x80) != 0,
                        };
                        match id {
                            0x02 => self.battery.left = Some(reading),
                            0x03 => self.battery.right = Some(reading),
                            0x04 => self.battery.case = Some(reading),
                            _ => {}
                        }
                    }
                }
            }
            reply::FIRMWARE => {
                if let Some(len) = frame.byte(5) {
                    if let Some(raw) = frame.slice(8, usize::from(len)) {
                        let fw = String::from_utf8_lossy(raw).trim_matches('\0').trim().to_string();
                        if !fw.is_empty() {
                            self.firmware_version = Some(fw);
                        }
                    }
                }
            }
            reply::SERIAL => {
                if let Some(serial) = parse_serial_payload(frame.payload()) {
                    self.serial_number = Some(serial);
                }
            }
            reply::ANC | reply::ANC_PUSH | reply::ANC_PUSH_ALT => {
                if let Some(code) = frame.byte(9) {
                    if let Some(mode) = AncMode::from_wire(code) {
                        self.anc_mode = mode;
                    }
                }
            }
            reply::LISTENING_MODE => {
                if let Some(code) = frame.byte(8) {
                    if let Some(preset) = EqPreset::from_wire(code) {
                        self.eq_preset = preset;
                    }
                }
            }
            reply::CUSTOM_EQ => {
                if let Some(eq) = decode_custom_eq(frame) {
                    self.custom_eq = eq;
                }
            }
            reply::BASS => {
                if let (Some(enabled), Some(wire_level)) = (frame.byte(8), frame.byte(9)) {
                    let level = (wire_level / 2).clamp(1, 5);
                    self.ultra_bass = UltraBassState {
                        enabled: enabled == 1,
                        level,
                    };
                }
            }
            reply::LATENCY => {
                if let Some(val) = frame.byte(8) {
                    match val {
                        1 => self.low_lag_mode = true,
                        2 => self.low_lag_mode = false,
                        _ => {}
                    }
                }
            }
            reply::GESTURES => {
                if let Some(count) = frame.byte(8) {
                    let mut parsed = Vec::with_capacity(usize::from(count));
                    for i in 0..usize::from(count) {
                        let base = 9 + i * 4;
                        let (Some(device), Some(button), Some(gesture), Some(action)) = (
                            frame.byte(base),
                            frame.byte(base + 1),
                            frame.byte(base + 2),
                            frame.byte(base + 3),
                        ) else {
                            break;
                        };
                        parsed.push(GestureMapping {
                            device,
                            button,
                            gesture,
                            action,
                        });
                    }
                    if !parsed.is_empty() {
                        self.gestures = parsed;
                    }
                }
            }
            reply::DUAL_ENABLED => {
                if let Some(val) = frame.byte(8) {
                    self.dual_connection_enabled = val == 1;
                }
            }
            reply::DUAL_LIST => {
                self.parse_dual_list_frame(frame);
            }
            reply::DUAL_EVENT_PUSH => {
                if let (Some(conn_byte), Some(mac_bytes)) = (frame.byte(8), frame.slice(9, 6)) {
                    if let Some(mac) = format_mac(mac_bytes) {
                        let is_connected = conn_byte == 1;
                        if let Some(existing) = self.dual_devices.iter_mut().find(|d| d.mac == mac) {
                            existing.is_connected = is_connected;
                        }
                    }
                }
            }
            _ => {}
        }
        *self != before
    }

    fn parse_dual_list_frame(&mut self, frame: &InboundFrame) {
        let Some(count) = frame.byte(10) else { return };
        let mut offset = 11usize;
        for _ in 0..usize::from(count) {
            let Some(flags) = frame.byte(offset) else { break };
            let Some(mac_bytes) = frame.slice(offset + 1, 6) else { break };
            let Some(mac) = format_mac(mac_bytes) else { break };
            let Some(name_len_raw) = frame.byte(offset + 7) else { break };
            let name_len = usize::from(name_len_raw & 0x7F);
            let Some(name_bytes) = frame.slice(offset + 8, name_len) else { break };
            let name = String::from_utf8_lossy(name_bytes).to_string();
            let entry = DualDeviceEntry {
                mac: mac.clone(),
                name,
                is_self: (flags & 0xF0) != 0,
                is_connected: (flags & 0x0F) != 0,
            };
            if let Some(existing) = self.dual_devices.iter_mut().find(|d| d.mac == mac) {
                *existing = entry;
            } else {
                self.dual_devices.push(entry);
            }
            offset += 8 + name_len;
        }
    }
}

pub fn colorway_from_model_id(id: &str) -> &'static str {
    B185_MODEL_IDS
        .iter()
        .find(|(m_id, _)| m_id.eq_ignore_ascii_case(id))
        .map(|(_, color)| *color)
        .unwrap_or("Dark Grey")
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProtocolLogEntry {
    pub timestamp_ms: u64,
    pub direction: &'static str,
    pub label: String,
    pub hex: String,
}

impl fmt::Display for AncMode {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::NoiseCancellation => write!(f, "Noise Cancellation"),
            Self::Transparency => write!(f, "Transparency"),
            Self::Off => write!(f, "Off"),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn reply_frame(cmd: u16, payload: &[u8]) -> Vec<u8> {
        let [lo, hi] = cmd.to_le_bytes();
        let mut f = vec![0x55, 0x60, 0x01, lo, hi, payload.len() as u8, 0x00, 0x01];
        f.extend_from_slice(payload);
        let crc = crc16(&f).to_le_bytes();
        f.extend_from_slice(&crc);
        f
    }

    #[test]
    fn crc16_modbus_check() {
        assert_eq!(crc16(b"123456789"), 0x4B37);
    }

    #[test]
    fn golden_b185_frames_match_spec() {
        assert_eq!(to_hex(&encode_frame(Command::BatteryRead, 0x01, &[])), "55600107c0000001acdf");
        assert_eq!(to_hex(&encode_frame(Command::ListeningModeRead, 0x02, &[])), "55600150c00000029912");
        assert_eq!(to_hex(&encode_frame(Command::FirmwareRead, 0x03, &[])), "55600142c0000003e0d1");
        assert_eq!(to_hex(&encode_frame(Command::AncSet, 0x01, &[0x01, AncMode::Off.to_wire(), 0x00])), "5560010ff0030001010500fb17");
        assert_eq!(to_hex(&encode_frame(Command::AncSet, 0x01, &[0x01, AncMode::Transparency.to_wire(), 0x00])), "5560010ff0030001010700fa77");
        assert_eq!(to_hex(&encode_frame(Command::AncSet, 0x01, &[0x01, AncMode::NoiseCancellation.to_wire(), 0x00])), "5560010ff0030001010100f9d7");
        assert_eq!(to_hex(&encode_frame(Command::ListeningModeSet, 0x01, &[EqPreset::Dirac.to_wire(), 0x00])), "5560011df00200010700f959");
        assert_eq!(to_hex(&encode_frame(Command::LatencySet, 0x01, &[0x01, 0x00])), "55600140f00200010100763c");
        assert_eq!(to_hex(&encode_frame(Command::LatencySet, 0x01, &[0x02, 0x00])), "55600140f0020001020076cc");
    }

    #[test]
    fn golden_b185_custom_eq_matches_spec() {
        let eq = CustomEqBands { bass: 3.0, mid: 0.0, treble: -3.0 };
        let frame = encode_frame(Command::CustomEqSet, 0x01, &encode_custom_eq(eq));
        assert_eq!(
            to_hex(&frame),
            "55600141f035000103000040c00100000000000075443333333f02000040c000a0d7450000803f000000404000000c43cdcc4c3f000000000000000000531b"
        );
    }

    #[test]
    fn parses_split_and_merged_frames_into_snapshot() {
        let mut wire = Vec::new();
        wire.extend_from_slice(&[0x00, 0xFF]); // junk prefix
        wire.extend_from_slice(&reply_frame(reply::BATTERY, &[0x03, 0x02, 100, 0x03, 0x80 | 85, 0x04, 64]));
        wire.extend_from_slice(&reply_frame(reply::FIRMWARE, b"1.0.1.60"));
        wire.extend_from_slice(&reply_frame(reply::ANC, &[0x01, 0x07]));
        wire.extend_from_slice(&reply_frame(reply::BASS, &[0x01, 0x08]));
        wire.extend_from_slice(&reply_frame(reply::LISTENING_MODE, &[0x07]));
        wire.extend_from_slice(&reply_frame(reply::LATENCY, &[0x01]));

        let mut parser = FrameParser::default();
        let mut snap = DeviceStateSnapshot::default();
        for chunk in wire.chunks(7) {
            for f in parser.push(chunk) {
                snap.apply_frame(&f);
            }
        }

        assert_eq!(snap.battery.left, Some(BatteryReading { level: 100, charging: false }));
        assert_eq!(snap.battery.right, Some(BatteryReading { level: 85, charging: true }));
        assert_eq!(snap.battery.case, Some(BatteryReading { level: 64, charging: false }));
        assert_eq!(snap.firmware_version.as_deref(), Some("1.0.1.60"));
        assert_eq!(snap.anc_mode, AncMode::Transparency);
        assert_eq!(snap.ultra_bass, UltraBassState { enabled: true, level: 4 });
        assert_eq!(snap.eq_preset, EqPreset::Dirac);
        assert!(snap.low_lag_mode);
    }

    #[test]
    fn custom_eq_round_trips() {
        let eq = CustomEqBands { bass: 5.0, mid: -2.0, treble: 4.0 };
        let payload = encode_custom_eq(eq);
        let wire = reply_frame(reply::CUSTOM_EQ, &payload);
        let mut parser = FrameParser::default();
        let frames = parser.push(&wire);
        assert_eq!(frames.len(), 1);
        let decoded = decode_custom_eq(&frames[0]).unwrap();
        assert_eq!(decoded, eq);
    }

    #[test]
    fn serial_payload_decodes() {
        let mut p = vec![0u8; 7];
        p.extend_from_slice(b"0,1,FOO\n0,4,SH10062603005976\n");
        assert_eq!(parse_serial_payload(&p).as_deref(), Some("SH10062603005976"));
    }

    #[test]
    fn dual_list_decodes() {
        let mut payload = vec![0x00, 0x00, 0x01]; // reserved, reserved, count = 1
        payload.push(0x11); // flags: isSelf + isConnected
        payload.extend_from_slice(&[0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF]);
        let name = b"DESKTOP-ROSHAN";
        payload.push(name.len() as u8);
        payload.extend_from_slice(name);

        let wire = reply_frame(reply::DUAL_LIST, &payload);
        let mut parser = FrameParser::default();
        let mut snap = DeviceStateSnapshot::default();
        for f in parser.push(&wire) {
            snap.apply_frame(&f);
        }
        assert_eq!(snap.dual_devices.len(), 1);
        assert_eq!(snap.dual_devices[0].mac, "AA:BB:CC:DD:EE:FF");
        assert_eq!(snap.dual_devices[0].name, "DESKTOP-ROSHAN");
        assert!(snap.dual_devices[0].is_self);
        assert!(snap.dual_devices[0].is_connected);
    }
}

