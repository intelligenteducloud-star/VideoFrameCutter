import { Checkbox, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useState, useEffect, useRef } from 'react';

export default function ImageCard({ frame, selected, onSelect, onPreview, onDownload, watermarkSettings, logoSettings }) {
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3500';
  const [displaySrc, setDisplaySrc] = useState(`${API_BASE}${frame.url}`);
  const canvasRef = useRef(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  useEffect(() => {
    const applyEffects = async () => {
      const hasWatermark = watermarkSettings?.enabled && watermarkSettings?.fileUrl;
      const hasLogo = logoSettings?.enabled && logoSettings?.fileUrl;

      if (!hasWatermark && !hasLogo) {
        setDisplaySrc(`${API_BASE}${frame.url}`);
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = `${API_BASE}${frame.url}`;

      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        if (hasWatermark) {
          const wmImg = new Image();
          wmImg.crossOrigin = 'anonymous';
          wmImg.src = watermarkSettings.fileUrl;
          await new Promise((resolve) => {
            wmImg.onload = () => {
              ctx.globalAlpha = watermarkSettings.opacity / 100;
              if (watermarkSettings.fullScreen) {
                const cols = Math.ceil(canvas.width / wmImg.width);
                const rows = Math.ceil(canvas.height / wmImg.height);
                for (let y = 0; y < rows; y++) {
                  for (let x = 0; x < cols; x++) {
                    ctx.drawImage(wmImg, x * wmImg.width, y * wmImg.height);
                  }
                }
              } else {
                const x = (canvas.width - wmImg.width) / 2;
                const y = (canvas.height - wmImg.height) / 2;
                ctx.drawImage(wmImg, x, y);
              }
              ctx.globalAlpha = 1;
              resolve();
            };
          });
        }

        if (hasLogo) {
          const logoImg = new Image();
          logoImg.crossOrigin = 'anonymous';
          logoImg.src = logoSettings.fileUrl;
          await new Promise((resolve) => {
            logoImg.onload = () => {
              const logoWidth = (canvas.width * logoSettings.size) / 100;
              const logoHeight = (logoImg.height * logoWidth) / logoImg.width;

              const x = (canvas.width * logoSettings.positionX) / 100 - logoWidth / 2;
              const y = (canvas.height * logoSettings.positionY) / 100 - logoHeight / 2;

              ctx.globalAlpha = logoSettings.opacity / 100;
              ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);
              ctx.globalAlpha = 1;
              resolve();
            };
          });
        }

        setDisplaySrc(canvas.toDataURL());
      };
    };

    applyEffects();
  }, [frame.url, watermarkSettings, logoSettings, API_BASE]);

  return (
    <div style={{
      border: '1px solid #d9d9d9',
      borderRadius: 8,
      overflow: 'hidden',
      background: '#fff',
      marginBottom: 16
    }}>
      <img
        alt={`Frame ${frame.index}`}
        src={displaySrc}
        style={{ width: '100%', height: 200, objectFit: 'cover', cursor: 'pointer', display: 'block' }}
        onClick={() => onPreview(frame)}
      />
      <div style={{ padding: 12, fontSize: 12 }}>
        <div>序号: {frame.index}</div>
        <div>时间: {formatTime(frame.timestamp)}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <Checkbox
            checked={selected}
            onChange={(e) => onSelect(frame.id, e.target.checked)}
          />
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDownload(frame);
            }}
          />
        </div>
      </div>
    </div>
  );
}
