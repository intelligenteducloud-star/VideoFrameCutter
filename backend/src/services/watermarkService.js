import sharp from 'sharp';

const buildOverlayBuffer = async (assetPath, opacity, maxWidth, maxHeight) => {
  const pipeline = sharp(assetPath);

  if (maxWidth && maxHeight) {
    pipeline.resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside',
      withoutEnlargement: true
    });
  }

  return pipeline
    .ensureAlpha(opacity / 100)
    .png()
    .toBuffer();
};

export const applyWatermark = async (imagePath, watermarkPath, options) => {
  const { fullScreen, opacity = 100 } = options;
  const outputPath = imagePath.replace(/(\.\w+)$/, '_watermarked$1');

  const image = sharp(imagePath);
  const metadata = await image.metadata();
  const overlayBuffer = await buildOverlayBuffer(
    watermarkPath,
    opacity,
    metadata.width,
    metadata.height
  );
  const overlayMetadata = await sharp(overlayBuffer).metadata();

  if (fullScreen) {
    const cols = Math.ceil(metadata.width / overlayMetadata.width);
    const rows = Math.ceil(metadata.height / overlayMetadata.height);
    const composites = [];

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        composites.push({
          input: overlayBuffer,
          top: row * overlayMetadata.height,
          left: col * overlayMetadata.width,
          blend: 'over'
        });
      }
    }

    await image.composite(composites).toFile(outputPath);
    return outputPath;
  }

  const left = Math.floor((metadata.width - overlayMetadata.width) / 2);
  const top = Math.floor((metadata.height - overlayMetadata.height) / 2);

  await image
    .composite([
      {
        input: overlayBuffer,
        top,
        left,
        blend: 'over'
      }
    ])
    .toFile(outputPath);

  return outputPath;
};
