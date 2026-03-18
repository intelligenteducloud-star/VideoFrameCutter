import Jimp from 'jimp';
import imghash from 'imghash';

const isBlackOrWhiteScreen = async (imagePath) => {
  const image = await Jimp.read(imagePath);
  const { width, height } = image.bitmap;
  let blackCount = 0, whiteCount = 0, totalPixels = width * height;

  image.scan(0, 0, width, height, function(x, y, idx) {
    const r = this.bitmap.data[idx];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    const avg = (r + g + b) / 3;

    if (avg < 20) blackCount++;
    else if (avg > 235) whiteCount++;
  });

  return (blackCount / totalPixels > 0.9) || (whiteCount / totalPixels > 0.9);
};

const calculateBlurriness = async (imagePath) => {
  const image = await Jimp.read(imagePath);
  const gray = image.greyscale();
  const { width, height } = gray.bitmap;

  let variance = 0;
  const pixels = [];

  gray.scan(0, 0, width, height, function(x, y, idx) {
    pixels.push(this.bitmap.data[idx]);
  });

  const mean = pixels.reduce((a, b) => a + b) / pixels.length;
  variance = pixels.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / pixels.length;

  return variance;
};

const calculateSimilarity = async (hash1, hash2) => {
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) distance++;
  }
  return distance;
};

export const filterFrames = async (frames, targetCount, io, socketId) => {
  let filtered = [...frames];
  let progress = 0;

  // 1. 黑白屏检测
  const nonBlackWhite = [];
  for (let i = 0; i < filtered.length; i++) {
    const isBlackWhite = await isBlackOrWhiteScreen(filtered[i].path);
    if (!isBlackWhite) {
      nonBlackWhite.push(filtered[i]);
    }
    progress = Math.floor(((i + 1) / filtered.length) * 30);
    if (io && socketId) {
      io.to(socketId).emit('progress', {
        stage: 'filtering',
        progress,
        message: `黑白屏检测中 ${i + 1}/${filtered.length}...`
      });
    }
  }
  filtered = nonBlackWhite;

  // 2. 模糊检测
  const withBlur = await Promise.all(
    filtered.map(async (frame) => ({
      ...frame,
      blurScore: await calculateBlurriness(frame.path)
    }))
  );

  const avgBlur = withBlur.reduce((sum, f) => sum + f.blurScore, 0) / withBlur.length;
  const threshold = avgBlur * 0.5;
  filtered = withBlur.filter(f => f.blurScore > threshold);

  if (io && socketId) {
    io.to(socketId).emit('progress', {
      stage: 'filtering',
      progress: 60,
      message: `模糊检测完成，保留 ${filtered.length} 帧...`
    });
  }

  // 3. 相似度检测
  const hashes = await Promise.all(
    filtered.map(async (frame) => ({
      ...frame,
      hash: await imghash.hash(frame.path)
    }))
  );

  const unique = [];
  for (const frame of hashes) {
    let isDuplicate = false;
    for (const existing of unique) {
      const similarity = await calculateSimilarity(frame.hash, existing.hash);
      if (similarity < 5) {
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) unique.push(frame);
  }
  filtered = unique;

  if (io && socketId) {
    io.to(socketId).emit('progress', {
      stage: 'filtering',
      progress: 90,
      message: `相似度检测完成，保留 ${filtered.length} 帧...`
    });
  }

  // 4. 质量排序
  filtered.sort((a, b) => b.blurScore - a.blurScore);

  return filtered.slice(0, targetCount).map(f => ({
    id: f.id,
    path: f.path.replace(/\\/g, '/'),
    url: `/frames/${f.path.split('frames')[1].replace(/\\/g, '/')}`,
    timestamp: f.timestamp,
    index: f.index
  }));
};
