import React, { useState, useEffect } from 'react';
import { Typography, Card, Spin, Button, Empty, Alert, Avatar, Dropdown, Space } from 'antd';
import VersionNotes from './VersionNotes';
import { ArrowLeftOutlined, LoadingOutlined, UserOutlined, LoginOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;
const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

interface ImageHistoryRecord {
  timestamp: string;
  user: string;
  prompt: string;
  imageUrls: string[];
}

const ImageHistory: React.FC = () => {
  const navigate = useNavigate();
  const versionNotes = import.meta.env.VersionNotes || '暂无版本信息';
  const { currentUser, isGuest, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [imageHistory, setImageHistory] = useState<ImageHistoryRecord[]>([]);

  useEffect(() => {
    fetchImageHistory();
  }, []);

  const fetchImageHistory = async () => {
    try {
      if (!currentUser) {
        setImageHistory([]);
        return;
      }
      const response = await fetch(`http://localhost:3001/api/image-history/get?username=${currentUser.username}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setImageHistory(data);
    } catch (error) {
      console.error('获取图片历史记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (isGuest) {
    return (
      <div className="min-h-screen p-4 bg-gradient-to-b from-black via-gray-900 to-black">
        <div className="max-w-4xl mx-auto space-y-6 relative z-10 p-8">
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/generator')}
            className="text-gray-300 hover:text-white"
          >
            返回
          </Button>
          <Alert
            message="Only logged-in users can view history"
            type="warning"
            showIcon
            className="mt-8"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-b from-black via-gray-900 to-black">
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
      <div className="max-w-4xl mx-auto space-y-6 relative z-10 p-8">
        <div className="flex justify-between items-center mb-8">
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => {
              console.log('从图片历史页面返回，设置preserveState为true');
              navigate('/generator', { replace: false, state: { preserveState: true } });
            }}
            className="text-gray-300 hover:text-white"
          >
            返回
          </Button>
          <Title level={3} className="text-center text-gray-300 m-0">图片历史记录</Title>
          {!isGuest && <div className="text-gray-300 text-center mt-2">Save up to the most recent 5 generations</div>}
          <div style={{ width: 32 }}></div> {/* 占位元素，保持标题居中 */}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spin indicator={antIcon} />
          </div>
        ) : imageHistory.length === 0 ? (
          <Empty description="暂无图片历史记录" className="text-gray-300" />
        ) : (
          <div className="space-y-8">
            {imageHistory.map((record, recordIndex) => (
              <Card 
                key={recordIndex} 
                className="bg-gray-800 text-gray-300 border-gray-700"
                title={
                  <div className="flex justify-between items-center">
                    <span>生成时间: {formatDate(record.timestamp)}</span>
                    <span>用户: {record.user}</span>
                  </div>
                }
              >
                <div className="mb-4">
                  <Text strong className="text-gray-300">提示词:</Text>
                  <div className="p-3 bg-gray-900 rounded mt-2">
                    <Text className="text-gray-300">{record.prompt}</Text>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {record.imageUrls.map((url, imgIndex) => (
                    <div key={imgIndex} className="aspect-video bg-gray-900 rounded overflow-hidden">
                      <img 
                        src={url} 
                        alt={`生成图片 ${imgIndex + 1}`} 
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/400x225?text=图片加载失败';
                        }}
                      />
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageHistory;