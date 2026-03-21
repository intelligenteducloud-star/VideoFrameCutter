import { Checkbox, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../services/api';
import { renderFrameWithEffects } from '../services/imageEffects';

export default function ImageCard({
  frame,
  selected,
  onSelect,
  onPreview,
  onDownload,
  watermarkSettings,
  logoSettings
}) {
  const [displaySrc, setDisplaySrc] = useState(`${API_BASE_URL}${frame.url}`);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  useEffect(() => {
    let active = true;

    renderFrameWithEffects(frame.url, watermarkSettings, logoSettings, 'all')
      .then((src) => {
        if (active) {
          setDisplaySrc(src);
        }
      })
      .catch(() => {
        if (active) {
          setDisplaySrc(`${API_BASE_URL}${frame.url}`);
        }
      });

    return () => {
      active = false;
    };
  }, [frame.url, watermarkSettings, logoSettings]);

  return (
    <div
      style={{
        border: '1px solid #d9d9d9',
        borderRadius: 8,
        overflow: 'hidden',
        background: '#fff',
        marginBottom: 16
      }}
    >
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
          <Checkbox checked={selected} onChange={(event) => onSelect(frame.id, event.target.checked)} />
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDownload(frame);
            }}
          />
        </div>
      </div>
    </div>
  );
}
