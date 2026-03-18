import sharp from 'sharp';
import path from 'path';

export const applyWatermark = async (imagePath, watermarkPath, options) => {
  const { fullScreen, opacity } = options;
  const outputPath = imagePath.replace(/(\.\w+)$/, '_watermarked$1');

  const image = sharp(imagePath);
  const metadata = await image.metadata();

  if (fullScreen) {
    const watermark = sharp(watermarkPath);
    const wmMetadata = await watermark.metadata();

    const cols = Math.ceil(metadata.width / wmMetadata.width);
    const rows = Math.ceil(metadata.height / wmMetadata.height);

    const composites = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        composites.push({
          input: watermarkPath,
          top: y * wmMetadata.height,
          left: x * wmMetadata.width,
          blend: 'over'
        });
      }
    }

    await image.composite(composites).toFile(outputPath);
  } else {
    const wmMetadata = await sharp(watermarkPath).metadata();
    const left = Math.floor((metadata.width - wmMetadata.width) / 2);
    const top = Math.floor((metadata.height - wmMetadata.height) / 2);

    await image.composite([{
      input: watermarkPath,
      top,
      left,
      blend: 'over'
    }]).toFile(outputPath);
  }

  return outputPath;
};
