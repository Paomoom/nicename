import React from 'react';
import { Layout, Typography } from 'antd';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import NameGenerator from './components/NameGenerator';
import Home from './components/Home';
import ImageHistory from './components/ImageHistory';
import Login from './components/Login';
import Register from './components/Register';
import UserProfile from './components/UserProfile';
import Suggestion from './components/Suggestion';
import { AuthProvider } from './contexts/AuthContext';

const { Content, Footer } = Layout;

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#f5222d',
            fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif',
          },
        }}
      >
        <Layout className="min-h-screen">
          <Content className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/generator" element={<NameGenerator />} />
              <Route path="/image-history" element={<ImageHistory />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<UserProfile />} />
              <Route path="/suggestion" element={<Suggestion />} />
            </Routes>
          </Content>
          <Footer style={{ textAlign: 'center' }}>
            Chinese Name Generator ©{new Date().getFullYear()}
          </Footer>
        </Layout>
      </ConfigProvider>
    </AuthProvider>
  );
};

export default App;