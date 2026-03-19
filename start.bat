@echo off
chcp 65001 >nul
echo ========================================
echo   视频智能截帧工具 - 启动服务
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] 检查Node.js环境...
node -v >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到Node.js，请先运行 install-env.bat 安装环境
    pause
    exit /b 1
)
echo [✓] Node.js 已安装

echo.
echo [2/3] 配置FFmpeg环境...
if exist "installers\ffmpeg\bin\ffmpeg.exe" (
    set "PATH=%~dp0installers\ffmpeg\bin;%PATH%"
    echo [✓] FFmpeg 已配置
) else (
    echo [错误] 未找到FFmpeg文件，请确保 installers\ffmpeg\bin\ffmpeg.exe 存在
    pause
    exit /b 1
)

echo.
echo [3/3] 启动服务...
cd backend
start "视频截帧工具-后端服务" cmd /k "node src/server.js"

echo.
echo ========================================
echo   服务启动成功！
echo ========================================
echo.
echo   访问地址: http://localhost:3500
echo   或访问: http://本机IP:3500
echo.
echo   按任意键打开浏览器...
pause >nul
start http://localhost:3500
