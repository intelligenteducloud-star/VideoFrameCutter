import ImageCard from './ImageCard';

export default function ImageGrid({ frames, selectedIds, onSelect, onPreview, onDownload }) {
  if (frames.length === 0) return null;

  return (
    <div style={{ padding: 24 }}>
      <h3>🖼️ 图片展示区</h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: 16
      }}>
        {frames.map(frame => (
          <ImageCard
            key={frame.id}
            frame={frame}
            selected={selectedIds.includes(frame.id)}
            onSelect={onSelect}
            onPreview={onPreview}
            onDownload={onDownload}
          />
        ))}
      </div>
    </div>
  );
}
