import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { applyWatermark } from './watermarkService.js';
import { applyLogo } from './logoService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createZip = async (frameIds, zipName, watermark, logo) => {
  const zipPath = path.join(__dirname, '../../frames', `${zipName}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise(async (resolve, reject) => {
    output.on('close', () => resolve(zipPath));
    archive.on('error', reject);

    archive.pipe(output);

    for (let index = 0; index < frameIds.length; index++) {
      const frameId = frameIds[index];
      const parts = frameId.split('_');
      const frameIndex = parts[parts.length - 1];
      const videoId = parts.slice(0, -1).join('_');

      const framesDir = path.join(__dirname, '../../frames', videoId);
      if (fs.existsSync(framesDir)) {
        const files = fs.readdirSync(framesDir);
        const frameFile = files.find(f => f.startsWith(`frame_${frameIndex}.`));
        if (frameFile) {
          let framePath = path.join(framesDir, frameFile);

          if (watermark && watermark.serverPath) {
            const watermarkPath = path.join(__dirname, '../../watermarks', watermark.serverPath);
            framePath = await applyWatermark(framePath, watermarkPath, watermark);
          }

          if (logo && logo.serverPath) {
            const logoPath = path.join(__dirname, '../../logos', logo.serverPath);
            framePath = await applyLogo(framePath, logoPath, logo);
          }

          archive.file(framePath, { name: `frame_${index + 1}${path.extname(frameFile)}` });
        }
      }
    }

    archive.finalize();
  });
};
