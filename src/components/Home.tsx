import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, Switch, Avatar, Dropdown } from 'antd';
import VersionNotes from './VersionNotes';
import { TranslationOutlined, SwapOutlined, UserOutlined, LoginOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { classicCharacters } from '../config/donghua';
import '../styles/animations.css';
import { useAuth } from '../contexts/AuthContext';

const { Title } = Typography;

const Home: React.FC = () => {
  const navigate = useNavigate();
  const versionNotes = import.meta.env.VersionNotes || '暂无版本信息';
  const { currentUser, isGuest, logout, assignGuestId } = useAuth();
  const [animationMode, setAnimationMode] = useState<'float' | 'stars'>('float');
  const [characters, setCharacters] = useState<Array<{ id: number; char: string; left: number; scale: number; opacity: number; duration: number }>>([]);
  const [stars, setStars] = useState<Array<{ id: number; char: string; x: number; y: number; z: number; speed: number; opacity: number }>>([]);

  // 浮动动画效果
  useEffect(() => {
    if (animationMode !== 'float') {
      setCharacters([]);
      return;
    }
    
    // 限制同时显示的最大字符数量
    const MAX_CHARACTERS = 15;
    
    const generateChar = () => {
      // 如果当前字符数量已达到最大值，则不再生成新字符
      if (characters.length >= MAX_CHARACTERS) return;
      
      // 在整个屏幕宽度范围内随机生成位置
      const left = Math.random() * 100; // 0-100%的随机位置
      
      const newChar = {
        id: Date.now(),
        char: classicCharacters[Math.floor(Math.random() * classicCharacters.length)],
        left: left,
        scale: 0.5 + Math.random() * 1.5,
        opacity: 0.5 + Math.random() * 0.4,
        duration: 8 + Math.random() * 6 // 8-14秒的随机持续时间
      };
      
      setCharacters(prev => [...prev, newChar]);

      // 使用requestAnimationFrame代替setTimeout，提高动画性能
      const removeTime = newChar.duration * 1000; // 根据动画持续时间设置移除时间
      const startTime = performance.now();
      
      const removeChar = (timestamp) => {
        if (timestamp - startTime >= removeTime) {
          setCharacters(prev => prev.filter(c => c.id !== newChar.id));
          return;
        }
        requestAnimationFrame(removeChar);
      };
      
      requestAnimationFrame(removeChar);
    };

    let timeoutId: number | null = null;

    const scheduleNextGeneration = () => {
      if (animationMode !== 'float') return;
      
      generateChar();
      // 下一次生成的随机延迟时间 (1500-2500ms)
      const nextDelay = 1500 + Math.random() * 1000;
      timeoutId = setTimeout(scheduleNextGeneration, nextDelay);
    };

    // 开始生成
    timeoutId = setTimeout(scheduleNextGeneration, 500);

    // 清理函数
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [characters.length, animationMode]);

  // 星空动画效果
  useEffect(() => {
    if (animationMode !== 'stars') {
      setStars([]);
      return;
    }

    const MAX_STARS = 50;
    
    const generateStar = () => {
      const x = Math.random() * 100 - 50;
      const y = Math.random() * 100 - 50;
      const z = Math.random() * 20 + 20; // 增加初始距离
      
      const newStar = {
        id: Date.now() + Math.random(),
        char: classicCharacters[Math.floor(Math.random() * classicCharacters.length)],
        x,
        y,
        z,
        speed: 0.2 + Math.random() * 0.8, // 降低速度范围，使动画更平滑
        opacity: 0.6 + Math.random() * 0.4
      };
      
      setStars(prev => {
        if (prev.length >= MAX_STARS) {
          return [...prev.slice(1), newStar];
        }
        return [...prev, newStar];
      });
    };

    // 定期生成新星星
    const generateInterval = setInterval(generateStar, 600); // 降低生成频率
    
    // 使用 requestAnimationFrame 进行更平滑的动画
    let animationFrameId: number;
    let lastUpdate = performance.now();
    
    const updateStars = (currentTime: number) => {
      const deltaTime = (currentTime - lastUpdate) / 1000; // 转换为秒
      lastUpdate = currentTime;
      
      setStars(prev => 
        prev.map(star => {
          // 使用deltaTime来使动画速度独立于帧率
          let newZ = star.z - star.speed * deltaTime * 5;
          
          if (newZ <= 0.5) {
            return {
              ...star,
              id: Date.now() + Math.random(),
              x: Math.random() * 100 - 50,
              y: Math.random() * 100 - 50,
              z: Math.random() * 20 + 20,
              speed: 0.2 + Math.random() * 0.8,
              char: classicCharacters[Math.floor(Math.random() * classicCharacters.length)]
            };
          }
          
          // 更平滑的速度调整
          const speedChange = (Math.random() * 0.04 - 0.02) * deltaTime;
          const newSpeed = Math.max(0.2, Math.min(1.0, star.speed + speedChange));
          
          return {
            ...star,
            z: newZ,
            speed: newSpeed
          };
        })
      );
      
      animationFrameId = requestAnimationFrame(updateStars);
    };
    
    // 初始生成一批星星
    for (let i = 0; i < 20; i++) {
      setTimeout(generateStar, i * 100);
    }
    
    // 启动动画循环
    animationFrameId = requestAnimationFrame(updateStars);
    
    return () => {
      clearInterval(generateInterval);
      cancelAnimationFrame(animationFrameId);
    };
  }, [animationMode]);

  return (
    <>
      <VersionNotes versionNotes={versionNotes} />
      {/* 动画容器 */}
      {animationMode === 'float' && (
        <div className="floating-characters">
          {characters.map(char => (
            <div
              key={char.id}
              className="floating-character"
              style={{
                left: `${char.left}%`,
                '--scale': char.scale,
                '--opacity': char.opacity,
                '--duration': `${char.duration}s`
              } as React.CSSProperties}
              data-char={char.char}
            >
              {char.char}
            </div>
          ))}
        </div>
      )}
      
      {animationMode === 'stars' && (
        <div className="star-space">
          {stars.map(star => {
            const scale = Math.max(0.2, 1 / (star.z * 0.1));
            const x = (star.x / star.z) * 50 + 50;
            const y = (star.y / star.z) * 50 + 50;
            
            return (
              <div
                key={star.id}
                className="star-character"
                style={{
                  transform: `translate3d(${x}vw, ${y}vh, ${-star.z}px) scale(${scale})`,
                  opacity: star.opacity
                }}
              >
                {star.char}
              </div>
            );
          })}
        </div>
      )}
      
      {/* 切换按钮 */}
      <div className="absolute top-4 left-4 z-20">
        <Space>
          <Switch 
            checkedChildren="星空" 
            unCheckedChildren="浮动" 
            checked={animationMode === 'stars'}
            onChange={(checked) => setAnimationMode(checked ? 'stars' : 'float')}
          />
        </Space>
      </div>
      
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
      
      {/* 浮动字符动画 */}
      {animationMode === 'float' && (
        <div className="floating-characters">
          {characters.map(({ id, char, left, scale, opacity, duration }) => (
            <div
              key={id}
              className="floating-character"
              data-char={char}
              style={{
                left: `${left}%`,
                '--scale': scale,
                '--opacity': opacity,
                '--duration': `${duration}s`
              } as React.CSSProperties}
            >
              {char}
            </div>
          ))}
        </div>
      )}
      
      {/* 星空字符动画 */}
      {animationMode === 'stars' && (
        <div className="star-space">
          {stars.map(({ id, char, x, y, z, opacity }) => {
            // 增强3D效果的计算
            const scale = 25 / (z + 5); // 调整缩放计算
            const posX = 50 + (x / (z * 0.1)) * 50; // 增强透视效果
            const posY = 50 + (y / (z * 0.1)) * 50;
            const currentOpacity = opacity * Math.min(1, (30 - z) / 15); // 更平滑的透明度过渡
            
            return (
              <div
                key={id}
                className="star-character"
                style={{
                  left: `${posX}%`,
                  top: `${posY}%`,
                  transform: `translate(-50%, -50%) scale(${scale}) translateZ(${-z}px)`,
                  opacity: currentOpacity
                }}
              >
                {char}
              </div>
            );
          })}
        </div>
      )}
      
      <div className="flex items-center justify-center min-h-screen">
        <Space direction="vertical" size="large" className="w-full -mt-32">
          <Card className="text-center max-w-lg mx-auto">
            <Title level={2}>中文名生成器</Title>
            <Button 
              type="primary" 
              size="large"
              icon={<TranslationOutlined />}
              onClick={() => {
                // 如果是游客或已登录用户，直接进入生成页面
                if (currentUser) {
                  navigate('/generator');
                } else {
                  // 如果未登录，分配游客ID
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