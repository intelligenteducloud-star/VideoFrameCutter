import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractFrames } from '../services/frameExtractor.js';
import { createZip } from '../services/zipService.js';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `video_${Date.now()}${ext}`;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的视频格式'));
    }
  }
});

export default (io) => {
  const router = express.Router();

  router.post('/upload', upload.single('video'), async (req, res) => {
    try {
      const file = req.file;
      const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');

      res.json({
        success: true,
        videoId: file.filename,
        filename: originalname,
        size: file.size,
        path: file.path
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.post('/extract', async (req, res) => {
    try {
      const { videoId, count, quality, format, resolution } = req.body;
      const socketId = req.body.socketId;

      console.log('Extract request:', { videoId, count, quality, format, resolution });

      const result = await extractFrames(videoId, {
        count: parseInt(count),
        quality,
        format,
        resolution
      }, io, socketId);

      res.json({ success: true, frames: result });
    } catch (error) {
      console.error('Extract error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.post('/download', async (req, res) => {
    try {
      const { frameIds, zipName } = req.body;
      const zipPath = await createZip(frameIds, zipName);
      res.download(zipPath, async (err) => {
        if (!err) await fs.unlink(zipPath);
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
};
