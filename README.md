# 视频智能截帧工具

一个基于Web的视频智能截帧工具，支持视频上传、智能截帧、预览和批量下载功能。

## 功能特性

- 📁 支持多种视频格式（MP4, AVI, MOV, WMV, FLV, MKV）
- 🎯 自定义截取数量（1-50张）
- 🤖 智能筛选（自动过滤黑白屏、模糊、重复画面）
- 🖼️ 图片预览和放大查看
- 📥 单张下载或批量打包下载
- ⚡ 实时进度显示
- 🎨 响应式设计

## 技术栈

### 前端
- React 18
- Vite
- Ant Design
- Socket.io Client
- Axios

### 后端
- Node.js + Express
- FFmpeg (视频处理)
- Socket.io (实时通信)
- Jimp (图像分析)
- Sharp (图像处理)

## 安装要求

### 系统依赖
- Node.js 18+
- FFmpeg (必须安装)

### 安装FFmpeg

**Windows:**
```bash
# 使用 Chocolatey
choco install ffmpeg

# 或下载安装包
# https://ffmpeg.org/download.html
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt-get install ffmpeg
```

## 快速开始

### 1. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

### 2. 启动后端服务

```bash
cd backend
npm start
```

后端服务将运行在 `http://localhost:3000`

### 3. 启动前端服务

```bash
cd frontend
npm run dev
```

前端服务将运行在 `http://localhost:5173`

### 4. 访问应用

打开浏览器访问 `http://localhost:5173`

## 使用说明

1. **上传视频**: 拖拽或点击选择视频文件（最大200MB）
2. **设置参数**:
   - 截取数量（1-50张）
   - 图片质量（低/中/高）
   - 图片格式（JPG/PNG）
   - 分辨率（原视频/720P/1080P）
3. **开始截取**: 点击"开始截取"按钮
4. **查看结果**: 等待智能筛选完成，查看截取的图片
5. **下载图片**:
   - 单张下载：点击图片下方的下载按钮
   - 批量下载：勾选图片后点击"批量下载"，可自定义ZIP文件名

## 项目结构

```
VideoFrameCutter/
├── frontend/                 # 前端项目
│   ├── src/
│   │   ├── components/      # React组件
│   │   ├── services/        # API服务
│   │   └── App.jsx          # 主应用
│   └── package.json
├── backend/                  # 后端项目
│   ├── src/
│   │   ├── routes/          # API路由
│   │   ├── services/        # 业务逻辑
│   │   └── server.js        # 服务器入口
│   ├── uploads/             # 视频上传目录
│   ├── frames/              # 截帧存储目录
│   └── package.json
└── README.md
```

## 智能筛选算法

工具会自动进行以下筛选：

1. **黑白屏检测**: 过滤90%以上像素为纯黑或纯白的画面
2. **模糊检测**: 使用拉普拉斯方差检测清晰度，过滤模糊画面
3. **相似度检测**: 使用感知哈希算法检测重复画面
4. **质量排序**: 根据清晰度分数排序，保留最佳画面

## 配置说明

### 后端配置

可在 `backend/.env` 文件中配置：

```env
PORT=3000
MAX_FILE_SIZE=209715200  # 200MB
```

### 前端配置

修改 `frontend/src/services/api.js` 中的 API_BASE 地址。

## 常见问题

**Q: 提示"FFmpeg未安装"？**
A: 请确保系统已安装FFmpeg并添加到环境变量PATH中。

**Q: 上传失败？**
A: 检查文件格式和大小是否符合要求（≤200MB）。

**Q: 截帧速度慢？**
A: 视频文件越大、分辨率越高，处理时间越长。建议使用中等质量设置。

**Q: 智能筛选后图片数量不足？**
A: 可能是视频内容重复度高或质量较差，系统会尽量保留最佳画面。

## 开发模式

```bash
# 后端开发模式（自动重启）
cd backend
npm run dev

# 前端开发模式（热更新）
cd frontend
npm run dev
```

## 构建生产版本

```bash
# 构建前端
cd frontend
npm run build

# 生产环境运行后端
cd backend
npm start
```

## 许可证

MIT

## 作者

视频智能截帧工具开发团队
