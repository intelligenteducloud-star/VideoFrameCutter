import { useState, useEffect } from 'react';
import { Layout, Progress, message } from 'antd';
import { socket } from './services/api';
import UploadArea from './components/UploadArea';
import SettingsPanel from './components/SettingsPanel';
import OperationBar from './components/OperationBar';
import ImageGrid from './components/ImageGrid';
import PreviewModal from './components/PreviewModal';
import axios from 'axios';
import './App.css';

const { Header, Content } = Layout;

function App() {
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3500';

  const [videoInfo, setVideoInfo] = useState(null);
  const [settings, setSettings] = useState({
    count: 10,
    quality: 'medium',
    format: 'jpg',
    resolution: 'original'
  });
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState({ stage: '', progress: 0, message: '' });
  const [frames, setFrames] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [previewFrame, setPreviewFrame] = useState(null);

  useEffect(() => {
    socket.on('progress', (data) => {
      setProgress(data);
    });

    return () => socket.off('progress');
  }, []);

  const handleUploadSuccess = (data) => {
    setVideoInfo(data);
  };

  const handleExtract = async () => {
    if (!videoInfo) {
      message.error('请先上传视频');
      return;
    }

    setExtracting(true);
    setFrames([]);
    setSelectedIds([]);

    try {
      const response = await axios.post(`${API_BASE}/api/extract`, {
        videoId: videoInfo.videoId,
        ...settings,
        socketId: socket.id
      });

      if (response.data.success) {
        setFrames(response.data.frames);
        message.success('截帧完成！');
      }
    } catch (error) {
      message.error('截帧失败: ' + error.message);
    } finally {
      setExtracting(false);
    }
  };

  const handleReset = () => {
    setVideoInfo(null);
    setFrames([]);
    setSelectedIds([]);
    setProgress({ stage: '', progress: 0, message: '' });
  };

  const handleSelect = (id, checked) => {
    setSelectedIds(prev =>
      checked ? [...prev, id] : prev.filter(i => i !== id)
    );
  };

  const handleDownloadSingle = async (frame) => {
    try {
      const response = await fetch(`${API_BASE}${frame.url}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `frame_${frame.index}.${settings.format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error('下载失败');
    }
  };

  const handleDownloadBatch = async (ids, zipName) => {
    try {
      const response = await axios.post(`${API_BASE}/api/download`,
        { frameIds: ids, zipName },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${zipName}.zip`;
      link.click();
      window.URL.revokeObjectURL(url);
      message.success('下载成功');
    } catch (error) {
      message.error('下载失败');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header style={{ background: '#fff', textAlign: 'center', fontSize: 24, fontWeight: 'bold' }}>
        视频智能截帧工具
      </Header>
      <Content style={{ padding: 24, maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        <UploadArea
          onUploadSuccess={handleUploadSuccess}
          videoInfo={videoInfo}
          onClear={handleReset}
        />

        {videoInfo && (
          <div style={{ marginTop: 24 }}>
            <SettingsPanel
              settings={settings}
              onChange={setSettings}
              onExtract={handleExtract}
              onReset={handleReset}
              disabled={extracting}
            />
          </div>
        )}

        {extracting && (
          <div style={{ marginTop: 24, padding: 24, background: '#fff', borderRadius: 8 }}>
            <Progress percent={progress.progress} />
            <div style={{ marginTop: 8, textAlign: 'center' }}>{progress.message}</div>
          </div>
        )}

        {frames.length > 0 && (
          <>
            <div style={{ marginTop: 24 }}>
              <OperationBar
                frames={frames}
                selectedIds={selectedIds}
                onSelectChange={setSelectedIds}
                onDownload={handleDownloadBatch}
              />
            </div>
            <ImageGrid
              frames={frames}
              selectedIds={selectedIds}
              onSelect={handleSelect}
              onPreview={setPreviewFrame}
              onDownload={handleDownloadSingle}
            />
          </>
        )}

        <PreviewModal
          visible={!!previewFrame}
          frame={previewFrame}
          frames={frames}
          onClose={() => setPreviewFrame(null)}
          onNavigate={setPreviewFrame}
          onDownload={handleDownloadSingle}
        />
      </Content>
    </Layout>
  );
}

export default App;
