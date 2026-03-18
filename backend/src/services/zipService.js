import archiver from 'archiver';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createZip = async (frameIds, zipName) => {
  const zipPath = path.join(__dirname, '../../frames', `${zipName}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', () => resolve(zipPath));
    archive.on('error', reject);

    archive.pipe(output);

    frameIds.forEach((frameId, index) => {
      // frameId格式: video_xxx_1
      const parts = frameId.split('_');
      const frameIndex = parts[parts.length - 1];
      const videoId = parts.slice(0, -1).join('_');

      // 查找frames目录下的文件
      const framesDir = path.join(__dirname, '../../frames', videoId);
      if (fs.existsSync(framesDir)) {
        const files = fs.readdirSync(framesDir);
        const frameFile = files.find(f => f.startsWith(`frame_${frameIndex}.`));
        if (frameFile) {
          const framePath = path.join(framesDir, frameFile);
          archive.file(framePath, { name: `frame_${index + 1}${path.extname(frameFile)}` });
        }
      }
    });

    archive.finalize();
  });
};
