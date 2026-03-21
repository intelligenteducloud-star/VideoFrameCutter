# 视频智能截帧工具部署说明

本文档基于当前仓库实际实现整理，适用于局域网或单机部署。

## 部署目标

- 一个 Node.js 后端服务
- 一个由后端托管的前端静态产物
- 一套可访问的 FFmpeg / ffprobe 环境

默认服务端口：`3500`

## 环境要求

- Node.js 18+
- FFmpeg / ffprobe
- Windows、Linux 均可
- 可选：PM2、Nginx

## 一、获取项目

```bash
git clone https://github.com/intelligenteducloud-star/VideoFrameCutter.git
cd VideoFrameCutter
```

## 二、安装依赖

### 后端

```bash
cd backend
npm install
```

### 前端

```bash
cd ../frontend
npm install
```

## 三、构建前端

```bash
cd frontend
npm run build
```

构建后产物输出到 [`frontend/dist`](D:\AIprojects\VideoFrameCutter\frontend\dist)，后端会自动托管该目录。

## 四、配置后端环境变量

编辑 [`backend/.env`](D:\AIprojects\VideoFrameCutter\backend\.env)：

```env
PORT=3500
MAX_FILE_SIZE=314572800

# 如果系统 PATH 中找不到 ffmpeg / ffprobe，可显式指定
# FFMPEG_PATH=/usr/bin/ffmpeg
# FFPROBE_PATH=/usr/bin/ffprobe

# 可选的清理策略
# CLEANUP_INTERVAL_MS=3600000
# UPLOAD_TTL_MS=86400000
# FRAMES_TTL_MS=86400000
# ASSET_TTL_MS=604800000
```

## 五、配置 FFmpeg

后端启动时按以下顺序寻找 FFmpeg：

1. `.env` 中的 `FFMPEG_PATH` / `FFPROBE_PATH`
2. 项目内 `installers/ffmpeg/bin`
3. 系统环境变量 `PATH`

### Linux

```bash
sudo apt update
sudo apt install ffmpeg
```

校验：

```bash
ffmpeg -version
ffprobe -version
```

### Windows

- 可以直接安装到系统环境变量
- 也可以把 `ffmpeg.exe` 和 `ffprobe.exe` 放进 `installers/ffmpeg/bin`

## 六、启动服务

### 方式 1：直接启动

```bash
cd backend
npm start
```

访问：

```text
http://localhost:3500
```

### 方式 2：使用 PM2

```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 status
pm2 logs video-frame-cutter
```

设置开机启动：

```bash
pm2 startup
pm2 save
```

## 七、Nginx 反向代理，可选

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 300M;

    location / {
        proxy_pass http://localhost:3500;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3500;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 八、开放端口

确认 `3500` 端口可访问。

### Ubuntu / Debian

```bash
sudo ufw allow 3500
```

### CentOS / RHEL

```bash
sudo firewall-cmd --permanent --add-port=3500/tcp
sudo firewall-cmd --reload
```

## 九、运行建议

- 定期执行或保留后端自动清理策略，避免 `uploads`、`frames` 持续膨胀
- 为 PM2 或系统服务配置日志轮转
- 监控磁盘占用，尤其是大视频和大量抽帧场景
- 在生产环境将前端构建产物和后端源码一起发布

## 十、常见故障排查

### 1. 端口被占用

Linux:

```bash
lsof -i :3500
kill -9 <PID>
```

Windows:

```powershell
netstat -ano | findstr 3500
taskkill /PID <PID> /F
```

### 2. FFmpeg 未找到

检查：

- `.env` 中路径是否正确
- `installers/ffmpeg/bin` 是否存在可执行文件
- 系统 `PATH` 是否已包含 FFmpeg

### 3. 上传失败

检查：

- 文件大小是否超过 `MAX_FILE_SIZE`
- 后端目录写权限
- 反向代理的上传大小限制

### 4. Sharp 相关错误

```bash
cd backend
npm rebuild sharp
```

### 5. 前端页面空白

检查：

- 是否已执行 `frontend` 的 `npm run build`
- 后端是否能读取到 `frontend/dist`
- 浏览器控制台是否有 `VITE_API_BASE` 配置问题
