========================================
  视频智能截帧工具 - 部署说明
========================================

【快速部署步骤】

1. 准备安装包
   将以下文件放入 installers 目录：

   ├── installers/
   │   ├── node-v18.20.5-x64.msi          (Node.js安装包)
   │   └── ffmpeg/                         (FFmpeg文件夹)
   │       └── bin/
   │           ├── ffmpeg.exe
   │           ├── ffplay.exe
   │           └── ffprobe.exe

2. 安装环境
   双击运行: install-env.bat

   - 如果提示安装Node.js，请先安装 installers\node-v18.20.5-x64.msi
   - 安装完成后重新运行 install-env.bat

3. 启动服务
   双击运行: start.bat

   浏览器会自动打开 http://localhost:3500

4. 停止服务
   双击运行: stop.bat


【软件下载地址】

Node.js (v18.20.5 LTS):
https://nodejs.org/dist/v18.20.5/node-v18.20.5-x64.msi

FFmpeg (Windows版本):
https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip
下载后解压，将 ffmpeg-xxx 文件夹重命名为 ffmpeg


【目录结构】

VideoFrameCutter/
├── installers/              # 安装包目录
│   ├── node-v18.20.5-x64.msi
│   └── ffmpeg/
│       └── bin/
├── backend/                 # 后端代码
├── frontend/                # 前端代码
├── install-env.bat          # 安装环境脚本
├── start.bat                # 启动服务脚本
├── stop.bat                 # 停止服务脚本
└── README-部署说明.txt      # 本文件


【访问地址】

本机访问: http://localhost:3500
局域网访问: http://本机IP:3500

查看本机IP: 在命令行输入 ipconfig


【防火墙设置】

如需局域网其他设备访问，请开放3500端口：
控制面板 → Windows防火墙 → 高级设置 → 入站规则 → 新建规则
选择端口 → TCP → 特定本地端口 3500 → 允许连接


【常见问题】

Q: 提示"端口被占用"？
A: 运行 stop.bat 停止服务，或重启电脑

Q: 无法访问？
A: 检查防火墙设置，确保3500端口已开放

Q: 上传视频失败？
A: 检查视频大小是否超过300M，检查磁盘空间是否充足

Q: FFmpeg错误？
A: 确保 installers\ffmpeg\bin\ffmpeg.exe 存在且可执行


【技术支持】

项目地址: https://github.com/intelligenteducloud-star/VideoFrameCutter
