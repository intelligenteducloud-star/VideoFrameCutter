import { Card, Checkbox, Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';

export default function ImageCard({ frame, selected, onSelect, onPreview, onDownload }) {
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3500';

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

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
        src={`${API_BASE}${frame.url}`}
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
