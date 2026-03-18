import { InputNumber, Radio, Button, Space, Collapse } from 'antd';
import WatermarkPanel from './WatermarkPanel';
import LogoPanel from './LogoPanel';

export default function SettingsPanel({
  settings,
  onChange,
  watermarkSettings,
  onWatermarkChange,
  logoSettings,
  onLogoChange,
  onExtract,
  onReset,
  disabled
}) {
  return (
    <div style={{ padding: 24, background: '#fff', borderRadius: 8 }}>
      <h3>⚙️ 截帧参数设置</h3>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <label>截取数量: </label>
          <InputNumber
            min={1}
            max={50}
            value={settings.count}
            onChange={(v) => onChange({ ...settings, count: v })}
            disabled={disabled}
          /> 张
        </div>

        <div>
          <label>图片质量: </label>
          <Radio.Group
            value={settings.quality}
            onChange={(e) => onChange({ ...settings, quality: e.target.value })}
            disabled={disabled}
          >
            <Radio value="low">低质量</Radio>
            <Radio value="medium">中质量</Radio>
            <Radio value="high">高质量</Radio>
          </Radio.Group>
        </div>

        <div>
          <label>图片格式: </label>
          <Radio.Group
            value={settings.format}
            onChange={(e) => onChange({ ...settings, format: e.target.value })}
            disabled={disabled}
          >
            <Radio value="jpg">JPG</Radio>
            <Radio value="png">PNG</Radio>
          </Radio.Group>
        </div>

        <div>
          <label>分辨率: </label>
          <Radio.Group
            value={settings.resolution}
            onChange={(e) => onChange({ ...settings, resolution: e.target.value })}
            disabled={disabled}
          >
            <Radio value="original">保持原视频</Radio>
            <Radio value="720p">720P</Radio>
            <Radio value="1080p">1080P</Radio>
          </Radio.Group>
        </div>

        <Space>
          <Button type="primary" onClick={onExtract} disabled={disabled}>
            🚀 开始截取
          </Button>
          <Button onClick={onReset}>🔄 清空重置</Button>
        </Space>

        <Collapse
          items={[
            {
              key: 'watermark',
              label: '🎨 水印设置',
              children: <WatermarkPanel settings={watermarkSettings} onChange={onWatermarkChange} />
            },
            {
              key: 'logo',
              label: '🏷️ Logo设置',
              children: <LogoPanel settings={logoSettings} onChange={onLogoChange} />
            }
          ]}
        />
      </Space>
    </div>
  );
}
