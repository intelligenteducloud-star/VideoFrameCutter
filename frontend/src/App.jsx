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
  const [watermarkSettings, setWatermarkSettings] = useState({
    enabled: false,
    file: null,
    fileUrl: null,
    fullScreen: false,
    opacity: 50,
    applyToAll: true
  });
  const [logoSettings, setLogoSettings] = useState({
    enabled: false,
    file: null,
    fileUrl: null,
    positionX: 90,
    positionY: 10,
    opacity: 80,
    size: 10,
    applyToAll: true
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
      const hasWatermark = watermarkSettings?.enabled && watermarkSettings?.fileUrl;
      const hasLogo = logoSettings?.enabled && logoSettings?.fileUrl;

      if (!hasWatermark && !hasLogo) {
        const response = await fetch(`${API_BASE}${frame.url}`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `frame_${frame.index}.${settings.format}`;
        link.click();
        window.URL.revokeObjectURL(url);
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

        canvas.toBlob((blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `frame_${frame.index}.${settings.format}`;
          link.click();
          window.URL.revokeObjectURL(url);
        }, `image/${settings.format}`);
      };
    } catch (error) {
      message.error('下载失败');
    }
  };

  const handleDownloadBatch = async (ids, zipName) => {
    try {
      const response = await axios.post(`${API_BASE}/api/download`,
        {
          frameIds: ids,
          zipName,
          watermark: watermarkSettings.enabled ? {
            serverPath: watermarkSettings.serverPath,
            fullScreen: watermarkSettings.fullScreen,
            opacity: watermarkSettings.opacity
          } : null,
          logo: logoSettings.enabled ? {
            serverPath: logoSettings.serverPath,
            positionX: logoSettings.positionX,
            positionY: logoSettings.positionY,
            opacity: logoSettings.opacity,
            size: logoSettings.size
          } : null
        },
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
              watermarkSettings={watermarkSettings}
              onWatermarkChange={setWatermarkSettings}
              logoSettings={logoSettings}
              onLogoChange={setLogoSettings}
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
              watermarkSettings={watermarkSettings}
              logoSettings={logoSettings}
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
          watermarkSettings={watermarkSettings}
          logoSettings={logoSettings}
        />
      </Content>
    </Layout>
  );
}

export default App;
