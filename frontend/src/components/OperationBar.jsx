import { Checkbox, Button, Space, Input, Modal, message } from 'antd';
import { useState } from 'react';
import { saveAs } from 'file-saver';

export default function OperationBar({ frames, selectedIds, onSelectChange, onDownload }) {
  const [zipModalVisible, setZipModalVisible] = useState(false);
  const [zipName, setZipName] = useState('');

  const allSelected = frames.length > 0 && selectedIds.length === frames.length;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      onSelectChange(frames.map(f => f.id));
    } else {
      onSelectChange([]);
    }
  };

  const handleBatchDownload = () => {
    if (selectedIds.length === 0) {
      message.warning('请先选择要下载的图片');
      return;
    }
    const defaultName = `截帧_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)}`;
    setZipName(defaultName);
    setZipModalVisible(true);
  };

  const confirmDownload = () => {
    onDownload(selectedIds, zipName);
    setZipModalVisible(false);
  };

  if (frames.length === 0) return null;

  return (
    <div style={{ padding: 16, background: '#fff', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Space>
        <Checkbox checked={allSelected} onChange={handleSelectAll}>全选</Checkbox>
        <span>已选择: {selectedIds.length}/{frames.length} 张</span>
      </Space>
      <Space>
        <Button type="primary" onClick={handleBatchDownload}>📥 批量下载选中</Button>
      </Space>

      <Modal
        title="自定义ZIP文件名"
        open={zipModalVisible}
        onOk={confirmDownload}
        onCancel={() => setZipModalVisible(false)}
      >
        <Input
          value={zipName}
          onChange={(e) => setZipName(e.target.value)}
          placeholder="输入ZIP文件名"
          suffix=".zip"
        />
      </Modal>
    </div>
  );
}
