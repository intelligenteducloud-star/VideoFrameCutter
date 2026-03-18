@echo off
chcp 65001 >nul
echo ========================================
echo   视频智能截帧工具 - 环境安装
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] 检查Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    echo [!] 未检测到Node.js
    echo [提示] 请手动安装 installers\node-v18.20.5-x64.msi
    echo [提示] 安装完成后重新运行此脚本
    pause
    exit /b 1
) else (
    echo [✓] Node.js 已安装
)

echo.
echo [2/4] 检查FFmpeg...
ffmpeg -version >nul 2>&1
if errorlevel 1 (
    echo [!] 未检测到FFmpeg
    echo [提示] 正在配置FFmpeg...

    if exist "installers\ffmpeg\bin\ffmpeg.exe" (
        set "FFMPEG_PATH=%~dp0installers\ffmpeg\bin"
        setx PATH "%PATH%;%FFMPEG_PATH%" >nul
        echo [✓] FFmpeg 已配置到系统PATH
        echo [提示] 请关闭此窗口，重新打开命令行后再运行此脚本
        pause
        exit /b 0
    ) else (
        echo [错误] 未找到FFmpeg文件
        echo [提示] 请确保 installers\ffmpeg\bin\ffmpeg.exe 存在
        pause
        exit /b 1
    )
) else (
    echo [✓] FFmpeg 已安装
)

echo.
echo [3/4] 安装后端依赖...
cd backend
call npm install
if errorlevel 1 (
    echo [错误] 依赖安装失败
    pause
    exit /b 1
)
echo [✓] 后端依赖安装完成

cd ..
echo.
echo [4/4] 创建必要目录...
if not exist "backend\uploads" mkdir "backend\uploads"
if not exist "backend\frames" mkdir "backend\frames"
if not exist "backend\watermarks" mkdir "backend\watermarks"
if not exist "backend\logos" mkdir "backend\logos"
if not exist "logs" mkdir "logs"
echo [✓] 目录创建完成

echo.
echo ========================================
echo   环境安装完成！
echo ========================================
echo.
echo   下一步: 运行 start.bat 启动服务
echo.
pause
