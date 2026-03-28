@echo off
echo ==========================================
echo   PenPal Draw - Setup and Build Script
echo ==========================================
echo.

REM Check for Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)

REM Check for Rust
rustc --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Rust is not installed!
    echo Please install Rust from https://rustup.rs/
    exit /b 1
)

echo [1/3] Installing Node dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install Node dependencies
    exit /b 1
)

echo.
echo [2/3] Installing Rust dependencies...
cd src-tauri
call cargo fetch
if errorlevel 1 (
    echo ERROR: Failed to install Rust dependencies
    exit /b 1
)
cd ..

echo.
echo [3/3] Building application...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed
    exit /b 1
)

echo.
echo ==========================================
echo   Build Complete!
echo ==========================================
echo.
echo The application is located at:
echo   src-tauri\target\release\penpal-draw.exe
echo.
echo Or find the installer at:
echo   src-tauri\target\release\bundle\
echo.
pause
