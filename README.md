# Nothing X Desktop — CMF Buds 2a Companion

An unofficial **Windows desktop companion app (`.exe`)** for **CMF Buds 2a (`Model B185`)**, built with the Nothing X aesthetic and powered by a **Rust + Tauri 2.0** backend over **Windows Classic Bluetooth RFCOMM** and a **React + TypeScript + Tailwind CSS v4** UI.

---

## Features

- **Direct Classic Bluetooth RFCOMM Transport (Rust Backend)**
  - Discovers paired Bluetooth devices via WinRT (`DeviceInformation` / `BluetoothDevice`) and opens native Winsock `AF_BTH` RFCOMM sockets with automatic SDP channel lookup.
  - Communicates directly over the Nothing / CMF RFCOMM control service (`AEAC4A03-DFF5-498F-843A-34487CF133EB`) and Fast Pair hardware ID service (`DF21FE2C-2515-4FDB-8886-F12C4D67927C`) using `0x55` binary framing and CRC-16/MODBUS checksums.
  - Recognizes CMF Buds 2a (`B185`) colourways (`70F8E3` Dark Grey, `ED5412` Light Grey, `509CAE` Orange).
- **Real-Time Earbud Controls**
  - **Battery Telemetry**: Left (`L`), Right (`R`), and Charging Case (`C`) battery percentages with charging status indicators.
  - **Noise Control**: Switch seamlessly between `Noise Cancellation`, `Transparency`, and `Off`.
  - **Ultra Bass**: Toggle on/off and adjust enhancement intensity across Levels `1`–`5` via inline quick-bars or the slider sheet.
  - **Equaliser**: `Dirac`, `Rock`, `Electronic`, `Pop`, `Enhance vocals`, `Classical`, plus `Custom` 3-band (`140 Hz` Bass, `980 Hz` Mid, `6900 Hz` Treble, `-6` to `+6 dB`) tuning with live acoustic response curve visualization.
  - **Touch Controls**: Remap `Double tap`, `Triple tap`, `Tap and hold`, and `Double tap and hold` independently for Left and Right earbuds, or reset to factory defaults.
  - **Low Lag Mode**: Toggle low-latency gaming audio mode.
  - **Dual Connection**: Toggle multi-point pairing and connect/disconnect listed host devices over RFCOMM.
  - **Find My Earbuds**: Ring Left or Right earbud individually to locate misplaced buds.
- **Desktop Windowing, Themes & Diagnostics**
  - **Adaptive 3-Tier Layout**: Adapts cleanly between compact mobile width (`< 768px`), medium 2-column desktop windows (`768px–1279px`), and full-screen bento layout (`1280px+`).
  - **Custom Titlebar & Resizing**: Borderless window supporting 8-direction edge/corner drag resizing, Minimize, Maximize/Restore, and double-click titlebar maximize.
  - **Light & Dark Mode**: Switch between Nothing obsidian Dark Mode and crisp Light Mode, persisted locally in `preferences.json`.
  - **Windows Tray & Single-Instance Guard**: Optional minimize-to-tray with quick ANC controls in the tray menu; re-launching brings the running tray/minimized window forward cleanly instead of spawning conflicting WebView2 instances.
  - **Protocol Frame Inspector & Demo Mode**: Inspect live `TX` / `RX` RFCOMM hex frames in **Device Settings**, or preview the full UI offline in **Demo Mode**.

---

## Prebuilt Windows Releases (`dist-release/`)

Ready-to-run x64 Windows binaries are included in [`dist-release/`](./dist-release):

| File | Description |
| --- | --- |
| `Nothing X_3.10.3_x64-setup.exe` | **Recommended** Windows installer (adds Start Menu shortcut and uninstaller) |
| `Nothing X.exe` | Portable executable (must stay in the same folder as `WebView2Loader.dll`) |

### Requirements & Tips

1. **Windows 10 / 11 (x64)** with Microsoft Edge WebView2 Runtime (preinstalled on Windows 11).
2. Pair your **CMF Buds 2a** in **Windows Settings → Bluetooth & devices** and take the earbuds out of the case so audio/RFCOMM is awake.
3. Only one Nothing X client can hold the earbud RFCOMM control socket at a time — close the Nothing X mobile app if connection reports busy.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Zustand, Tailwind CSS v4, Vite 6
- **Backend / Shell**: Rust (`tokio`, `serde`, `windows` v0.62 WinRT + Win32 Winsock), Tauri 2.0 (`tray-icon`)

