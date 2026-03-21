@echo off
setlocal
chcp 65001 >nul

cd /d "%~dp0"

set "RELEASE_DIR=VideoFrameCutter-Release"
set "RELEASE_BACKEND=%RELEASE_DIR%\backend"
set "RELEASE_FRONTEND=%RELEASE_DIR%\frontend"
set "RELEASE_INSTALLERS=%RELEASE_DIR%\installers"
set "RELEASE_LOGS=%RELEASE_DIR%\logs"

echo ========================================
echo   VideoFrameCutter Release Builder
echo ========================================
echo.

echo [1/7] Prepare release folders...
if not exist "%RELEASE_DIR%" mkdir "%RELEASE_DIR%"
if not exist "%RELEASE_BACKEND%" mkdir "%RELEASE_BACKEND%"
if not exist "%RELEASE_FRONTEND%" mkdir "%RELEASE_FRONTEND%"
if not exist "%RELEASE_INSTALLERS%" mkdir "%RELEASE_INSTALLERS%"
if not exist "%RELEASE_LOGS%" mkdir "%RELEASE_LOGS%"

if exist "%RELEASE_BACKEND%\src" rd /s /q "%RELEASE_BACKEND%\src"
if exist "%RELEASE_FRONTEND%\dist" rd /s /q "%RELEASE_FRONTEND%\dist"
if exist "%RELEASE_BACKEND%\test" rd /s /q "%RELEASE_BACKEND%\test"

mkdir "%RELEASE_BACKEND%\src" >nul 2>&1
mkdir "%RELEASE_FRONTEND%\dist" >nul 2>&1

echo [2/7] Copy backend source...
xcopy /E /I /Y /Q "backend\src\*" "%RELEASE_BACKEND%\src\" >nul
if errorlevel 1 (
    echo [ERROR] Failed to copy backend source.
    if not "%NO_PAUSE%"=="1" pause
    exit /b 1
)

if exist "backend\package.json" copy /Y "backend\package.json" "%RELEASE_BACKEND%\" >nul
if exist "backend\package-lock.json" copy /Y "backend\package-lock.json" "%RELEASE_BACKEND%\" >nul
if exist "backend\.env" copy /Y "backend\.env" "%RELEASE_BACKEND%\" >nul

echo [3/7] Copy frontend build output...
if exist "frontend\dist\index.html" (
    xcopy /E /I /Y /Q "frontend\dist\*" "%RELEASE_FRONTEND%\dist\" >nul
    if errorlevel 1 (
        echo [ERROR] Failed to copy frontend build output.
        if not "%NO_PAUSE%"=="1" pause
        exit /b 1
    )
) else (
    echo [WARN] frontend\dist\index.html not found. Run "npm.cmd run build" in frontend first.
)

echo [4/7] Copy runtime scripts and docs...
for %%F in ("start.bat" "stop.bat" "install-env.bat" "README.md" "DEPLOY.md" "ecosystem.config.cjs") do (
    if exist "%%~F" copy /Y "%%~F" "%RELEASE_DIR%\" >nul
)
for %%F in (README-*.txt) do (
    if exist "%%~F" copy /Y "%%~F" "%RELEASE_DIR%\" >nul
)

echo [5/7] Copy installer assets...
echo        Existing installer assets in the release folder will be kept.
if exist "installers\*" (
    xcopy /E /I /Y /Q "installers\*" "%RELEASE_INSTALLERS%\" >nul
)
if exist "ffmpeg\bin\ffmpeg.exe" if exist "ffmpeg\bin\ffprobe.exe" (
    if exist "%RELEASE_INSTALLERS%\ffmpeg" rd /s /q "%RELEASE_INSTALLERS%\ffmpeg"
    xcopy /E /I /Y /Q "ffmpeg\*" "%RELEASE_INSTALLERS%\ffmpeg\" >nul
) else (
    if exist "ffmpeg\*" (
        echo [WARN] Source ffmpeg folder exists but is incomplete.
        echo        Skipping overwrite to avoid deleting a valid bundled FFmpeg package.
    )
)

if not exist "%RELEASE_INSTALLERS%\ffmpeg\bin\ffmpeg.exe" (
    echo [WARN] Bundled ffmpeg.exe is missing in the release package.
)
if not exist "%RELEASE_INSTALLERS%\ffmpeg\bin\ffprobe.exe" (
    echo [WARN] Bundled ffprobe.exe is missing in the release package.
)

echo [6/7] Ensure runtime folders exist...
mkdir "%RELEASE_BACKEND%\uploads" >nul 2>&1
mkdir "%RELEASE_BACKEND%\frames" >nul 2>&1
mkdir "%RELEASE_BACKEND%\watermarks" >nul 2>&1
mkdir "%RELEASE_BACKEND%\logos" >nul 2>&1

echo [7/8] Normalize batch file line endings...
powershell -ExecutionPolicy Bypass -Command "$files = Get-ChildItem -Path '%RELEASE_DIR%' -Filter '*.bat' -Recurse; foreach ($file in $files) { $content = [System.IO.File]::ReadAllText($file.FullName); $content = $content -replace \"`r`n\", \"`n\"; $content = $content -replace \"`n\", \"`r`n\"; [System.IO.File]::WriteAllText($file.FullName, $content) }" >nul

echo [8/8] Normalize document encoding...
powershell -ExecutionPolicy Bypass -Command "$files = Get-ChildItem -Path '%RELEASE_DIR%' -Include '*.md','*.txt' -File; $enc = New-Object System.Text.UTF8Encoding($true); foreach ($file in $files) { $content = Get-Content -Raw -Encoding UTF8 $file.FullName; [System.IO.File]::WriteAllText($file.FullName, $content, $enc) }" >nul

echo.
echo Release package is ready:
echo %CD%\%RELEASE_DIR%\
echo Installer assets are kept in:
echo %CD%\%RELEASE_INSTALLERS%\
echo.
if not "%NO_PAUSE%"=="1" pause
exit /b 0
