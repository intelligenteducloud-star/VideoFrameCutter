import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { removeExpiredEntries } from '../src/services/cleanupService.js';

test('removeExpiredEntries deletes stale files and keeps recent files', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cleanup-test-'));
  const staleFile = path.join(tempDir, 'stale.txt');
  const freshFile = path.join(tempDir, 'fresh.txt');

  await fs.writeFile(staleFile, 'old');
  await fs.writeFile(freshFile, 'new');

  const now = Date.now();
  const oldTime = new Date(now - 10_000);
  const newTime = new Date(now - 1_000);

  await fs.utimes(staleFile, oldTime, oldTime);
  await fs.utimes(freshFile, newTime, newTime);

  await removeExpiredEntries(tempDir, 5_000, now);

  await assert.doesNotReject(() => fs.access(freshFile));
  await assert.rejects(() => fs.access(staleFile));
  await fs.rm(tempDir, { recursive: true, force: true });
});
