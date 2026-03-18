import { Modal, Button, Space } from 'antd';
import { LeftOutlined, RightOutlined, ZoomInOutlined, ZoomOutOutlined, DownloadOutlined } from '@ant-design/icons';
import { useState } from 'react';

export default function PreviewModal({ visible, frame, frames, onClose, onDownload, onNavigate }) {
  const [zoom, setZoom] = useState(1);
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
          src={`${API_BASE}${frame.url}`}
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
