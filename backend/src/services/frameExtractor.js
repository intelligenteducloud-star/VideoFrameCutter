import ffmpeg from 'fluent-ffmpeg';
import { spawnSync } from 'child_process';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { filterFrames } from './frameFilter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.join(__dirname, '../..');
const releaseRoot = path.join(__dirname, '../../..');

const normalizeCandidate = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  return value.trim().replace(/^"(.*)"$/, '$1');
};

const findBinaryInPath = (binaryName) => {
  const command = process.platform === 'win32' ? 'where' : 'which';
  const result = spawnSync(command, [binaryName], {
    encoding: 'utf8',
    windowsHide: true
  });

  if (result.status !== 0 || !result.stdout) {
    return null;
  }

  const firstMatch = result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  return firstMatch && fs.existsSync(firstMatch) ? firstMatch : null;
};

const resolveBinary = (envName, fallbackRelativePath) => {
  const envValue = normalizeCandidate(process.env[envName]);
  if (envValue && fs.existsSync(envValue)) {
    return envValue;
  }

  const fallbackRoots = [
    releaseRoot,
    backendRoot,
    process.cwd(),
    path.join(process.cwd(), '..'),
    path.join(process.cwd(), '..', '..')
  ];

  for (const root of fallbackRoots) {
    const fallbackPath = path.join(root, fallbackRelativePath);
    if (fs.existsSync(fallbackPath)) {
      return fallbackPath;
    }
  }

  const binaryName = path.basename(fallbackRelativePath);
  return findBinaryInPath(binaryName);
};

const ffmpegPath = resolveBinary('FFMPEG_PATH', 'installers/ffmpeg/bin/ffmpeg.exe');
const ffprobePath = resolveBinary('FFPROBE_PATH', 'installers/ffmpeg/bin/ffprobe.exe');

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

if (ffprobePath) {
  ffmpeg.setFfprobePath(ffprobePath);
}

const getVideoDuration = (videoPath) =>
  new Promise((resolve, reject) => {
    if (!ffprobePath && !process.env.FFPROBE_PATH) {
      reject(
        new Error(
          'Cannot find ffprobe. Put ffprobe.exe into installers/ffmpeg/bin, or configure FFPROBE_PATH.'
        )
      );
      return;
    }

    ffmpeg.ffprobe(videoPath, (error, metadata) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(metadata.format.duration);
    });
  });

const extractSingleFrame = (videoPath, timestamp, outputPath, quality, resolution) =>
  new Promise((resolve, reject) => {
    let command = ffmpeg(videoPath)
      .seekInput(timestamp)
      .frames(1)
      .outputOptions(`-q:v ${quality}`);

    if (resolution) {
      command = command.size(resolution);
    }

    command
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run();
  });

const emitProgress = (io, socketId, payload) => {
  if (io && socketId) {
    io.to(socketId).emit('progress', payload);
  }
};

export const extractFrames = async (videoId, options, io, socketId) => {
  const { count, quality, format, resolution } = options;
  const videoPath = path.join(__dirname, '../../uploads', videoId);
  const framesDir = path.join(__dirname, '../../frames', videoId.split('.')[0]);

  await fsPromises.mkdir(framesDir, { recursive: true });

  const duration = await getVideoDuration(videoPath);
  const extractCount = Math.ceil(count * 1.5);
  const interval = duration / (extractCount + 1);

  const qualityMap = { low: 8, medium: 5, high: 2 };
  const qValue = qualityMap[quality] ?? qualityMap.medium;

  const resolutionMap = {
    '720p': '1280x720',
    '1080p': '1920x1080',
    original: null
  };
  const resValue = resolutionMap[resolution] ?? null;

  const frames = [];

  for (let index = 1; index <= extractCount; index += 1) {
    const timestamp = interval * index;
    const framePath = path.join(framesDir, `frame_${index}.${format}`);

    try {
      await extractSingleFrame(videoPath, timestamp, framePath, qValue, resValue);
      frames.push({
        id: `${videoId.split('.')[0]}_${index}`,
        path: framePath,
        timestamp,
        index
      });

      emitProgress(io, socketId, {
        stage: 'extracting',
        progress: Math.floor((index / extractCount) * 100),
        message: `正在提取第 ${index}/${extractCount} 帧...`,
        details: { extracted: index, total: extractCount }
      });
    } catch (error) {
      console.error(`Failed to extract frame ${index}:`, error);
    }
  }

  emitProgress(io, socketId, {
    stage: 'filtering',
    progress: 0,
    message: '开始智能筛选...'
  });

  const filteredFrames = await filterFrames(frames, count, io, socketId);

  emitProgress(io, socketId, {
    stage: 'complete',
    progress: 100,
    message: '截帧完成。'
  });

  return filteredFrames;
};
