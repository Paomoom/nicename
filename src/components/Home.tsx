import React from 'react';
import { Card, Button, Space, Typography, Avatar, Dropdown } from 'antd';
import VersionNotes from './VersionNotes';
import { TranslationOutlined, UserOutlined, LoginOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title } = Typography;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const versionNotes = import.meta.env.VersionNotes || '暂无版本信息';
  const { currentUser, isGuest, logout, assignGuestId } = useAuth();

  return (
    <>
      <VersionNotes versionNotes={versionNotes} />
      
      {/* 用户认证按钮 */}
      <div className="absolute top-4 right-4 z-20">
        {currentUser ? (
          <Dropdown
            menu={{
              items: [
                {
                  key: 'profile',
                  icon: <SettingOutlined />,
                  label: '个人资料',
                  onClick: () => navigate('/profile')
                },
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: '退出登录',
                  onClick: () => {
                    logout();
                    localStorage.removeItem('nameGeneratorState');
                    navigate('/');
                  }
                }
              ]
            }}
            placement="bottomRight"
          >
            <Space className="cursor-pointer">
              <Avatar 
                src={currentUser.avatar} 
                icon={!currentUser.avatar && <UserOutlined />}
              />
              <span className="text-white">
                {isGuest ? '游客' : currentUser.nickname || currentUser.username}
                {isGuest && <small className="ml-1 text-gray-400">({currentUser.username})</small>}
              </span>
            </Space>
          </Dropdown>
        ) : (
          <Space>
            <Button 
              type="primary" 
              icon={<LoginOutlined />}
              onClick={() => navigate('/login')}
            >
              登录
            </Button>
            <Button 
              icon={<UserOutlined />}
              onClick={() => navigate('/register')}
            >
              注册
            </Button>
          </Space>
        )}
      </div>
      
      <div className="flex items-center justify-center min-h-screen">
        <Space direction="vertical" size="large" className="w-full -mt-32">
          <Card className="text-center max-w-lg mx-auto">
            <Title level={2}>中文名生成器</Title>
            <Button 
              type="primary" 
              size="large"
              icon={<TranslationOutlined />}
              onClick={() => {
                if (currentUser) {
                  navigate('/generator');
                } else {
                  assignGuestId();
                  navigate('/generator');
                }
              }}
            >
              开始生成
            </Button>
          </Card>
        </Space>
      </div>
    </>
  );
};

export default Home;