import sharp from 'sharp';

export const applyLogo = async (imagePath, logoPath, options) => {
  const { positionX, positionY, opacity = 100, size } = options;
  const outputPath = imagePath.replace(/(\.\w+)$/, '_logo$1');

  const image = sharp(imagePath);
  const metadata = await image.metadata();
  const logoMetadata = await sharp(logoPath).metadata();

  const targetWidth = Math.max(1, Math.floor((metadata.width * size) / 100));
  const targetHeight = Math.max(1, Math.floor((logoMetadata.height * targetWidth) / logoMetadata.width));
  const maxWidth = Math.max(1, metadata.width);
  const maxHeight = Math.max(1, metadata.height);

  const resizedLogo = await sharp(logoPath)
    .resize({
      width: Math.min(targetWidth, maxWidth),
      height: Math.min(targetHeight, maxHeight),
      fit: 'inside',
      withoutEnlargement: true
    })
    .ensureAlpha(opacity / 100)
    .png()
    .toBuffer();

  const resizedMetadata = await sharp(resizedLogo).metadata();
  const logoWidth = resizedMetadata.width;
  const logoHeight = resizedMetadata.height;

  const rawLeft = Math.floor((metadata.width * positionX) / 100 - logoWidth / 2);
  const rawTop = Math.floor((metadata.height * positionY) / 100 - logoHeight / 2);
  const left = Math.max(0, Math.min(rawLeft, metadata.width - logoWidth));
  const top = Math.max(0, Math.min(rawTop, metadata.height - logoHeight));

  await image
    .composite([
      {
        input: resizedLogo,
        left,
        top,
        blend: 'over'
      }
    ])
    .toFile(outputPath);

  return outputPath;
};
