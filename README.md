# 视频智能截帧工具

一个基于 Web 的视频智能截帧工具，支持上传视频、按参数抽帧、自动过滤低质量截图、预览结果、单张下载、批量 ZIP 下载，并支持给截图叠加水印和 Logo。

## 文档入口

为避免历史版本文档造成混淆，当前仓库请只参考以下文档：

1. 产品需求文档：
   [视频智能截帧工具需求文档.md](/D:/AIprojects/VideoFrameCutter/视频智能截帧工具需求文档.md)
2. 部署文档：
   [DEPLOY.md](/D:/AIprojects/VideoFrameCutter/DEPLOY.md)
3. 发布包使用说明：
   [README-部署说明.txt](/D:/AIprojects/VideoFrameCutter/README-部署说明.txt)

## 功能概览

1. 支持上传单个视频文件，默认最大 300MB。
2. 支持配置截图数量、质量、格式、分辨率。
3. 自动过滤黑白屏、模糊帧、重复帧。
4. 支持抽帧进度展示和结果网格预览。
5. 支持单张下载和批量 ZIP 下载。
6. 支持水印和 Logo 的实时预览与下载落盘。
7. 支持运行期历史文件自动清理。

## 当前版本说明

1. Logo 定位使用 `X/Y` 滑块，不支持九宫格或拖拽定位。
2. “仅当前图片下载 / 预览”只影响当前预览和单张下载，不保存为长期单图配置。
3. 批量下载只应用“应用到所有图片”的水印 / Logo 设置。
4. 项目定位为本地 / 局域网部署工具，不包含多用户、任务历史和数据库能力。

## 技术栈

### 前端

- React
- Vite
- Ant Design
- Axios
- Socket.IO Client

### 后端

- Node.js 18+
- Express
- Socket.IO
- FFmpeg / ffprobe
- Jimp
- Sharp
- Archiver

## 项目结构

```text
VideoFrameCutter/
├── backend/
│   ├── src/
│   ├── uploads/
│   ├── frames/
│   ├── watermarks/
│   ├── logos/
│   ├── test/
│   └── package.json
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── installers/
├── DEPLOY.md
├── README.md
└── 视频智能截帧工具需求文档.md
```

## 环境要求

1. Node.js 18 或更高版本。
2. FFmpeg 和 ffprobe。

后端按以下顺序查找 FFmpeg：

1. `FFMPEG_PATH` / `FFPROBE_PATH`
2. 项目内 `installers/ffmpeg/bin`
3. 系统 `PATH`

## 本地开发

### 安装依赖

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 配置后端环境变量

编辑 [backend/.env](/D:/AIprojects/VideoFrameCutter/backend/.env)：

```env
PORT=3500
MAX_FILE_SIZE=314572800

# 可选
# FFMPEG_PATH=C:/ffmpeg/bin/ffmpeg.exe
# FFPROBE_PATH=C:/ffmpeg/bin/ffprobe.exe
# CLEANUP_INTERVAL_MS=3600000
# UPLOAD_TTL_MS=86400000
# FRAMES_TTL_MS=86400000
# ASSET_TTL_MS=604800000
```

### 启动后端

```bash
cd backend
npm start
```

访问地址：`http://localhost:3500`

### 启动前端开发服务

```bash
cd frontend
npm run dev
```

访问地址：`http://localhost:5173`

如需将前端指向其他后端地址，可设置：

```bash
VITE_API_BASE=http://localhost:3500
```

## 测试与校验

### 后端测试

```bash
cd backend
npm test
```

当前覆盖：

1. 文件清理策略
2. ZIP 文件名清洗
3. 黑白屏检测、清晰度比较、相似度计算

### 前端校验

```bash
cd frontend
npm run lint
npm run build
```

## 运行期文件清理

后端会定时清理以下目录中的过期文件：

1. `backend/uploads`
2. `backend/frames`
3. `backend/watermarks`
4. `backend/logos`

默认策略：

1. 上传视频保留 24 小时
2. 抽帧结果保留 24 小时
3. 水印和 Logo 素材保留 7 天

可通过 `.env` 覆盖。

## License

MIT
