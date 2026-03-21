========================================
视频智能截帧工具 - 发布包使用说明
========================================

一、这份发布包里有什么

1. backend\
   后端源码、配置文件、运行目录

2. frontend\dist\
   已构建好的前端页面

3. installers\
   随包附带的运行环境资源
   - node-v18.20.5-x64.msi
   - ffmpeg\bin\ffmpeg.exe
   - ffmpeg\bin\ffprobe.exe

4. install-env.bat
   初始化环境、安装后端依赖

5. start.bat
   启动服务

6. stop.bat
   停止服务

二、拷贝到别的电脑后怎么用

推荐做法：
把整个 VideoFrameCutter-Release 文件夹完整复制到目标电脑，再操作。

不要只复制 backend 或 frontend。
不要改变 installers 目录结构。

三、第一次使用，标准步骤

第 1 步：运行 install-env.bat

作用：
- 检查 Node.js 是否已安装
- 如果机器没装 Node.js，会优先调用 installers\node-v18.20.5-x64.msi
- 安装 backend 依赖
- 创建 uploads、frames、watermarks、logos 等运行目录

第 2 步：如果安装了 Node.js，但脚本提示需要重新打开

说明：
Node.js 刚安装完成时，系统 PATH 可能还没有刷新。

处理方式：
- 关闭当前窗口
- 重新双击 install-env.bat

第 3 步：运行 start.bat

作用：
- 启动后端服务
- 优先使用 installers\ffmpeg\bin 下的 ffmpeg.exe 和 ffprobe.exe
- 自动打开浏览器

默认访问地址：
http://localhost:3500

第 4 步：停止服务

双击运行：
stop.bat

四、这份包是否还需要在别的电脑下载依赖

正常情况下，不需要再额外下载 FFmpeg。

原因：
start.bat 会优先使用发布包内的：
- installers\ffmpeg\bin\ffmpeg.exe
- installers\ffmpeg\bin\ffprobe.exe

Node.js 是否需要下载，取决于目标机是否已经安装：

1. 目标机已经安装 Node.js 18+
   不需要再下载，直接运行 install-env.bat 即可。

2. 目标机没有安装 Node.js
   也不需要联网下载。
   install-env.bat 会直接调用包内的：
   installers\node-v18.20.5-x64.msi

五、目录结构要求

下面这个结构要保持不变：

VideoFrameCutter-Release\
├─ backend\
├─ frontend\
├─ installers\
│  ├─ node-v18.20.5-x64.msi
│  └─ ffmpeg\
│     └─ bin\
│        ├─ ffmpeg.exe
│        └─ ffprobe.exe
├─ install-env.bat
├─ start.bat
└─ stop.bat

六、常见问题

1. install-env.bat 提示 Node.js 未找到

检查：
- installers\node-v18.20.5-x64.msi 是否存在

2. start.bat 提示 FFmpeg 不可用

检查：
- installers\ffmpeg\bin\ffmpeg.exe 是否存在
- installers\ffmpeg\bin\ffprobe.exe 是否存在

3. 页面打不开

检查：
- backend\src\server.js 是否存在
- frontend\dist\index.html 是否存在
- 3500 端口是否被占用

4. 上传视频失败

检查：
- 磁盘空间是否足够
- backend\uploads 是否可写
- 视频大小是否超出限制

5. 局域网其他电脑无法访问

检查：
- Windows 防火墙是否放行 3500 端口
- 当前电脑 IP 是否可达

七、后续更新代码怎么处理

以后重新更新发布包时：
- 可以重新运行 build-release.bat
- 发布包中的 installers 依赖环境会被保留
- 不需要每次重新下载 Node.js 和 FFmpeg

八、建议

1. 首次部署完成后，先本机打开 http://localhost:3500 验证
2. 再测试上传一个小视频，确认抽帧流程正常
3. 再提供给局域网其他电脑访问
4. 不要手动删除 installers 目录中的 Node.js 和 FFmpeg 文件
