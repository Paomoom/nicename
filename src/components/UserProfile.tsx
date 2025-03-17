import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Card, Avatar, Space } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  // 如果没有用户登录，重定向到首页
  React.useEffect(() => {
    if (!currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const onFinish = async (values: { nickname: string; email: string; password: string; confirmPassword: string }) => {
    if (values.password && values.password !== values.confirmPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      // 这里应该是实际的API调用来更新用户信息
      // 目前简单模拟，实际项目中应该连接后端API
      
      // 模拟从localStorage获取用户数据
      const usersJson = localStorage.getItem('users') || '[]';
      const users = JSON.parse(usersJson);
      
      const userIndex = users.findIndex((u: any) => u.id === currentUser?.id);
      
      if (userIndex !== -1) {
        // 更新用户信息
        const updatedUser = {
          ...users[userIndex],
          nickname: values.nickname,
          email: values.email,
        };
        
        // 如果提供了新密码，则更新密码
        if (values.password) {
          updatedUser.password = values.password;
        }
        
        users[userIndex] = updatedUser;
        localStorage.setItem('users', JSON.stringify(users));
        
        // 更新当前用户信息（不包含密码）
        const { password, ...userWithoutPassword } = updatedUser;
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        
        message.success('个人资料更新成功');
      } else {
        message.error('用户不存在');
      }
    } catch (error) {
      console.error('更新个人资料失败:', error);
      message.error('更新个人资料失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return null; // 等待重定向
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/')}
          className="mb-4"
        >
          返回首页
        </Button>
        
        <Card className="bg-gray-800 border-gray-700">
          <div className="text-center mb-6">
            <Space direction="vertical" size="large" align="center">
              <Avatar 
                size={80} 
                src={currentUser.avatar || undefined}
                icon={!currentUser.avatar && <UserOutlined />}
              />
              <Title level={2} className="text-white m-0">个人资料</Title>
              <Text className="text-gray-400">管理您的账户信息</Text>
            </Space>
          </div>
          
          <Form
            name="profile"
            initialValues={{
              username: currentUser.username,
              nickname: currentUser.nickname || currentUser.username,
              email: currentUser.email || '',
              points: currentUser.points || 0,
            }}
            onFinish={onFinish}
            layout="vertical"
          >
            <Form.Item
              label={<span className="text-gray-300">用户名</span>}
              name="username"
            >
              <Input disabled />
            </Form.Item>

            <Form.Item
              label={<span className="text-gray-300">昵称</span>}
              name="nickname"
              rules={[{ required: true, message: '请输入您的昵称' }]}
            >
              <Input prefix={<UserOutlined />} />
            </Form.Item>

            <Form.Item
              label={<span className="text-gray-300">邮箱</span>}
              name="email"
              rules={[
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input prefix={<MailOutlined />} />
            </Form.Item>

            <Form.Item
              label={<span className="text-gray-300">积分</span>}
              name="points"
            >
              <Input disabled />
            </Form.Item>

            <Form.Item
              label={<span className="text-gray-300">新密码</span>}
              name="password"
            >
              <Input.Password prefix={<LockOutlined />} placeholder="留空表示不修改" />
            </Form.Item>

            <Form.Item
              label={<span className="text-gray-300">确认新密码</span>}
              name="confirmPassword"
            >
              <Input.Password prefix={<LockOutlined />} placeholder="留空表示不修改" />
            </Form.Item>

            <Form.Item>
              <Space className="w-full justify-between">
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                >
                  保存更改
                </Button>
                <Button 
                  danger 
                  onClick={() => {
                    logout();
                    navigate('/');
                    message.success('已退出登录');
                  }}
                >
                  退出登录
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;