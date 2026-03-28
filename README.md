# PenPal Draw

A lightweight, cross-platform drawing app designed for the **XPPen Artist 15.6 Pro V2 Pen Display** and other pen tablets.

## Features

- 🎨 **Pressure Sensitivity** - Full support for pen pressure (requires compatible pen tablet)
- 🖥️ **Multi-Monitor Support** - Easily move the app to your pen display
- ⬜ **Fullscreen Mode** - Draw without distractions
- 🖌️ **Customizable Brushes** - Adjust size, color, and opacity
- ↩️ **Undo/Redo** - Ctrl+Z / Ctrl+Y to undo/redo strokes
- 💾 **Save as PNG** - Export your artwork
- ⌨️ **Shortcut Keys** - Full support for XPPen's 8 shortcut keys with customizable actions
- 🧹 **Eraser Mode** - Toggle with 'E' key or shortcut key
- 🎨 **Color Picker** - Pick colors from canvas
- ⌨️ **Keyboard Shortcuts** - Quick access to common actions

## Requirements

- Windows 10/11, macOS, or Linux
- XPPen Artist 15.6 Pro V2 (or any pen tablet with pressure support)
- XPPen drivers installed

## Installation

### Download Pre-built Binary

Check the [Releases](../../releases) page for pre-built binaries.

### Build from Source

#### Prerequisites

1. **Install Rust**: https://rustup.rs/
2. **Install Node.js**: https://nodejs.org/ (v18 or higher)

#### Build Steps

```bash
# Clone or navigate to the project
cd penpal-draw

# Install dependencies
npm install

# Generate icons (optional, already included)
python generate_icons.py

# Build for production
npm run build

# Or run in development mode
npm run dev
```

The built app will be in `src-tauri/target/release/bundle/`.

## Usage

### First Time Setup

1. **Connect your XPPen Artist 15.6 Pro V2**
2. **Install XPPen drivers** from https://www.xp-pen.com/download
3. **Launch PenPal Draw**
4. **Select your pen display** from the "Display" dropdown
5. **Click "Move"** to move the window to your pen display
6. **Click "Fullscreen"** for the best drawing experience

### Drawing

- **Draw**: Use your pen on the canvas
- **Pressure**: Press harder for thicker lines (toggle with checkbox)
- **Brush Size**: Adjust with the slider (1-100)
- **Color**: Pick from the color selector
- **Opacity**: Adjust transparency (1-100%)

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Z` | Undo last stroke |
| `Ctrl + Y` or `Ctrl + Shift + Z` | Redo last stroke |
| `Ctrl + S` | Save image |
| `E` | Toggle eraser mode |
| `[` / `]` | Decrease / Increase brush size |

### Shortcut Keys (XPPen Tablet)

Click the **⌨️ Keys** button in the toolbar to configure your XPPen Artist 15.6 Pro V2's 8 shortcut keys.

**Available Actions:**
- Brush sizes (Small/Medium/Large)
- Colors (Black/White/Red/Pick from canvas)
- Undo / Redo
- Clear canvas
- Save
- Toggle eraser
- Toggle fullscreen

**Setup:**
1. Click **⌨️ Keys** in the toolbar
2. Click **"Auto-Detect XPPen Keys"**
3. Press each shortcut key (K1-K8) on your tablet in order
4. Or manually select an action for each key and click "Click to bind", then press the desired key

**Recommended XPPen Configuration:**
In your XPPen tablet software, set the shortcut keys to send:
| Key | Binding | Suggested Action |
|-----|---------|------------------|
| K1 | `Ctrl+F1` | Brush: Medium |
| K2 | `Ctrl+F2` | Brush: Large |
| K3 | `Ctrl+F3` | Color: Black |
| K4 | `Ctrl+F4` | Color: White |
| K5 | `Ctrl+F5` | Undo |
| K6 | `Ctrl+F6` | Toggle Eraser |
| K7 | `Ctrl+F7` | Clear Canvas |
| K8 | `Ctrl+F8` | Save |

### Pressure Indicator

The pressure indicator in the toolbar shows your current pen pressure:
- **Gray** - No pressure
- **Yellow** - Light pressure (< 30%)
- **Green** - Medium pressure (30-70%)
- **Red** - Heavy pressure (> 70%)

## Troubleshooting

### Pressure Sensitivity Not Working

1. Make sure XPPen drivers are installed and running
2. Check that "Pressure" checkbox is enabled in the toolbar
3. Restart the app after installing drivers
4. In XPPen drivers, ensure "Windows Ink" is enabled

### App Doesn't Move to Pen Display

1. Make sure your XPPen is connected and recognized by Windows
2. Try manually dragging the window to the pen display
3. Use the "Fullscreen" button once on the correct display

### Lag or Stuttering

1. Reduce brush size
2. Close other applications
3. Check CPU/GPU usage

## Development

### Project Structure

```
penpal-draw/
├── src/                    # Frontend (HTML/CSS/JS)
│   ├── index.html         # Main UI
│   ├── main.js            # Drawing logic
│   └── styles.css         # Styling
├── src-tauri/             # Backend (Rust)
│   ├── src/main.rs        # Rust code
│   ├── icons/             # App icons
│   └── Cargo.toml         # Rust dependencies
└── package.json           # Node dependencies
```

### Technologies

- **Tauri** - Rust-based framework for desktop apps
- **HTML5 Canvas** - Drawing surface
- **Pointer Events API** - Pen/mouse/touch input
- **Vanilla JavaScript** - No framework overhead

## License

MIT License - Feel free to use and modify!

## Support

If you encounter issues or have feature requests, please open an issue on GitHub.

---

**Enjoy drawing with your XPPen Artist 15.6 Pro V2!** 🎨
