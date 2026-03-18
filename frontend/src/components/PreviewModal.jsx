import { Modal, Button, Space } from 'antd';
import { LeftOutlined, RightOutlined, ZoomInOutlined, ZoomOutOutlined, DownloadOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';

export default function PreviewModal({ visible, frame, frames, onClose, onDownload, onNavigate, watermarkSettings, logoSettings }) {
  const [zoom, setZoom] = useState(1);
  const [displaySrc, setDisplaySrc] = useState('');
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3500';

  if (!frame) return null;

  const currentIndex = frames.findIndex(f => f.id === frame.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < frames.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      onNavigate(frames[currentIndex - 1]);
      setZoom(1);
    }
  };

  const handleNext = () => {
    if (hasNext) {
      onNavigate(frames[currentIndex + 1]);
      setZoom(1);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!frame) return;

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
  }, [frame, watermarkSettings, logoSettings, API_BASE]);

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width="80%"
      footer={null}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button icon={<LeftOutlined />} onClick={handlePrev} disabled={!hasPrev} />
          <span>图片预览 ({currentIndex + 1}/{frames.length})</span>
          <Button icon={<RightOutlined />} onClick={handleNext} disabled={!hasNext} />
        </div>
      }
    >
      <div style={{ textAlign: 'center' }}>
        <img
          src={displaySrc || `${API_BASE}${frame.url}`}
          alt="Preview"
          style={{ maxWidth: '100%', transform: `scale(${zoom})`, transition: 'transform 0.3s' }}
        />
      </div>

      <div style={{ marginTop: 16, textAlign: 'center', color: '#666' }}>
        <div>序号: {frame.index} | 截帧时间: {formatTime(frame.timestamp)}</div>
      </div>

      <Space style={{ marginTop: 16, justifyContent: 'center', width: '100%' }}>
        <Button icon={<ZoomInOutlined />} onClick={() => setZoom(z => Math.min(z + 0.2, 3))}>放大</Button>
        <Button icon={<ZoomOutOutlined />} onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}>缩小</Button>
        <Button icon={<DownloadOutlined />} onClick={() => onDownload(frame)}>下载</Button>
      </Space>
    </Modal>
  );
}
