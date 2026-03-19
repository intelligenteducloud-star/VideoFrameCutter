@echo off
chcp 65001 >nul
echo ========================================
echo   生成/更新部署包
echo ========================================
echo.

cd /d "%~dp0"

set RELEASE_DIR=VideoFrameCutter-Release

echo [1/7] 智能清理（保留installers和node_modules）...
if exist "%RELEASE_DIR%\backend\src" rd /s /q "%RELEASE_DIR%\backend\src"
if exist "%RELEASE_DIR%\frontend\dist" rd /s /q "%RELEASE_DIR%\frontend\dist"
echo [✓] 已清理旧代码文件

echo [2/7] 创建目录结构...
if not exist "%RELEASE_DIR%\backend\src" mkdir "%RELEASE_DIR%\backend\src"
if not exist "%RELEASE_DIR%\frontend\dist" mkdir "%RELEASE_DIR%\frontend\dist"
if not exist "%RELEASE_DIR%\installers" mkdir "%RELEASE_DIR%\installers"
if not exist "%RELEASE_DIR%\logs" mkdir "%RELEASE_DIR%\logs"

echo [3/7] 复制后端文件...
xcopy /E /I /Y /Q "backend\src" "%RELEASE_DIR%\backend\src\" >nul
copy /Y "backend\package.json" "%RELEASE_DIR%\backend\" >nul
copy /Y "backend\.env" "%RELEASE_DIR%\backend\" >nul

echo [4/7] 复制前端构建文件...
if exist "frontend\dist" (
    xcopy /E /I /Y /Q "frontend\dist" "%RELEASE_DIR%\frontend\dist\" >nul
    echo [✓] 前端文件已复制
) else (
    echo [!] 警告: frontend\dist 不存在，请先运行 npm run build
)

echo [5/7] 复制部署脚本（仅当根目录存在时）...
if exist "start.bat" copy /Y "start.bat" "%RELEASE_DIR%\" >nul
if exist "stop.bat" copy /Y "stop.bat" "%RELEASE_DIR%\" >nul
if exist "install-env.bat" copy /Y "install-env.bat" "%RELEASE_DIR%\" >nul
if exist "download-installers.bat" copy /Y "download-installers.bat" "%RELEASE_DIR%\" >nul
if exist "README-部署说明.txt" copy /Y "README-部署说明.txt" "%RELEASE_DIR%\" >nul
echo [✓] 部署脚本已更新

echo [6/7] 复制安装包说明...
if exist "installers\下载说明.txt" (
    copy /Y "installers\下载说明.txt" "%RELEASE_DIR%\installers\" >nul
)
if exist "installers\放置安装包说明.txt" (
    copy /Y "installers\放置安装包说明.txt" "%RELEASE_DIR%\installers\" >nul
)

echo [7/8] 检查安装包（不覆盖已存在的）...
if exist "installers\node-v18.20.5-x64.msi" (
    if not exist "%RELEASE_DIR%\installers\node-v18.20.5-x64.msi" (
        copy /Y "installers\node-v18.20.5-x64.msi" "%RELEASE_DIR%\installers\" >nul
        echo [✓] Node.js 安装包已复制
    ) else (
        echo [✓] Node.js 安装包已存在，保持不变
    )
)
if exist "installers\ffmpeg" (
    if not exist "%RELEASE_DIR%\installers\ffmpeg" (
        xcopy /E /I /Y /Q "installers\ffmpeg" "%RELEASE_DIR%\installers\ffmpeg\" >nul
        echo [✓] FFmpeg 已复制
    ) else (
        echo [✓] FFmpeg 已存在，保持不变
    )
)

echo.
echo [8/8] 修复bat文件换行符格式...
powershell -ExecutionPolicy Bypass -Command "$files = Get-ChildItem -Path '%RELEASE_DIR%' -Filter '*.bat' -Recurse; foreach ($file in $files) { $content = [System.IO.File]::ReadAllText($file.FullName); $content = $content -replace \"`r`n\", \"`n\"; $content = $content -replace \"`n\", \"`r`n\"; [System.IO.File]::WriteAllText($file.FullName, $content) }" >nul
echo [✓] 换行符格式已修复

echo.
echo ========================================
echo   部署包更新完成！
echo ========================================
echo.
echo   部署包位置: %CD%\%RELEASE_DIR%\
echo.
echo   可以将此文件夹复制到服务器部署
echo.
pause
