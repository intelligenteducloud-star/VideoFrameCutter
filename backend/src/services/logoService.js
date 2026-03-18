import sharp from 'sharp';

export const applyLogo = async (imagePath, logoPath, options) => {
  const { positionX, positionY, opacity, size } = options;
  const outputPath = imagePath.replace(/(\.\w+)$/, '_logo$1');

  const image = sharp(imagePath);
  const metadata = await image.metadata();
  const logo = sharp(logoPath);
  const logoMetadata = await logo.metadata();

  const logoWidth = Math.floor((metadata.width * size) / 100);
  const logoHeight = Math.floor((logoMetadata.height * logoWidth) / logoMetadata.width);

  const resizedLogo = await logo.resize(logoWidth, logoHeight).toBuffer();

  const left = Math.floor((metadata.width * positionX) / 100 - logoWidth / 2);
  const top = Math.floor((metadata.height * positionY) / 100 - logoHeight / 2);

  await image.composite([{
    input: resizedLogo,
    left: Math.max(0, left),
    top: Math.max(0, top),
    blend: 'over'
  }]).toFile(outputPath);

  return outputPath;
};
