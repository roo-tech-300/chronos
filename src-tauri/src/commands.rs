use serde::{Deserialize, Serialize};
use crate::biometrics::{
    generate_biometric_hash, query_scanner_status, BiometricScanResult, ScannerDeviceInfo,
};

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    pub os: String,
    pub hostname: String,
    pub app_version: String,
    pub is_windows: bool,
}

#[tauri::command]
pub fn get_system_info() -> SystemInfo {
    SystemInfo {
        os: std::env::consts::OS.to_string(),
        hostname: "CHRONOS-STATION-PC".to_string(),
        app_version: env!("CARGO_PKG_VERSION").to_string(),
        is_windows: cfg!(target_os = "windows"),
    }
}

#[tauri::command]
pub fn check_scanner_status() -> ScannerDeviceInfo {
    query_scanner_status()
}

#[tauri::command]
pub fn scan_biometric_device(seed: Option<String>) -> BiometricScanResult {
    let input_seed = seed.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    generate_biometric_hash(&input_seed)
}

#[tauri::command]
pub fn read_hardware_uuid() -> String {
    "HW-WIN-2024-CHRONOS-FS80H".to_string()
}
