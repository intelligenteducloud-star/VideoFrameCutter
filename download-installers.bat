@echo off
chcp 65001 >nul
echo ========================================
echo   下载安装包
echo ========================================
echo.

cd /d "%~dp0"

if not exist "installers" mkdir installers

echo 请手动下载以下文件：
echo.
echo [1] Node.js v18.20.5 (Windows x64)
echo     下载地址: https://nodejs.org/dist/v18.20.5/node-v18.20.5-x64.msi
echo     保存到: installers\node-v18.20.5-x64.msi
echo.
echo [2] FFmpeg (Windows版本)
echo     下载地址: https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip
echo     解压后将文件夹重命名为 ffmpeg
echo     保存到: installers\ffmpeg\
echo.
echo 下载完成后，运行 install-env.bat 安装环境
echo.
pause
