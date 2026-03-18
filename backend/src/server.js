import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import videoRouter from './routes/video.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确保必要的目录存在
const dirs = ['uploads', 'frames', 'watermarks', 'logos'];
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/frames', express.static(path.join(__dirname, '../frames')));
app.use('/watermarks', express.static(path.join(__dirname, '../watermarks')));
app.use('/logos', express.static(path.join(__dirname, '../logos')));

// API路由
app.use('/api', videoRouter(io));

// 服务前端静态文件（生产环境）
app.use(express.static(path.join(__dirname, '../../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
