@echo off
echo ==========================================
echo   PenPal Draw - Local Build Script
echo ==========================================
echo.

:: Check prerequisites
echo Checking prerequisites...

node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found!
    echo Please install from: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js found

rustc --version >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Rust not found!
    echo.
    echo Would you like to install Rust now? (Y/N)
    set /p installRust=
    if /i "%installRust%"=="Y" (
        echo Installing Rust...
        curl -L -o rustup-init.exe https://win.rustup.rs/x86_64
        rustup-init.exe -y
        del rustup-init.exe
        echo Rust installed! Please restart this script.
        pause
        exit /b 0
    ) else (
        echo Cannot build without Rust.
        pause
        exit /b 1
    )
)
echo [OK] Rust found

echo.
echo ==========================================
echo   Installing dependencies...
echo ==========================================
call npm install
if errorlevel 1 (
    echo [ERROR] npm install failed
    pause
    exit /b 1
)

echo.
echo ==========================================
echo   Building PenPal Draw...
echo ==========================================
echo This will take a few minutes...
echo.

call npm run tauri build

if errorlevel 1 (
    echo.
    echo [ERROR] Build failed!
    echo.
    echo Common issues:
    echo 1. Missing Visual Studio Build Tools
    echo    Download: https://visualstudio.microsoft.com/visual-cpp-build-tools/
    echo    Select: "Desktop development with C++"
    echo.
    echo 2. Out of memory - Close other applications
    echo.
    pause
    exit /b 1
)

echo.
echo ==========================================
echo   Build Complete! 🎉
echo ==========================================
echo.
echo Your binary is located at:
echo   src-tauri\target\release\penpal-draw.exe
echo.
echo Or find the installer at:
echo   src-tauri\target\release\bundle\msi\
echo   src-tauri\target\release\bundle\nsis\
echo.
pause
