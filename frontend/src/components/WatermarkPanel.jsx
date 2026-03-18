import { Upload, Switch, Slider, Radio, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useState } from 'react';
import axios from 'axios';

export default function WatermarkPanel({ settings, onChange }) {
  const [fileList, setFileList] = useState([]);
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3500';

  const handleUpload = async (info) => {
    const file = info.file.originFileObj || info.file;
    const fileUrl = URL.createObjectURL(file);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE}/api/upload-asset`, formData);
      onChange({ ...settings, file, fileUrl, serverPath: response.data.filename });
      setFileList([info.file]);
      message.success('水印上传成功');
    } catch (error) {
      console.error('水印上传错误:', error);
      console.error('错误详情:', error.response?.data);
      message.error('水印上传失败: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleRemove = () => {
    if (settings.fileUrl) {
      URL.revokeObjectURL(settings.fileUrl);
    }
    onChange({ ...settings, file: null, fileUrl: null });
    setFileList([]);
  };

  const beforeUpload = (file) => {
    const isImage = file.type === 'image/png' || file.type === 'image/jpeg';
    const isLt5M = file.size / 1024 / 1024 < 5;

    if (!isImage) {
      alert('只支持PNG和JPG格式！');
      return false;
    }
    if (!isLt5M) {
      alert('图片大小不能超过5MB！');
      return false;
    }
    return false; // 阻止自动上传
  };

  return (
    <div style={{ padding: '16px', border: '1px solid #d9d9d9', borderRadius: 8, marginTop: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <Switch
          checked={settings.enabled}
          onChange={(checked) => onChange({ ...settings, enabled: checked })}
        />
        <span style={{ marginLeft: 8 }}>添加水印</span>
      </div>

      {settings.enabled && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Upload
              fileList={fileList}
              beforeUpload={beforeUpload}
              onChange={handleUpload}
              onRemove={handleRemove}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>上传水印图片 (PNG/JPG, ≤5MB)</Button>
            </Upload>
          </div>

          {settings.fileUrl && (
            <div style={{ marginBottom: 16 }}>
              <img src={settings.fileUrl} alt="水印预览" style={{ maxWidth: 100, maxHeight: 100 }} />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <Switch
              checked={settings.fullScreen}
              onChange={(checked) => onChange({ ...settings, fullScreen: checked })}
            />
            <span style={{ marginLeft: 8 }}>水印满屏</span>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div>透明度: {settings.opacity}%</div>
            <Slider
              min={0}
              max={100}
              value={settings.opacity}
              onChange={(value) => onChange({ ...settings, opacity: value })}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div>应用范围:</div>
            <Radio.Group
              value={settings.applyToAll}
              onChange={(e) => onChange({ ...settings, applyToAll: e.target.value })}
            >
              <Radio value={false}>仅当前图片</Radio>
              <Radio value={true}>应用到所有图片</Radio>
            </Radio.Group>
          </div>

          <Button onClick={() => onChange({ ...settings, fullScreen: false, opacity: 50 })}>
            重置水印设置
          </Button>
        </>
      )}
    </div>
  );
}
