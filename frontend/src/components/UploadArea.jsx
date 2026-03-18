import { Upload, Progress, Button, message } from 'antd';
import { InboxOutlined, DeleteOutlined } from '@ant-design/icons';
import { useState } from 'react';

const { Dragger } = Upload;

export default function UploadArea({ onUploadSuccess, videoInfo, onClear }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadProps = {
    name: 'video',
    multiple: false,
    accept: '.mp4,.avi,.mov,.wmv,.flv,.mkv',
    beforeUpload: (file) => {
      const isVideo = /\.(mp4|avi|mov|wmv|flv|mkv)$/i.test(file.name);
      if (!isVideo) {
        message.error('只支持 MP4, AVI, MOV, WMV, FLV, MKV 格式');
        return false;
      }
      const isLt200M = file.size / 1024 / 1024 < 200;
      if (!isLt200M) {
        message.error('视频文件不能超过 200MB');
        return false;
      }
      return true;
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      setUploading(true);
      const formData = new FormData();
      formData.append('video', file);

      try {
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3500';
        const response = await fetch(`${API_BASE}/api/upload`, {
          method: 'POST',
          body: formData
        });
        const data = await response.json();

        if (data.success) {
          onSuccess(data);
          onUploadSuccess(data);
          message.success('上传成功');
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
        onError(error);
        message.error('上传失败');
      } finally {
        setUploading(false);
      }
    },
    showUploadList: false
  };

  if (videoInfo) {
    return (
      <div style={{ padding: 24, background: '#fff', borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 16, marginBottom: 8 }}>✅ {videoInfo.filename}</div>
            <div style={{ color: '#666' }}>
              大小: {(videoInfo.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
          <Button icon={<DeleteOutlined />} onClick={onClear}>删除</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Dragger {...uploadProps} disabled={uploading}>
        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
        <p className="ant-upload-text">拖拽视频文件到此处或点击选择</p>
        <p className="ant-upload-hint">支持格式: MP4, AVI, MOV, WMV, FLV, MKV</p>
        <p className="ant-upload-hint">文件大小: 最大 200MB</p>
      </Dragger>
      {uploading && <Progress percent={progress} style={{ marginTop: 16 }} />}
    </div>
  );
}
