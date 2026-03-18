@echo off
chcp 65001 >nul
echo ========================================
echo   视频智能截帧工具 - 停止服务
echo ========================================
echo.

taskkill /FI "WINDOWTITLE eq 视频截帧工具-后端服务*" /F >nul 2>&1

echo [✓] 服务已停止
echo.
pause
