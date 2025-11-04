import React from 'react';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UserOutlined,
  InboxOutlined,
  FileTextOutlined,
  SettingOutlined
} from '@ant-design/icons';

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/customers',
      icon: <UserOutlined />,
      label: 'Customer Management',
    },
    {
      key: '/inventory',
      icon: <InboxOutlined />,
      label: 'Inventory Management',
    },
    {
      key: '/invoices',
      icon: <FileTextOutlined />,
      label: 'Invoice Management',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  const handleMenuClick = (e: any) => {
    navigate(e.key);
  };

  return (
    <Menu
      theme="dark"
      mode="horizontal"
      selectedKeys={[location.pathname]}
      items={menuItems}
      onClick={handleMenuClick}
      style={{ lineHeight: '64px' }}
    />
  );
};

export default Navigation;
