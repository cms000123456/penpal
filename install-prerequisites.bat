@echo off
echo ==========================================
echo   Installing Prerequisites for PenPal Draw
echo ==========================================
echo.

echo [1/2] Installing Visual C++ Build Tools via rustup...
echo This may take a few minutes...
echo.

rustup target add x86_64-pc-windows-msvc

if errorlevel 1 (
    echo.
    echo ERROR: Failed to install target. Installing Visual Studio Build Tools...
    echo.
    
    :: Download and install Visual Studio Build Tools
    echo Downloading Visual Studio Build Tools installer...
    curl -L -o vs_buildtools.exe "https://aka.ms/vs/17/release/vs_buildtools.exe"
    
    if exist vs_buildtools.exe (
        echo Installing Build Tools with C++ workload...
        vs_buildtools.exe --quiet --wait --add Microsoft.VisualStudio.Workload.VCTools --add Microsoft.VisualStudio.Component.Windows10SDK
        del vs_buildtools.exe
        echo.
        echo Visual Studio Build Tools installed!
    ) else (
        echo.
        echo ERROR: Could not download Visual Studio Build Tools.
        echo.
        echo Please install manually from:
        echo https://visualstudio.microsoft.com/visual-cpp-build-tools/
        echo.
        echo Make sure to select: "Desktop development with C++"
        pause
        exit /b 1
    )
)

echo.
echo [2/2] Verifying Rust installation...
rustc --version
if errorlevel 1 (
    echo ERROR: Rust not found. Please install from https://rustup.rs/
    pause
    exit /b 1
)

echo.
echo ==========================================
echo   Prerequisites installed successfully!
echo ==========================================
echo.
echo You can now run setup.bat to build the app.
pause
