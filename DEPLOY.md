# 视频智能截帧工具 - 部署指南

## 系统要求

- Node.js 18+
- FFmpeg（必须安装）
- PM2（推荐用于进程管理）

## 部署步骤

### 1. 上传文件到服务器

将整个项目目录上传到服务器，或使用 git clone：

```bash
git clone https://github.com/intelligenteducloud-star/VideoFrameCutter.git
cd VideoFrameCutter
```

### 2. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 前端已构建，无需再次安装
```

### 3. 配置环境变量

编辑 `backend/.env` 文件：

```
PORT=3500
MAX_FILE_SIZE=314572800
```

### 4. 安装 FFmpeg

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**CentOS/RHEL:**
```bash
sudo yum install ffmpeg
```

**验证安装:**
```bash
ffmpeg -version
```

### 5. 启动服务

**方式1: 使用 PM2（推荐）**

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start ecosystem.config.cjs

# 查看状态
pm2 status

# 查看日志
pm2 logs video-frame-cutter

# 设置开机自启
pm2 startup
pm2 save
```

**方式2: 直接启动**

```bash
cd backend
npm start
```

### 6. 访问应用

打开浏览器访问：`http://服务器IP:3500`

## 防火墙配置

确保开放 3500 端口：

```bash
# Ubuntu/Debian
sudo ufw allow 3500

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3500/tcp
sudo firewall-cmd --reload
```

## Nginx 反向代理（可选）

如果需要使用域名访问，配置 Nginx：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 300M;

    location / {
        proxy_pass http://localhost:3500;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
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

## 常用命令

```bash
# PM2 管理
pm2 restart video-frame-cutter  # 重启
pm2 stop video-frame-cutter     # 停止
pm2 delete video-frame-cutter   # 删除
pm2 logs video-frame-cutter     # 查看日志

# 查看进程
pm2 list

# 监控
pm2 monit
```

## 故障排查

1. **端口被占用**
   ```bash
   lsof -i :3500
   kill -9 <PID>
   ```

2. **FFmpeg 未安装**
   - 检查：`ffmpeg -version`
   - 安装后重启服务

3. **文件上传失败**
   - 检查磁盘空间
   - 检查目录权限

4. **Sharp 模块错误**
   ```bash
   cd backend
   npm rebuild sharp
   ```

## 目录结构

```
VideoFrameCutter/
├── backend/
│   ├── src/
│   ├── uploads/      # 视频上传目录
│   ├── frames/       # 截帧存储目录
│   ├── watermarks/   # 水印文件目录
│   └── logos/        # Logo文件目录
├── frontend/
│   └── dist/         # 前端构建文件
├── logs/             # PM2日志目录
└── ecosystem.config.cjs  # PM2配置
```

## 注意事项

1. 定期清理临时文件（uploads、frames目录）
2. 建议配置日志轮转
3. 监控磁盘空间使用
4. 定期备份重要数据
