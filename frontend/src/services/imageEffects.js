import { buildAssetUrl } from './api';

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

const shouldApplyWatermark = (settings, scope) =>
  settings?.enabled && settings?.fileUrl && (scope === 'single' || settings.applyToAll);

const shouldApplyLogo = (settings, scope) =>
  settings?.enabled && settings?.fileUrl && (scope === 'single' || settings.applyToAll);

export const hasAnyEffect = (watermarkSettings, logoSettings, scope = 'all') =>
  shouldApplyWatermark(watermarkSettings, scope) || shouldApplyLogo(logoSettings, scope);

export const renderFrameWithEffects = async (
  frameUrl,
  watermarkSettings,
  logoSettings,
  scope = 'all'
) => {
  const hasWatermark = shouldApplyWatermark(watermarkSettings, scope);
  const hasLogo = shouldApplyLogo(logoSettings, scope);
  const sourceUrl = buildAssetUrl(frameUrl);

  if (!hasWatermark && !hasLogo) {
    return sourceUrl;
  }

  const image = await loadImage(sourceUrl);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = image.width;
  canvas.height = image.height;
  context.drawImage(image, 0, 0);

  if (hasWatermark) {
    const watermark = await loadImage(watermarkSettings.fileUrl);
    context.globalAlpha = watermarkSettings.opacity / 100;

    if (watermarkSettings.fullScreen) {
      const cols = Math.ceil(canvas.width / watermark.width);
      const rows = Math.ceil(canvas.height / watermark.height);
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          context.drawImage(watermark, col * watermark.width, row * watermark.height);
        }
      }
    } else {
      const x = (canvas.width - watermark.width) / 2;
      const y = (canvas.height - watermark.height) / 2;
      context.drawImage(watermark, x, y);
    }

    context.globalAlpha = 1;
  }

  if (hasLogo) {
    const logo = await loadImage(logoSettings.fileUrl);
    const logoWidth = (canvas.width * logoSettings.size) / 100;
    const logoHeight = (logo.height * logoWidth) / logo.width;
    const x = (canvas.width * logoSettings.positionX) / 100 - logoWidth / 2;
    const y = (canvas.height * logoSettings.positionY) / 100 - logoHeight / 2;

    context.globalAlpha = logoSettings.opacity / 100;
    context.drawImage(logo, x, y, logoWidth, logoHeight);
    context.globalAlpha = 1;
  }

  return canvas.toDataURL();
};
