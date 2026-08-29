pub mod biometrics;
pub mod commands;

use commands::{check_scanner_status, get_system_info, read_hardware_uuid, scan_biometric_device};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_system_info,
            check_scanner_status,
            scan_biometric_device,
            read_hardware_uuid
        ])
        .run(tauri::generate_context!())
        .expect("error while running Chronos Terminal desktop application");
}
