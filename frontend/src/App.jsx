import { useEffect, useState } from 'react';
import { Layout, Progress, message } from 'antd';
import axios from 'axios';
import { API_BASE_URL, buildAssetUrl, downloadZip, socket } from './services/api';
import { hasAnyEffect, renderFrameWithEffects } from './services/imageEffects';
import UploadArea from './components/UploadArea';
import SettingsPanel from './components/SettingsPanel';
import OperationBar from './components/OperationBar';
import ImageGrid from './components/ImageGrid';
import PreviewModal from './components/PreviewModal';
import './App.css';

const { Header, Content } = Layout;

const defaultWatermarkSettings = {
  enabled: false,
  file: null,
  fileUrl: null,
  serverPath: null,
  fullScreen: false,
  opacity: 50,
  applyToAll: true
};

const defaultLogoSettings = {
  enabled: false,
  file: null,
  fileUrl: null,
  serverPath: null,
  positionX: 90,
  positionY: 10,
  opacity: 80,
  size: 10,
  applyToAll: true
};

function App() {
  const [videoInfo, setVideoInfo] = useState(null);
  const [settings, setSettings] = useState({
    count: 10,
    quality: 'medium',
    format: 'jpg',
    resolution: 'original'
  });
  const [watermarkSettings, setWatermarkSettings] = useState(defaultWatermarkSettings);
  const [logoSettings, setLogoSettings] = useState(defaultLogoSettings);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState({ stage: '', progress: 0, message: '' });
  const [frames, setFrames] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [previewFrame, setPreviewFrame] = useState(null);

  useEffect(() => {
    const handleProgress = (payload) => setProgress(payload);
    socket.on('progress', handleProgress);
    return () => socket.off('progress', handleProgress);
  }, []);

  const readBlobError = async (error) => {
    const payload = error?.response?.data;
    if (!(payload instanceof Blob)) {
      return payload?.error || error.message;
    }

    try {
      const text = await payload.text();
      const parsed = JSON.parse(text);
      return parsed.error || error.message;
    } catch {
      return error.message;
    }
  };

  const handleExtract = async () => {
    if (!videoInfo) {
      message.error('请先上传视频。');
      return;
    }

    setExtracting(true);
    setFrames([]);
    setSelectedIds([]);

    try {
      const response = await axios.post(API_BASE_URL ? `${API_BASE_URL}/api/extract` : '/api/extract', {
        videoId: videoInfo.videoId,
        ...settings,
        socketId: socket.id
      });

      if (response.data.success) {
        setFrames(response.data.frames);
        message.success('截帧完成。');
      }
    } catch (error) {
      message.error(`截帧失败: ${error.response?.data?.error || error.message}`);
    } finally {
      setExtracting(false);
    }
  };

  const handleReset = () => {
    setVideoInfo(null);
    setFrames([]);
    setSelectedIds([]);
    setPreviewFrame(null);
    setProgress({ stage: '', progress: 0, message: '' });
    setWatermarkSettings(defaultWatermarkSettings);
    setLogoSettings(defaultLogoSettings);
  };

  const handleSelect = (id, checked) => {
    setSelectedIds((current) => (checked ? [...current, id] : current.filter((item) => item !== id)));
  };

  const downloadBlob = (blob, fileName) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadSingle = async (frame) => {
    try {
      if (!hasAnyEffect(watermarkSettings, logoSettings, 'single')) {
        const response = await fetch(buildAssetUrl(frame.url));
        const blob = await response.blob();
        downloadBlob(blob, `frame_${frame.index}.${settings.format}`);
        return;
      }

      const dataUrl = await renderFrameWithEffects(frame.url, watermarkSettings, logoSettings, 'single');
      const blob = await fetch(dataUrl).then((response) => response.blob());
      downloadBlob(blob, `frame_${frame.index}.${settings.format}`);
    } catch {
      message.error('下载失败。');
    }
  };

  const handleDownloadBatch = async (ids, zipName) => {
    try {
      const response = await downloadZip({
        frameIds: ids,
        zipName,
        watermark:
          watermarkSettings.enabled && watermarkSettings.applyToAll
            ? {
                serverPath: watermarkSettings.serverPath,
                fullScreen: watermarkSettings.fullScreen,
                opacity: watermarkSettings.opacity
              }
            : null,
        logo:
          logoSettings.enabled && logoSettings.applyToAll
            ? {
                serverPath: logoSettings.serverPath,
                positionX: logoSettings.positionX,
                positionY: logoSettings.positionY,
                opacity: logoSettings.opacity,
                size: logoSettings.size
              }
            : null
      });

      downloadBlob(new Blob([response.data]), `${zipName}.zip`);
      message.success('下载成功。');
    } catch (error) {
      const errorMessage = await readBlobError(error);
      message.error(`下载失败: ${errorMessage}`);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Header style={{ background: '#fff', textAlign: 'center', fontSize: 24, fontWeight: 'bold' }}>
        视频智能截帧工具
      </Header>
      <Content style={{ padding: 24, maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        <UploadArea onUploadSuccess={setVideoInfo} videoInfo={videoInfo} onClear={handleReset} />

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
          visible={Boolean(previewFrame)}
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
