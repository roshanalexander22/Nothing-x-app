//! Application state and local user preferences persistence.

use std::collections::VecDeque;
use std::path::PathBuf;
use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;

use crate::bluetooth::ActiveSession;
use crate::bluetooth::protocol::{DeviceStateSnapshot, ProtocolLogEntry};

fn default_theme() -> String {
    "dark".to_string()
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppPreferences {
    pub custom_name: Option<String>,
    pub last_address: Option<String>,
    pub auto_connect: bool,
    pub minimize_to_tray: bool,
    pub improvement_programme: bool,
    #[serde(default = "default_theme")]
    pub theme: String,
}

impl Default for AppPreferences {
    fn default() -> Self {
        Self {
            custom_name: None,
            last_address: None,
            auto_connect: true,
            minimize_to_tray: true,
            improvement_programme: false,
            theme: default_theme(),
        }
    }
}

pub struct AppState {
    pub snapshot: Arc<Mutex<DeviceStateSnapshot>>,
    pub logs: Arc<Mutex<VecDeque<ProtocolLogEntry>>>,
    pub session: Mutex<Option<ActiveSession>>,
    pub prefs: Mutex<AppPreferences>,
    pub prefs_path: PathBuf,
}

impl AppState {
    pub fn new(prefs_path: PathBuf) -> Self {
        let loaded = load_prefs(&prefs_path).unwrap_or_default();
        let mut initial_snapshot = DeviceStateSnapshot::default();
        initial_snapshot.custom_name = loaded.custom_name.clone();

        Self {
            snapshot: Arc::new(Mutex::new(initial_snapshot)),
            logs: Arc::new(Mutex::new(VecDeque::with_capacity(128))),
            session: Mutex::new(None),
            prefs: Mutex::new(loaded),
            prefs_path,
        }
    }

    pub async fn save_prefs(&self) -> Result<(), String> {
        let prefs = self.prefs.lock().await.clone();
        if let Some(parent) = self.prefs_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        let json = serde_json::to_string_pretty(&prefs).map_err(|e| e.to_string())?;
        std::fs::write(&self.prefs_path, json).map_err(|e| e.to_string())
    }
}

fn load_prefs(path: &PathBuf) -> Option<AppPreferences> {
    let raw = std::fs::read_to_string(path).ok()?;
    serde_json::from_str(&raw).ok()
}

