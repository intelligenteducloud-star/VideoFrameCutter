import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import videoRouter from './routes/video.js';
import { cleanupExpiredFiles } from './services/cleanupService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirs = ['uploads', 'frames', 'watermarks', 'logos'];
dirs.forEach((dir) => {
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

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/frames', express.static(path.join(__dirname, '../frames')));
app.use('/watermarks', express.static(path.join(__dirname, '../watermarks')));
app.use('/logos', express.static(path.join(__dirname, '../logos')));

app.use('/api', videoRouter(io));

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

const scheduleCleanup = () => {
  cleanupExpiredFiles().catch((error) => {
    console.error('Initial cleanup failed:', error);
  });

  const cleanupIntervalMs = Number(process.env.CLEANUP_INTERVAL_MS || 60 * 60 * 1000);
  setInterval(() => {
    cleanupExpiredFiles().catch((error) => {
      console.error('Scheduled cleanup failed:', error);
    });
  }, cleanupIntervalMs);
};

const PORT = Number(process.env.PORT || 3000);
httpServer.listen(PORT, () => {
  scheduleCleanup();
  console.log(`Server running on http://localhost:${PORT}`);
});
