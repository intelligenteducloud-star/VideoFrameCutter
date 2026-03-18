import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { fileURLToPath } from 'url';
import { filterFrames } from './frameFilter.js';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置FFmpeg路径
const ffmpegPath = 'C:/Users/Administrator/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin/ffmpeg.exe';
const ffprobePath = 'C:/Users/Administrator/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin/ffprobe.exe';

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const getVideoDuration = (videoPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata.format.duration);
    });
  });
};

const extractSingleFrame = (videoPath, timestamp, outputPath, quality, resolution) => {
  return new Promise((resolve, reject) => {
    let command = ffmpeg(videoPath)
      .seekInput(timestamp)
      .frames(1)
      .outputOptions(`-q:v ${quality}`);

    if (resolution && resolution !== 'original') {
      command = command.size(resolution);
    }

    command
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run();
  });
};

export const extractFrames = async (videoId, options, io, socketId) => {
  const { count, quality, format, resolution } = options;
  const videoPath = path.join(__dirname, '../../uploads', videoId);
  const framesDir = path.join(__dirname, '../../frames', videoId.split('.')[0]);

  await fs.mkdir(framesDir, { recursive: true });

  const duration = await getVideoDuration(videoPath);
  const extractCount = Math.ceil(count * 1.5);
  const interval = duration / (extractCount + 1);

  const qualityMap = { low: 8, medium: 5, high: 2 };
  const qValue = qualityMap[quality] || 5;

  const resolutionMap = {
    '720p': '1280x720',
    '1080p': '1920x1080',
    'original': null
  };
  const resValue = resolutionMap[resolution] || null;

  const frames = [];

  for (let i = 1; i <= extractCount; i++) {
    const timestamp = interval * i;
    const framePath = path.join(framesDir, `frame_${i}.${format}`);

    try {
      await extractSingleFrame(videoPath, timestamp, framePath, qValue, resValue);
      frames.push({
        id: `${videoId.split('.')[0]}_${i}`,
        path: framePath,
        timestamp,
        index: i
      });

      if (io && socketId) {
        io.to(socketId).emit('progress', {
          stage: 'extracting',
          progress: Math.floor((i / extractCount) * 100),
          message: `正在提取第 ${i}/${extractCount} 帧...`,
          details: { extracted: i, total: extractCount }
        });
      }
    } catch (error) {
      console.error(`Failed to extract frame ${i}:`, error);
    }
  }

  if (io && socketId) {
    io.to(socketId).emit('progress', {
      stage: 'filtering',
      progress: 0,
      message: '开始智能筛选...'
    });
  }

  const filteredFrames = await filterFrames(frames, count, io, socketId);

  if (io && socketId) {
    io.to(socketId).emit('progress', {
      stage: 'complete',
      progress: 100,
      message: '截帧完成！'
    });
  }

  return filteredFrames;
};
