import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { extractFrames } from '../services/frameExtractor.js';
import { createZip } from '../services/zipService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const maxFileSize = Number(process.env.MAX_FILE_SIZE || 300 * 1024 * 1024);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `video_${Date.now()}${ext}`);
  }
});

const imageAssetFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (['.png', '.jpg', '.jpeg'].includes(ext)) {
    cb(null, true);
    return;
  }

  cb(new Error('只支持 PNG 或 JPG 图片格式'));
};

const upload = multer({
  storage,
  limits: { fileSize: maxFileSize },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv'].includes(ext)) {
      cb(null, true);
      return;
    }

    cb(new Error('不支持的视频格式'));
  }
});

const watermarkUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../../watermarks')),
    filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`)
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageAssetFilter
});

const logoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../../logos')),
    filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`)
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageAssetFilter
});

const uploadErrorHandler = (res, error) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ success: false, error: '文件大小超出限制' });
    return true;
  }

  if (error) {
    res.status(400).json({ success: false, error: error.message });
    return true;
  }

  return false;
};

export default (io) => {
  const router = express.Router();

  router.post('/upload', (req, res) => {
    upload.single('video')(req, res, async (error) => {
      if (uploadErrorHandler(res, error)) {
        return;
      }

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
      } catch (requestError) {
        res.status(500).json({ success: false, error: requestError.message });
      }
    });
  });

  router.post('/extract', async (req, res) => {
    try {
      const { videoId, count, quality, format, resolution, socketId } = req.body;

      const result = await extractFrames(
        videoId,
        {
          count: parseInt(count, 10),
          quality,
          format,
          resolution
        },
        io,
        socketId
      );

      res.json({ success: true, frames: result });
    } catch (error) {
      console.error('Extract error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.post('/download', async (req, res) => {
    try {
      const { frameIds, zipName, watermark, logo } = req.body;
      const zipPath = await createZip(frameIds, zipName, watermark, logo);
      res.download(zipPath, async (error) => {
        if (!error) {
          await fs.unlink(zipPath);
        }
      });
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  router.post('/upload-asset', (req, res) => {
    watermarkUpload.single('file')(req, res, async (error) => {
      if (uploadErrorHandler(res, error)) {
        return;
      }

      try {
        const file = req.file;
        res.json({
          success: true,
          filename: file.filename,
          path: file.path,
          url: `/watermarks/${file.filename}`
        });
      } catch (requestError) {
        res.status(500).json({ success: false, error: requestError.message });
      }
    });
  });

  router.post('/upload-logo', (req, res) => {
    logoUpload.single('file')(req, res, async (error) => {
      if (uploadErrorHandler(res, error)) {
        return;
      }

      try {
        const file = req.file;
        res.json({
          success: true,
          filename: file.filename,
          path: file.path,
          url: `/logos/${file.filename}`
        });
      } catch (requestError) {
        res.status(500).json({ success: false, error: requestError.message });
      }
    });
  });

  return router;
};
