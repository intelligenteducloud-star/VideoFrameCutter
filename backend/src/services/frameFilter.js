import Jimp from 'jimp';
import imghash from 'imghash';

export const isBlackOrWhiteScreen = async (imagePath) => {
  const image = await Jimp.read(imagePath);
  const { width, height } = image.bitmap;
  let blackCount = 0;
  let whiteCount = 0;
  const totalPixels = width * height;

  image.scan(0, 0, width, height, function scanPixel(x, y, idx) {
    const r = this.bitmap.data[idx];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    const avg = (r + g + b) / 3;

    if (avg < 20) {
      blackCount += 1;
    } else if (avg > 235) {
      whiteCount += 1;
    }
  });

  return blackCount / totalPixels > 0.9 || whiteCount / totalPixels > 0.9;
};

export const calculateBlurriness = async (imagePath) => {
  const image = await Jimp.read(imagePath);
  const gray = image.greyscale();
  const { width, height } = gray.bitmap;
  const pixels = [];

  gray.scan(0, 0, width, height, function scanPixel(x, y, idx) {
    pixels.push(this.bitmap.data[idx]);
  });

  const mean = pixels.reduce((sum, value) => sum + value, 0) / pixels.length;
  return pixels.reduce((sum, value) => sum + (value - mean) ** 2, 0) / pixels.length;
};

export const calculateSimilarity = async (hash1, hash2) => {
  let distance = 0;
  for (let index = 0; index < hash1.length; index += 1) {
    if (hash1[index] !== hash2[index]) {
      distance += 1;
    }
  }
  return distance;
};

const emitProgress = (io, socketId, payload) => {
  if (io && socketId) {
    io.to(socketId).emit('progress', payload);
  }
};

export const filterFrames = async (frames, targetCount, io, socketId) => {
  let filtered = [...frames];
  const nonBlackWhite = [];

  for (let index = 0; index < filtered.length; index += 1) {
    const isBlackWhite = await isBlackOrWhiteScreen(filtered[index].path);
    if (!isBlackWhite) {
      nonBlackWhite.push(filtered[index]);
    }

    emitProgress(io, socketId, {
      stage: 'filtering',
      progress: Math.floor(((index + 1) / filtered.length) * 30),
      message: `正在检测黑白屏 ${index + 1}/${filtered.length}...`
    });
  }

  filtered = nonBlackWhite;
  if (filtered.length === 0) {
    return [];
  }

  const withBlur = await Promise.all(
    filtered.map(async (frame) => ({
      ...frame,
      blurScore: await calculateBlurriness(frame.path)
    }))
  );

  const avgBlur = withBlur.reduce((sum, frame) => sum + frame.blurScore, 0) / withBlur.length;
  const threshold = avgBlur * 0.5;
  filtered = withBlur.filter((frame) => frame.blurScore > threshold);

  emitProgress(io, socketId, {
    stage: 'filtering',
    progress: 60,
    message: `模糊检测完成，保留 ${filtered.length} 帧。`
  });

  if (filtered.length === 0) {
    return [];
  }

  const hashedFrames = await Promise.all(
    filtered.map(async (frame) => ({
      ...frame,
      hash: await imghash.hash(frame.path)
    }))
  );

  const uniqueFrames = [];
  for (const frame of hashedFrames) {
    let isDuplicate = false;
    for (const existing of uniqueFrames) {
      const similarity = await calculateSimilarity(frame.hash, existing.hash);
      if (similarity < 5) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      uniqueFrames.push(frame);
    }
  }

  filtered = uniqueFrames;

  emitProgress(io, socketId, {
    stage: 'filtering',
    progress: 90,
    message: `相似度检测完成，保留 ${filtered.length} 帧。`
  });

  filtered.sort((a, b) => b.blurScore - a.blurScore);

  return filtered.slice(0, targetCount).map((frame) => ({
    id: frame.id,
    path: frame.path.replace(/\\/g, '/'),
    url: `/frames/${frame.path.split('frames')[1].replace(/\\/g, '/')}`,
    timestamp: frame.timestamp,
    index: frame.index
  }));
};
