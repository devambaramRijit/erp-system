import React from 'react';
import { Layout } from 'antd';
import Navigation from './Navigation';

const { Header, Content, Footer } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <Layout className="layout" style={{ minHeight: '100vh' }}>
      <Header style={{ position: 'fixed', zIndex: 1, width: '100%' }}>
        <div className="logo" style={{ float: 'left', color: 'white', fontSize: '18px', marginRight: '20px' }}>
          ErpSoul
        </div>
        <Navigation />
      </Header>
      <Content style={{ padding: '0 50px', marginTop: 64 }}>
        <div style={{ padding: '24px', minHeight: 380, background: '#fff' }}>
          {children}
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        ErpSoul ©{new Date().getFullYear()} Created by Your Team
      </Footer>
    </Layout>
  );
};

export default MainLayout;
