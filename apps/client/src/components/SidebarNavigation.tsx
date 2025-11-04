
import React, { useState } from 'react';
import { Layout, Menu, Badge, Avatar, Dropdown, Space, Typography, Button, Drawer } from 'antd';
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  CustomerServiceOutlined,
  InboxOutlined,
  HomeOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  TeamOutlined,
  FileSearchOutlined,
  ImportOutlined,
  ExportOutlined,
  UserAddOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { colors, spacing, borderRadius } from '../styles/DesignSystem';

const { Header, Sider } = Layout;
const { Text } = Typography;

interface SidebarNavigationProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  onLogout: () => void;
}

const SidebarNavigation: React.FC<SidebarNavigationProps> = ({ user, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get the current path to determine active menu item
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'dashboard';
    if (path.includes('inventory')) return 'inventory';
    if (path.includes('invoice')) return 'invoice';
    if (path.includes('customers')) return 'customers';
    return 'dashboard';
  };

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => {
        navigate('/dashboard');
        setMobileDrawerVisible(false);
      },
    },
    {
      key: 'inventory',
      icon: <InboxOutlined />,
      label: 'Inventory',
      children: [
        {
          key: 'inventory-list',
          icon: <AppstoreOutlined />,
          label: 'Product List',
          onClick: () => {
            navigate('/inventory');
            setMobileDrawerVisible(false);
          },
        },
        {
          key: 'inventory-management',
          icon: <DatabaseOutlined />,
          label: 'Inventory Management',
          onClick: () => {
            navigate('/inventory-management');
            setMobileDrawerVisible(false);
          },
        },
      ],
    },
    {
      key: 'invoice',
      icon: <FileTextOutlined />,
      label: 'Invoices',
      children: [
        {
          key: 'invoice-generation',
          icon: <FileSearchOutlined />,
          label: 'Generate Invoice',
          onClick: () => {
            navigate('/invoice');
            setMobileDrawerVisible(false);
          },
        },
        {
          key: 'invoice-list',
          icon: <BarChartOutlined />,
          label: 'Invoice History',
          onClick: () => {
            navigate('/invoice-history');
            setMobileDrawerVisible(false);
          },
        },
      ],
    },
    {
      key: 'customers',
      icon: <CustomerServiceOutlined />,
      label: 'Customers',
      children: [
        {
          key: 'customer-list',
          icon: <TeamOutlined />,
          label: 'Customer List',
          onClick: () => {
            navigate('/customers');
            setMobileDrawerVisible(false);
          },
        },
        {
          key: 'add-customer',
          icon: <UserAddOutlined />,
          label: 'Add Customer',
          onClick: () => {
            navigate('/customers/add');
            setMobileDrawerVisible(false);
          },
        },
        {
          key: 'import-customers',
          icon: <ImportOutlined />,
          label: 'Import Customers',
          onClick: () => {
            navigate('/customers/import');
            setMobileDrawerVisible(false);
          },
        },
        {
          key: 'export-customers',
          icon: <ExportOutlined />,
          label: 'Export Customers',
          onClick: () => {
            navigate('/customers/export');
            setMobileDrawerVisible(false);
          },
        },
      ],
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: onLogout,
    },
  ];

  const toggleMobileDrawer = () => {
    setMobileDrawerVisible(!mobileDrawerVisible);
  };

  const renderSidebar = (mobile = false) => (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: colors.secondary[800],
    }}>
      <div style={{ 
        height: '64px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: spacing[4],
        borderBottom: `1px solid ${colors.secondary[700]}`,
      }}>
        {collapsed && !mobile ? (
          <div style={{ 
            width: '32px', 
            height: '32px', 
            backgroundColor: colors.primary[500], 
            borderRadius: borderRadius.md,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
          }}>
            ES
          </div>
        ) : (
          <Text style={{ 
            color: 'white', 
            fontSize: '20px', 
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
          }}>
            ErpSoul
          </Text>
        )}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        items={menuItems}
        style={{ 
          borderRight: 0,
          backgroundColor: colors.secondary[800],
          flex: 1,
        }}
      />
      <div style={{ 
        padding: spacing[4],
        borderTop: `1px solid ${colors.secondary[700]}`,
        display: 'flex',
        justifyContent: 'center',
      }}>
        {mobile ? (
          <Button 
            type="primary" 
            onClick={toggleMobileDrawer}
            style={{ width: '100%' }}
          >
            Close Menu
          </Button>
        ) : (
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ 
              color: 'white',
              fontSize: '16px',
              width: 40,
              height: 40,
            }}
          />
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          backgroundColor: colors.secondary[800],
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
          display: 'none',
        }}
        className="desktop-sidebar"
        breakpoint="lg"
        onBreakpoint={(broken) => {
          if (broken) {
            setCollapsed(true);
          }
        }}
      >
        {renderSidebar()}
      </Sider>

      {/* Mobile Header */}
      <Header style={{ 
        padding: '0 16px', 
        background: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button
            type="text"
            icon={<MenuFoldOutlined />}
            onClick={toggleMobileDrawer}
            style={{ 
              fontSize: '16px',
              width: 40,
              height: 40,
              marginRight: spacing[2],
            }}
            className="mobile-menu-button"
          />
          <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {menuItems.find(item => item.key === getSelectedKey())?.label || 'Dashboard'}
          </Text>
        </div>
        <Space size="large">
          <Badge count={5} size="small">
            <Button 
              type="text" 
              icon={<BellOutlined />} 
              style={{ fontSize: '18px' }}
            />
          </Badge>
          <Dropdown 
            menu={{ items: userMenuItems }} 
            placement="bottomRight"
            arrow
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              padding: spacing[1],
              borderRadius: borderRadius.full,
            }}>
              <Avatar style={{ backgroundColor: colors.primary[500] }} icon={<UserOutlined />} />
              <div style={{ marginLeft: spacing[2] }}>
                <Text style={{ display: 'block', fontWeight: 'bold' }}>{user.name}</Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>{user.role}</Text>
              </div>
            </div>
          </Dropdown>
        </Space>
      </Header>

      {/* Mobile Drawer */}
      <Drawer
        title="Navigation"
        placement="left"
        onClose={toggleMobileDrawer}
        open={mobileDrawerVisible}
        bodyStyle={{ padding: 0 }}
        width={250}
        className="mobile-drawer"
      >
        {renderSidebar(true)}
      </Drawer>

      {/* Responsive Styles */}
      <style jsx>{`
        @media (min-width: 992px) {
          .desktop-sidebar {
            display: block !important;
          }
          .mobile-menu-button {
            display: none !important;
          }
        }
        @media (max-width: 991px) {
          .desktop-sidebar {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default SidebarNavigation;
