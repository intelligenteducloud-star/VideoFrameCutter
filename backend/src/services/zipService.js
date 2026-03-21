import archiver from 'archiver';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { applyWatermark } from './watermarkService.js';
import { applyLogo } from './logoService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const sanitizeZipName = (name) => {
  const sanitized = String(name || 'frames').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').trim();
  return sanitized || 'frames';
};

export const createZip = async (frameIds, zipName, watermark, logo) => {
  const safeZipName = sanitizeZipName(zipName);
  const zipDir = path.join(__dirname, '../../frames');
  const zipPath = path.join(zipDir, `${safeZipName}_${Date.now()}.zip`);
  const archive = archiver('zip', { zlib: { level: 9 } });
  const tempFiles = [];

  return new Promise((resolve, reject) => {
    let output;
    let addedFrames = 0;

    const cleanupTempFiles = async () => {
      await Promise.all(tempFiles.map((filePath) => fsPromises.rm(filePath, { force: true })));
    };

    const appendFrames = async () => {
      await fsPromises.mkdir(zipDir, { recursive: true });
      output = fs.createWriteStream(zipPath);

      output.on('close', async () => {
        await cleanupTempFiles();
        resolve(zipPath);
      });

      output.on('error', async (error) => {
        await cleanupTempFiles();
        reject(error);
      });

      archive.on('error', async (error) => {
        await cleanupTempFiles();
        reject(error);
      });

      archive.pipe(output);

      for (let index = 0; index < frameIds.length; index += 1) {
        const frameId = frameIds[index];
        const parts = frameId.split('_');
        const frameIndex = parts[parts.length - 1];
        const videoId = parts.slice(0, -1).join('_');
        const framesDir = path.join(__dirname, '../../frames', videoId);

        if (!fs.existsSync(framesDir)) {
          continue;
        }

        const files = await fsPromises.readdir(framesDir);
        const frameFile = files.find((file) => file.startsWith(`frame_${frameIndex}.`));

        if (!frameFile) {
          continue;
        }

        let framePath = path.join(framesDir, frameFile);

        if (watermark?.serverPath) {
          const watermarkPath = path.join(__dirname, '../../watermarks', watermark.serverPath);
          await fsPromises.access(watermarkPath);
          framePath = await applyWatermark(framePath, watermarkPath, watermark);
          tempFiles.push(framePath);
        }

        if (logo?.serverPath) {
          const logoPath = path.join(__dirname, '../../logos', logo.serverPath);
          await fsPromises.access(logoPath);
          const nextPath = await applyLogo(framePath, logoPath, logo);

          if (nextPath !== framePath) {
            tempFiles.push(nextPath);
          }

          framePath = nextPath;
        }

        archive.file(framePath, { name: `frame_${index + 1}${path.extname(frameFile)}` });
        addedFrames += 1;
      }

      if (frameIds.length > 0 && addedFrames === 0) {
        throw new Error('No frames were added to the ZIP archive.');
      }

      await archive.finalize();
    };

    appendFrames().catch(async (error) => {
      await cleanupTempFiles();
      reject(error);
    });
  });
};