---

## Project Structure

```text
├── src/                        # React + TypeScript UI
│   ├── App.tsx                 # Theme sync, initialization & 3-tier responsive shell
│   ├── components/
│   │   ├── device/             # DeviceHero, AncCard, FeatureGrid, AddDeviceModal, ToggleSwitch
│   │   ├── layout/             # TitleBar, Header, SubPageLayout, WindowResizeHandles
│   │   └── pages/              # Equaliser, Controls, DualConnection, DeviceSettings, About, UltraBassSheet
│   ├── lib/                    # Tauri IPC bridge, TypeScript types & B185 gesture/EQ definitions
│   └── store/                  # Zustand state store (live RFCOMM events + Demo Mode)
├── src-tauri/                  # Rust + Tauri v2 backend
│   ├── src/
│   │   ├── bluetooth/
│   │   │   ├── protocol.rs     # 0x55 packet builder, parser & CRC-16/MODBUS codec + unit tests
│   │   │   ├── windows.rs      # WinRT Bluetooth discovery & Winsock AF_BTH RFCOMM transport
│   │   │   └── mod.rs          # Session manager, initial sync & poll/keepalive loop
│   │   ├── commands.rs         # Tauri IPC commands exposed to frontend
│   │   ├── state.rs            # Thread-safe state & preferences.json persistence
│   │   └── lib.rs              # System tray, window lifecycle & Win32 single-instance guard
│   ├── capabilities/           # Tauri v2 window capability permissions
│   ├── build.rs                # GNU MinGW manifest spec helper + tauri_build
│   └── tauri.conf.json         # App configuration & NSIS/MSI bundler setup
└── dist-release/               # Prebuilt Windows portable .exe & NSIS setup installer
```

---

## Development & Building from Source

### Prerequisites

- **Node.js** 18+ and **npm**
- **Rust toolchain** (`rustup`)
  - With MSVC (`x86_64-pc-windows-msvc` + Visual Studio C++ Build Tools), or
  - With GNU MinGW-w64 (`stable-x86_64-pc-windows-gnu` + MinGW-w64 GCC/binutils on `PATH`)

### Setup & Run

```powershell
# 1. Install frontend dependencies
npm install

# 2. Typecheck frontend & Vite config and build dist/
npm run build

# 3. Run desktop app in development mode
npx tauri dev

# 4. Build release .exe and NSIS installer
npx tauri build --bundles nsis
```

> **Note for Windows GNU (`MinGW-w64`) builds:** If your Windows `%USERPROFILE%` path contains spaces, GNU `windres` can fail when `target/` resides under the repo path. Set `$env:CARGO_TARGET_DIR = "C:\NothingXTarget"` before running `npx tauri build`. `src-tauri/build.rs` automatically supplies `-specs=.../no-manifest.specs` for GNU binary targets so Tauri's Common Controls v6 manifest is preserved.

### Running Rust Protocol Tests

```powershell
cargo test --manifest-path src-tauri/Cargo.toml --lib
```

*(Protocol unit tests in `src-tauri/src/bluetooth/protocol.rs` verify CRC-16/MODBUS framing, split/merged stream parsing, Equaliser round-trips, dual-connection list decoding, and serial decoding without requiring live Bluetooth hardware.)*

---

## Troubleshooting

- **`Cannot find name 'process'` in `vite.config.ts`**: Ensure dev dependencies are installed (`npm install` installs `@types/node`), which [`tsconfig.node.json`](./tsconfig.node.json) references via `"types": ["node"]`.
- **Connection timed out or busy**: Place earbuds out of the case, disconnect Nothing X on nearby phones, and click **Refresh** in the **Devices** dialog inside the app.

---

## Disclaimer

This is an unofficial, independent desktop companion built for personal interoperability with **CMF Buds 2a**. OTA firmware updates are intentionally omitted and remain exclusive to the official Nothing X mobile app.

