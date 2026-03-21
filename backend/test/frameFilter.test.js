import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import Jimp from 'jimp';
import {
  calculateBlurriness,
  calculateSimilarity,
  isBlackOrWhiteScreen
} from '../src/services/frameFilter.js';

const createTempImage = async (filePath, painter) => {
  const image = new Jimp(32, 32, 0xffffffff);
  painter(image);
  await image.writeAsync(filePath);
};

test('isBlackOrWhiteScreen identifies near-white frames', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'frame-filter-'));
  const whiteImage = path.join(tempDir, 'white.png');

  await createTempImage(whiteImage, () => {});

  assert.equal(await isBlackOrWhiteScreen(whiteImage), true);
  await fs.rm(tempDir, { recursive: true, force: true });
});

test('calculateBlurriness ranks detailed image above flat image', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'frame-filter-'));
  const flatImage = path.join(tempDir, 'flat.png');
  const detailedImage = path.join(tempDir, 'detailed.png');

  await createTempImage(flatImage, () => {});
  await createTempImage(detailedImage, (image) => {
    for (let x = 0; x < 32; x += 1) {
      for (let y = 0; y < 32; y += 1) {
        const color = (x + y) % 2 === 0 ? 0xff0000ff : 0x000000ff;
        image.setPixelColor(color, x, y);
      }
    }
  });

  const flatScore = await calculateBlurriness(flatImage);
  const detailedScore = await calculateBlurriness(detailedImage);

  assert.ok(detailedScore > flatScore);
  await fs.rm(tempDir, { recursive: true, force: true });
});

test('calculateSimilarity counts differing hash characters', async () => {
  assert.equal(await calculateSimilarity('abcdef', 'abcxef'), 1);
  assert.equal(await calculateSimilarity('aaaa', 'bbbb'), 4);
});
