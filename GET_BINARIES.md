# Get PenPal Draw Binaries

There are 3 ways to get the binaries:

---

## 🚀 Option 1: Download Pre-Built (Recommended - Easiest!)

The GitHub Actions CI automatically builds binaries for every release.

### Step 1: Check if build is ready
Go to: https://github.com/cms000123456/penpal/releases

Look for **v0.2.0** (or latest). If you see files like:
- `PenPal Draw_0.2.0_x64-setup.exe` (Windows)
- `PenPal Draw_0.2.0_x64.dmg` (macOS)
- `penpal-draw_0.2.0_amd64.deb` (Linux)

The build is ready! Download for your platform.

### Step 2: Or use the downloader script
```powershell
# In the project folder
python download-latest-release.py
```

This will show available downloads and let you choose which to download.

---

## 🔨 Option 2: Build Locally (If you have Rust installed)

### Quick Build (Windows)
```batch
# Double-click this file
build-local.bat
```

### Manual Build
```bash
# Install dependencies
npm install

# Build for current platform
npm run build

# Or specific platform:
npm run build:win      # Windows
npm run build:mac      # macOS Intel
npm run build:mac-arm  # macOS Apple Silicon
npm run build:linux    # Linux
```

**Output locations:**
- Executable: `src-tauri/target/release/penpal-draw.exe`
- Installers: `src-tauri/target/release/bundle/`

### Prerequisites for Local Build

| Platform | Requirements |
|----------|-------------|
| **Windows** | [Node.js](https://nodejs.org/), [Rust](https://rustup.rs/), [VS Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) |
| **macOS** | [Node.js](https://nodejs.org/), [Rust](https://rustup.rs/), Xcode Command Line Tools |
| **Linux** | [Node.js](https://nodejs.org/), [Rust](https://rustup.rs/), `libgtk-3-dev`, `libwebkit2gtk-4.0-dev` |

---

## ⏳ Option 3: Wait for GitHub Actions

Check build status: https://github.com/cms000123456/penpal/actions

The release workflow runs automatically when you push a tag like `v0.2.0`.

Build times:
- Windows: ~5-8 minutes
- macOS: ~10-15 minutes  
- Linux: ~5-8 minutes

Once complete, binaries appear in the [Releases](https://github.com/cms000123456/penpal/releases) page.

---

## 📋 Installation Instructions

### Windows
1. Download `.msi` or `.exe` installer
2. Run the installer
3. Launch from Start Menu

### macOS
1. Download `.dmg` for your Mac type (Intel or Apple Silicon)
2. Open DMG and drag to Applications
3. If "app can't be opened" → System Preferences → Security → Open Anyway

### Linux
**Option A - .deb (Debian/Ubuntu):**
```bash
sudo dpkg -i penpal-draw_0.2.0_amd64.deb
```

**Option B - AppImage:**
```bash
chmod +x PenPal\ Draw_0.2.0_amd64.AppImage
./PenPal\ Draw_0.2.0_amd64.AppImage
```

---

## 🌐 Web Version (No Install!)

Test in browser without installing:

1. Download `penpal-draw-web.zip` from releases
2. Extract and open `index.html` in Chrome/Edge/Firefox
3. Most features work (except moving to specific display)

Or run locally:
```bash
python run-web.bat
# Then open http://localhost:8080
```

---

## ❓ Troubleshooting

### "Build fails with link.exe not found"
Install Visual Studio Build Tools:
https://visualstudio.microsoft.com/visual-cpp-build-tools/

### "Rust not found"
Install Rust: https://rustup.rs/

### "Permission denied on macOS"
Right-click app → Open, or go to System Preferences → Security.

### "Linux AppImage won't run"
Make it executable: `chmod +x *.AppImage`

---

## 🔄 Automatic Updates

PenPal Draw currently doesn't have auto-update. To update:
1. Download latest release
2. Install over existing version (settings are preserved)

Watch the repo (GitHub button) to get notified of new releases!
