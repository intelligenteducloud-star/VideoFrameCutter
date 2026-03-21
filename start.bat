@echo off
setlocal
chcp 65001 >nul

cd /d "%~dp0"
if not exist "logs" mkdir "logs"
set "START_LOG=%~dp0logs\startup.log"
echo [%date% %time%] Starting VideoFrameCutter...>"%START_LOG%"

echo ========================================
echo   VideoFrameCutter Start
echo ========================================
echo.

echo [1/4] Check Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js was not found. Run install-env.bat first.
    >>"%START_LOG%" echo [ERROR] Node.js was not found.
    if not "%NO_PAUSE%"=="1" pause
    exit /b 1
)
for /f "delims=" %%V in ('node -v') do >>"%START_LOG%" echo [INFO] Node version: %%V

echo [2/4] Check backend files...
if not exist "backend\src\server.js" (
    echo [ERROR] backend\src\server.js was not found.
    >>"%START_LOG%" echo [ERROR] backend\src\server.js was not found.
    if not "%NO_PAUSE%"=="1" pause
    exit /b 1
)

if not exist "frontend\dist\index.html" (
    echo [WARN] frontend\dist\index.html was not found.
    echo        The backend will still start, but the UI may be unavailable.
)

echo [3/4] Configure FFmpeg path...
set "FFMPEG_PATH="
set "FFPROBE_PATH="
if exist "installers\ffmpeg\bin\ffmpeg.exe" (
    set "FFMPEG_PATH=%CD%\installers\ffmpeg\bin\ffmpeg.exe"
    echo Using bundled ffmpeg: %FFMPEG_PATH%
    >>"%START_LOG%" echo [INFO] Using bundled ffmpeg: %FFMPEG_PATH%
)
if exist "installers\ffmpeg\bin\ffprobe.exe" (
    set "FFPROBE_PATH=%CD%\installers\ffmpeg\bin\ffprobe.exe"
    echo Using bundled ffprobe: %FFPROBE_PATH%
    >>"%START_LOG%" echo [INFO] Using bundled ffprobe: %FFPROBE_PATH%
)
if "%FFMPEG_PATH%"=="" (
    echo [WARN] Bundled ffmpeg.exe was not found. Falling back to PATH lookup.
    >>"%START_LOG%" echo [WARN] Bundled ffmpeg.exe was not found. Falling back to PATH lookup.
)
if "%FFPROBE_PATH%"=="" (
    echo [WARN] Bundled ffprobe.exe was not found. Falling back to PATH lookup.
    >>"%START_LOG%" echo [WARN] Bundled ffprobe.exe was not found. Falling back to PATH lookup.
)

echo [4/4] Start backend service...
>>"%START_LOG%" echo [INFO] Launching backend service...
cd backend
start "VideoFrameCutter-Backend" cmd /k "set FFMPEG_PATH=%FFMPEG_PATH%&& set FFPROBE_PATH=%FFPROBE_PATH%&& node src/server.js"

echo.
echo Service started.
echo Open: http://localhost:3500
echo Startup log: %START_LOG%
echo.
>>"%START_LOG%" echo [INFO] Startup command dispatched.
if not "%NO_PAUSE%"=="1" pause >nul
if not "%NO_PAUSE%"=="1" start http://localhost:3500
