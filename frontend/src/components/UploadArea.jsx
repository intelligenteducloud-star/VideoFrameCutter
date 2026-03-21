import { Upload, Progress, Button, message } from 'antd';
import { InboxOutlined, DeleteOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { uploadVideo } from '../services/api';

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
        message.error('仅支持 MP4、AVI、MOV、WMV、FLV、MKV。');
        return Upload.LIST_IGNORE;
      }

      const isLt300M = file.size / 1024 / 1024 < 300;
      if (!isLt300M) {
        message.error('视频文件不能超过 300MB。');
        return Upload.LIST_IGNORE;
      }

      return true;
    },
    customRequest: async ({ file, onSuccess, onError }) => {
      setUploading(true);
      setProgress(0);

      try {
        const response = await uploadVideo(file, setProgress);
        onSuccess(response.data);
        onUploadSuccess(response.data);
        message.success('上传成功。');
      } catch (error) {
        onError(error);
        message.error(`上传失败: ${error.response?.data?.error || error.message}`);
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
            <div style={{ fontSize: 16, marginBottom: 8 }}>{videoInfo.filename}</div>
            <div style={{ color: '#666' }}>大小: {(videoInfo.size / 1024 / 1024).toFixed(2)} MB</div>
          </div>
          <Button icon={<DeleteOutlined />} onClick={onClear}>
            清空
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Dragger {...uploadProps} disabled={uploading}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">拖拽视频到这里，或点击选择文件</p>
        <p className="ant-upload-hint">支持格式: MP4, AVI, MOV, WMV, FLV, MKV</p>
        <p className="ant-upload-hint">文件大小: 最大 300MB</p>
      </Dragger>
      {uploading && <Progress percent={progress} style={{ marginTop: 16 }} />}
    </div>
  );
}
