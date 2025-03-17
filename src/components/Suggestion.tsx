import React, { useState, useEffect } from 'react';
import { Input, Button, List, Typography, Avatar, Space, message } from 'antd';
import VersionNotes from './VersionNotes';
import { UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface Suggestion {
  id: string;
  username: string;
  content: string;
  timestamp: string;
}

const Suggestion: React.FC = () => {
  const navigate = useNavigate();
  const versionNotes = import.meta.env.VersionNotes || '暂无版本信息';
  const { currentUser } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // 获取建议列表
  const fetchSuggestions = async () => {
    try {
      const response = await axios.get('/api/suggestions', {
        params: { page: currentPage, pageSize: 20 }
      });
      setSuggestions(response.data);
    } catch (error) {
      console.error('获取建议列表失败:', error);
      message.error('获取建议列表失败');
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [currentPage]);

  // 提交建议
  const handleSubmit = async () => {
    if (!content.trim()) {
      message.warning('请输入建议内容');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/api/suggestions', {
        content,
        username: currentUser?.username || '游客'
      });
      message.success('建议提交成功');
      setContent('');
      fetchSuggestions(); // 刷新列表
    } catch (error) {
      console.error('提交建议失败:', error);
      message.error('提交建议失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gradient-to-b from-black via-gray-900 to-black">
      <div className="max-w-4xl mx-auto space-y-6 relative z-10 p-8">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          className="absolute left-8 top-8 text-white bg-gray-800 border-gray-700 hover:bg-gray-700"
        />
        <Title level={2} className="text-white text-center mb-8">用户建议</Title>
        
        {/* 建议表单 */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <Space direction="vertical" className="w-full">
            <Text className="text-gray-300">用户名: {currentUser?.username || '游客'}</Text>
            <TextArea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请输入您的建议"
              autoSize={{ minRows: 4, maxRows: 6 }}
              className="bg-gray-700 text-white border-gray-600"
            />
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={loading}
              className="mt-4"
            >
              提交建议
            </Button>
          </Space>
        </div>

        {/* 建议列表 */}
        <List
          className="bg-gray-800 p-6 rounded-lg"
          itemLayout="horizontal"
          dataSource={suggestions}
          pagination={{
            onChange: setCurrentPage,
            pageSize: 20,
            className: 'text-white'
          }}
          renderItem={(item) => (
            <List.Item className="border-b border-gray-700 last:border-0">
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={
                  <Space className="text-white">
                    <span>{item.username}</span>
                    <small className="text-gray-400">
                      {new Date(item.timestamp).toLocaleString()}
                    </small>
                  </Space>
                }
                description={
                  <div className="text-gray-300 whitespace-pre-wrap">
                    {item.content}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </div>
    </div>
  );
};

export default Suggestion;