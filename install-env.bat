@echo off
setlocal
chcp 65001 >nul

cd /d "%~dp0"

echo ========================================
echo   VideoFrameCutter Environment Setup
echo ========================================
echo.

echo [1/5] Check Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    if exist "installers\node-v18.20.5-x64.msi" (
        echo Node.js not found. Installing from installers\node-v18.20.5-x64.msi ...
        start /wait msiexec /i "%~dp0installers\node-v18.20.5-x64.msi" /qb
        echo Node.js installation completed.
        echo Re-open this script after your PATH is refreshed.
        if not "%NO_PAUSE%"=="1" pause
        exit /b 0
    ) else (
        echo [ERROR] Node.js not found and local installer is missing.
        echo         Put node-v18.20.5-x64.msi into installers\ and run again.
        if not "%NO_PAUSE%"=="1" pause
        exit /b 1
    )
)

echo [2/5] Check FFmpeg package...
if exist "installers\ffmpeg\bin\ffmpeg.exe" if exist "installers\ffmpeg\bin\ffprobe.exe" (
    echo FFmpeg package found in installers\ffmpeg\bin
) else (
    echo [WARN] Local FFmpeg package is incomplete or missing.
    echo        You can still run the app if ffmpeg and ffprobe are available in PATH.
    echo        Recommended: keep ffmpeg inside installers\ffmpeg\bin for portable deployment.
)

echo [3/6] Install backend dependencies...
cd backend
set "npm_config_cache=%~dp0backend\.npm-cache"
set "npm_config_logs_dir=%~dp0backend\_logs"
if not exist "%npm_config_cache%" mkdir "%npm_config_cache%"
if not exist "%npm_config_logs_dir%" mkdir "%npm_config_logs_dir%"
call npm.cmd install --include=optional --no-fund --no-audit
if errorlevel 1 (
    echo [ERROR] Backend dependency installation failed.
    if not "%NO_PAUSE%"=="1" pause
    exit /b 1
)

echo [4/6] Verify sharp runtime...
call node -e "import('sharp').then(() => console.log('sharp runtime OK')).catch((error) => { console.error(error); process.exit(1); })"
if errorlevel 1 (
    echo [WARN] sharp runtime verification failed. Attempting rebuild...
    call npm.cmd rebuild sharp
    if errorlevel 1 (
        echo [ERROR] sharp rebuild failed.
        if not "%NO_PAUSE%"=="1" pause
        exit /b 1
    )

    call node -e "import('sharp').then(() => console.log('sharp runtime OK after rebuild')).catch((error) => { console.error(error); process.exit(1); })"
    if errorlevel 1 (
        echo [ERROR] sharp is still unavailable after rebuild.
        echo         Delete backend\\node_modules and run install-env.bat again.
        if not "%NO_PAUSE%"=="1" pause
        exit /b 1
    )
)

cd ..
echo [5/6] Ensure runtime folders exist...
if not exist "backend\uploads" mkdir "backend\uploads"
if not exist "backend\frames" mkdir "backend\frames"
if not exist "backend\watermarks" mkdir "backend\watermarks"
if not exist "backend\logos" mkdir "backend\logos"
if not exist "logs" mkdir "logs"

echo [6/6] Check frontend build output...
if exist "frontend\dist\index.html" (
    echo Frontend build output found.
) else (
    echo [WARN] frontend\dist\index.html was not found.
    echo        Build it with: cd frontend ^&^& npm.cmd run build
)

echo.
echo Environment setup completed.
echo Node installer path: installers\node-v18.20.5-x64.msi
echo FFmpeg path: installers\ffmpeg\bin\ffmpeg.exe
echo Next step: run start.bat
echo.
if not "%NO_PAUSE%"=="1" pause
