import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cleanupTargets = [
  { relativePath: '../../uploads', maxAgeMs: Number(process.env.UPLOAD_TTL_MS || 24 * 60 * 60 * 1000) },
  { relativePath: '../../frames', maxAgeMs: Number(process.env.FRAMES_TTL_MS || 24 * 60 * 60 * 1000) },
  { relativePath: '../../watermarks', maxAgeMs: Number(process.env.ASSET_TTL_MS || 7 * 24 * 60 * 60 * 1000) },
  { relativePath: '../../logos', maxAgeMs: Number(process.env.ASSET_TTL_MS || 7 * 24 * 60 * 60 * 1000) }
];

export const removeExpiredEntries = async (targetDir, maxAgeMs, now = Date.now()) => {
  const entries = await fs.readdir(targetDir, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(targetDir, entry.name);
      const stats = await fs.stat(entryPath);

      if (now - stats.mtimeMs <= maxAgeMs) {
        return;
      }

      await fs.rm(entryPath, { recursive: true, force: true });
    })
  );
};

export const cleanupExpiredFiles = async () => {
  await Promise.all(
    cleanupTargets.map(async ({ relativePath, maxAgeMs }) => {
      const targetDir = path.join(__dirname, relativePath);
      try {
        await removeExpiredEntries(targetDir, maxAgeMs);
      } catch (error) {
        console.error(`Cleanup failed for ${targetDir}:`, error);
      }
    })
  );
};

export const __test__ = {
  cleanupTargets
};
