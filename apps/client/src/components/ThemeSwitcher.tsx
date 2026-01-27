import React from 'react';
import { Dropdown, Button, Space } from 'antd';
import { DownOutlined, BgColorsOutlined } from '@ant-design/icons';
import { useTheme, availableColors } from '../styles/DesignSystem';

const ThemeSwitcher: React.FC = () => {
  const { setPrimaryColor } = useTheme();

  const handleColorChange = (color: string) => {
    setPrimaryColor(availableColors[color]);
  };

  const menuItems = Object.keys(availableColors).map(color => ({
    key: color,
    label: (
      <div style={{ display: 'flex', alignItems: 'center' }} onClick={() => handleColorChange(color)}>
        <div style={{
          width: '16px',
          height: '16px',
          backgroundColor: availableColors[color],
          marginRight: '8px',
          borderRadius: '2px',
          border: '1px solid #ccc',
        }} />
        {color.charAt(0).toUpperCase() + color.slice(1)}
      </div>
    ),
  }));

  return (
    <Dropdown menu={{ items: menuItems }} trigger={['click']}>
      <Button icon={<BgColorsOutlined />}>
        <Space>
          Theme
          <DownOutlined />
        </Space>
      </Button>
    </Dropdown>
  );
};

export default ThemeSwitcher;
