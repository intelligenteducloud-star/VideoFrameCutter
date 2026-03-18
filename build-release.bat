@echo off
chcp 65001 >nul
echo ========================================
echo   生成部署包
echo ========================================
echo.

cd /d "%~dp0"

set RELEASE_DIR=VideoFrameCutter-Release
set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

echo [1/6] 清理旧的发布目录...
if exist "%RELEASE_DIR%" rd /s /q "%RELEASE_DIR%"
mkdir "%RELEASE_DIR%"

echo [2/6] 复制后端文件...
mkdir "%RELEASE_DIR%\backend"
xcopy /E /I /Q "backend\src" "%RELEASE_DIR%\backend\src\"
copy "backend\package.json" "%RELEASE_DIR%\backend\" >nul
copy "backend\.env" "%RELEASE_DIR%\backend\" >nul

echo [3/6] 复制前端构建文件...
mkdir "%RELEASE_DIR%\frontend"
xcopy /E /I /Q "frontend\dist" "%RELEASE_DIR%\frontend\dist\"

echo [4/6] 复制部署脚本...
copy "start.bat" "%RELEASE_DIR%\" >nul
copy "stop.bat" "%RELEASE_DIR%\" >nul
copy "install-env.bat" "%RELEASE_DIR%\" >nul
copy "download-installers.bat" "%RELEASE_DIR%\" >nul
copy "README-部署说明.txt" "%RELEASE_DIR%\" >nul

echo [5/6] 创建必要目录...
mkdir "%RELEASE_DIR%\installers"
copy "installers\放置安装包说明.txt" "%RELEASE_DIR%\installers\" >nul
mkdir "%RELEASE_DIR%\logs"

echo [6/6] 打包压缩...
if exist "%ProgramFiles%\7-Zip\7z.exe" (
    "%ProgramFiles%\7-Zip\7z.exe" a -tzip "VideoFrameCutter-Release-%TIMESTAMP%.zip" "%RELEASE_DIR%\" >nul
    echo [✓] 已生成压缩包: VideoFrameCutter-Release-%TIMESTAMP%.zip
) else (
    echo [!] 未安装7-Zip，跳过压缩步骤
)

echo.
echo ========================================
echo   部署包生成完成！
echo ========================================
echo.
echo   发布目录: %RELEASE_DIR%\
echo.
echo   将此文件夹复制到服务器即可部署
echo.
pause
