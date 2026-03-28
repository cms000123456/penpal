// Prevents additional console window on Windows in release builds
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_monitors, move_window_to_monitor])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[derive(serde::Serialize)]
struct MonitorInfo {
    name: String,
    x: i32,
    y: i32,
    width: u32,
    height: u32,
    is_primary: bool,
}

#[tauri::command]
fn get_monitors(window: tauri::Window) -> Vec<MonitorInfo> {
    let mut monitors = Vec::new();
    
    if let Ok(available_monitors) = window.available_monitors() {
        for (idx, monitor) in available_monitors.iter().enumerate() {
            let position = monitor.position();
            let size = monitor.size();
            let is_primary = monitor.name()
                .map(|n| n.to_string().to_lowercase().contains("primary") || idx == 0)
                .unwrap_or(idx == 0);
            
            monitors.push(MonitorInfo {
                name: monitor.name().map(|n| n.to_string()).unwrap_or_else(|| format!("Monitor {}", idx + 1)),
                x: position.x,
                y: position.y,
                width: size.width,
                height: size.height,
                is_primary,
            });
        }
    }
    
    monitors
}

#[tauri::command]
async fn move_window_to_monitor(window: tauri::Window, x: i32, y: i32, width: u32, height: u32, fullscreen: bool) -> Result<(), String> {
    use tauri::Manager;
    
    if fullscreen {
        window.set_fullscreen(true).map_err(|e| e.to_string())?;
    } else {
        window.set_fullscreen(false).map_err(|e| e.to_string())?;
        window.set_size(tauri::Size::Physical(tauri::PhysicalSize { width, height })).map_err(|e| e.to_string())?;
        window.set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y })).map_err(|e| e.to_string())?;
    }
    
    Ok(())
}
