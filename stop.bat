@echo off
setlocal
chcp 65001 >nul

echo ========================================
echo   VideoFrameCutter Stop
echo ========================================
echo.

taskkill /FI "WINDOWTITLE eq VideoFrameCutter-Backend*" /F >nul 2>&1
if errorlevel 1 (
    echo [INFO] No matching backend window was found.
) else (
    echo [OK] Backend service stopped.
)

echo.
if not "%NO_PAUSE%"=="1" pause
