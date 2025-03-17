import React, { useState, useEffect } from 'react';
import { Input, Button, Space, Typography, Select, Spin, Tooltip, message, Dropdown, Avatar } from 'antd';
import VersionNotes from './VersionNotes';
import { TranslationOutlined, LoadingOutlined, ExclamationCircleOutlined, HistoryOutlined, LoginOutlined, UserOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import '../styles/animations.css';
import axios from 'axios';
import { saveGenerationHistory } from '../utils/saveHistory';
import { saveImageHistory } from '../utils/saveImageHistory';
import { getCozeConfig } from '../utils/config';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

// 获取Coze配置
const cozeConfig = getCozeConfig();

// 自定义加载图标
const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;

interface GeneratedName {
  text: string;
  association: string;
  translation: string;
}

// 定义原始响应的接口
interface RawResponse {
  timestamp: string;
  query: {
    englishName: string;
    characterCount: string;
    unwantedHanzi: string;
  };
  rawResponse: string;
  names: GeneratedName[];
}

const NameGenerator: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const versionNotes = import.meta.env.VersionNotes || '暂无版本信息';
  const { state } = location;
  const { currentUser, isGuest } = useAuth();
  
  // 检查用户是否已登录或是游客
  useEffect(() => {
    if (!currentUser) {
      // 如果既不是登录用户也不是游客，重定向到首页
      navigate('/');
    }
  }, [currentUser, navigate]);

  // 从localStorage加载状态
  React.useEffect(() => {
    console.log('检查状态恢复，location state:', state);
    const savedState = localStorage.getItem('nameGeneratorState');
    
    try {
      // 检查是否从历史页面返回
      const isFromHistory = location.state && location.state.preserveState === true;
      console.log('是否从历史页面返回:', isFromHistory);
      
      // 检查localStorage中是否有保存的状态
      if (savedState && isFromHistory) {
        console.log('从历史页面返回，恢复保存的状态');
        const parsedState = JSON.parse(savedState);
        
        // 确保所有状态都被正确恢复
        setEnglishName(parsedState.englishName || '');
        setSelectedNumber(parsedState.selectedNumber || 'two');
        setUnwantedHanzi(parsedState.unwantedHanzi || '');
        setHasGeneratedContent(parsedState.hasGeneratedContent || false);
        setHasGeneratedImages(parsedState.hasGeneratedImages || false);
        setConversationId(parsedState.conversationId || null);
        
        // 确保生成的名字数组被正确恢复
        if (Array.isArray(parsedState.generatedNames) && parsedState.generatedNames.length > 0) {
          console.log('恢复生成的名字:', parsedState.generatedNames);
          setGeneratedNames(parsedState.generatedNames);
        } else {
          console.log('没有找到生成的名字或格式不正确');
          setGeneratedNames([]);
        }
        
        setSelectedNameIndex(parsedState.selectedNameIndex || 0);
        setLoadingStates(parsedState.loadingStates || [false, false, false, false]);
        
        // 确保图片URL数组被正确恢复
        if (Array.isArray(parsedState.imageUrls)) {
          console.log('恢复图片URL:', parsedState.imageUrls);
          setImageUrls(parsedState.imageUrls);
        } else {
          console.log('没有找到图片URL或格式不正确');
          setImageUrls([]);
        }
      } else {
        console.log('不是从历史页面返回或没有保存的状态，重置所有状态');
        resetAllStates();
      }
    } catch (error) {
      console.error('恢复状态时出错:', error);
      resetAllStates();
    }
  }, [location.state]); // 添加location.state依赖，确保在导航状态变化时重新执行
  
  // 重置所有状态的辅助函数
  const resetAllStates = () => {
    setEnglishName('');
    setSelectedNumber('two');
    setUnwantedHanzi('');
    setHasGeneratedContent(false);
    setHasGeneratedImages(false);
    setConversationId(null);
    setGeneratedNames([]);
    setSelectedNameIndex(0);
    setLoadingStates([false, false, false, false]);
    setImageUrls([]);
  };
  const [englishName, setEnglishName] = useState('');
  const [selectedNumber, setSelectedNumber] = useState('two');
  const [unwantedHanzi, setUnwantedHanzi] = useState('');
  const [hasGeneratedContent, setHasGeneratedContent] = useState(false);
  const [hasGeneratedImages, setHasGeneratedImages] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [generatedNames, setGeneratedNames] = useState<GeneratedName[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNameIndex, setSelectedNameIndex] = useState(0);
  const [loadingStates, setLoadingStates] = useState<boolean[]>([false, false, false, false]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // 当状态变化时保存到localStorage
  React.useEffect(() => {
    // 只有当状态有实际内容时才保存
    if (hasGeneratedContent || englishName || unwantedHanzi) {
      console.log('保存状态到localStorage');
      const stateToSave = {
        englishName,
        selectedNumber,
        unwantedHanzi,
        hasGeneratedContent,
        hasGeneratedImages,
        conversationId,
        generatedNames,
        selectedNameIndex,
        loadingStates,
        imageUrls
      };
      localStorage.setItem('nameGeneratorState', JSON.stringify(stateToSave));
    }
  }, [englishName, selectedNumber, unwantedHanzi, hasGeneratedContent, hasGeneratedImages, 
      conversationId, generatedNames, selectedNameIndex, loadingStates, imageUrls]);
      
  // 组件卸载前保存状态
  React.useEffect(() => {
    return () => {
      // 只在有实际内容时保存
      if (hasGeneratedContent || englishName || unwantedHanzi) {
        console.log('组件卸载前保存状态');
        const stateToSave = {
          englishName,
          selectedNumber,
          unwantedHanzi,
          hasGeneratedContent,
          hasGeneratedImages,
          conversationId,
          generatedNames,
          selectedNameIndex,
          loadingStates,
          imageUrls
        };
        localStorage.setItem('nameGeneratorState', JSON.stringify(stateToSave));
      }
    };
  }, []);
  
  // 监听imageUrls变化，当有图片URL时创建图片元素
  React.useEffect(() => {
    console.log('imageUrls状态变化，当前值:', imageUrls);
    
    // 只有当有图片URL且已生成图片状态为true时才处理
    if (Array.isArray(imageUrls) && imageUrls.length > 0 && hasGeneratedImages) {
      console.log('检测到图片URL数组有内容，开始创建图片元素');
      
      // 获取所有图片容器
      const imageBoxes = document.querySelectorAll('.image-box');
      
      // 遍历图片URL数组，为每个URL创建图片元素
      imageUrls.forEach((url, index) => {
        if (index < imageBoxes.length) {
          console.log(`为第${index + 1}个图片URL创建图片元素:`, url);
          const imageBox = imageBoxes[index];
          
          // 检查是否已存在图片元素
          const existingImg = imageBox.querySelector('img');
          if (!existingImg) {
            // 创建新的图片元素
            const img = document.createElement('img');
            img.src = url;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            img.style.objectPosition = 'center';
            img.style.opacity = '0';
            
            // 处理图片加载错误
            img.onerror = () => {
              console.error('图片加载失败:', url);
              const loadingDiv = imageBox.querySelector('.loading-indicator');
              if (loadingDiv) {
                loadingDiv.innerHTML = '<div style="color: #ff4d4f; text-align: center;"><span style="font-size: 24px;">⚠️</span><br>图片加载失败</div>';
              }
            };
            
            // 处理图片加载成功
            img.onload = () => {
              console.log('图片加载成功:', url);
              const loadingDiv = imageBox.querySelector('.loading-indicator');
              if (loadingDiv) {
                loadingDiv.style.transition = 'opacity 0.3s ease-out';
                loadingDiv.style.opacity = '0';
                setTimeout(() => loadingDiv.remove(), 300);
              }
              
              // 添加图片到容器并设置淡入效果
              imageBox.appendChild(img);
              setTimeout(() => {
                img.style.transition = 'opacity 0.5s ease-in-out';
                img.style.opacity = '1';
              }, 50);
            };
          }
        }
      });
    }
  }, [imageUrls, hasGeneratedImages]); // 依赖于imageUrls和hasGeneratedImages状态

  // 保持动画效果
  const renderFloatingCharacters = () => (
    <div className="floating-characters">
      {Array.from({ length: 12 }).map((_, index) => {
        const sections = 10;
        const sectionIndex = Math.floor(Math.random() * sections);
        const baseLeft = (sectionIndex * 10);
        const randomOffset = Math.random() * 8;
        const left = baseLeft + randomOffset;
        const scale = 0.5 + Math.random() * 1.5;
        const opacity = 0.2 + Math.random() * 0.4;
        return (
          <div
            key={index}
            className="floating-character"
            style={{ 
              left: `${left}%`,
              animationDelay: `${index * 0.8}s`,
              '--scale': scale,
              '--opacity': opacity
            } as React.CSSProperties}
          >
            {['诗', '词', '歌', '赋', '风', '雅', '颂', '韵', '德', '仁', '义', '礼', '智', '信', '道', '天'][Math.floor(Math.random() * 16)]}
          </div>
        );
      })}
    </div>
  );

  // 创建Coze会话
  const createCozeConversation = async () => {
    try {
      const response = await axios.post(
        `${cozeConfig.baseUrl}/v1/conversation/create`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${cozeConfig.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.code === 0 && response.data.data?.id) {
        setConversationId(response.data.data.id);
        return response.data.data.id;
      }
      return null;
    } catch (error) {
      console.error('创建Coze会话失败:', error);
      return null;
    }
  };

  // 解析AI返回的文本内容
  const parseAIResponse = (text: string): GeneratedName[] => {
    console.log('----------------------------------------');
    console.log('开始解析AI返回文本，原始文本:', text);
    console.log('----------------------------------------');
    
    // 如果包含function call，则只取最后一个响应部分
    const parts = text.split('function call');
    const textToProcess = parts[parts.length - 1];
    
    const names: GeneratedName[] = [];
    const sections = textToProcess.split(/(?=文字：)/);
    console.log('分割后的部分数量:', sections.length);
    sections.forEach((section, i) => {
      console.log(`\n--- 第 ${i + 1} 部分内容 ---\n`, section);
    });
    
    sections.forEach((section, index) => {
      if (section.trim()) {
        const translationMatch = section.match(/英文翻译：(.*?)(?=\n|$)/);
        const associationMatch = section.match(/关联：([\s\S]*?)(?=\n英文翻译：|$)/);
        const textMatch = section.match(/文字：(.*?)(?=\n|$)/);
        
        console.log(`\n处理第 ${index + 1} 个部分:`);
        console.log('英文翻译匹配:', translationMatch ? translationMatch[1] : '未匹配');
        console.log('关联匹配:', associationMatch ? associationMatch[1] : '未匹配');
        console.log('文字匹配:', textMatch ? textMatch[1] : '未匹配');
        
        if (textMatch) {
          const name: GeneratedName = {
            text: textMatch[1].trim(),
            association: associationMatch ? associationMatch[1].trim() : '',
            translation: translationMatch ? translationMatch[1].trim() : ''
          };
          
          console.log('成功解析名字:', name);
          names.push(name);
          
          // 更新显示
          setGeneratedNames(prevNames => {
            const newNames = [...prevNames];
            if (index < 4) {
              newNames[index] = name;
            }
            return newNames;
          });
        }
      }
    });

    console.log('----------------------------------------');
    console.log('解析完成，共解析出名字数量:', names.length);
    console.log('解析出的所有名字:', names);
    console.log('----------------------------------------');
    
    return names;
  };

  // 发送消息到Coze并获取响应
  const sendMessageToCoze = async (message: string) => {
    console.log('开始发送消息到Coze:', message);
    
    if (!conversationId) {
      console.log('没有会话ID，创建新会话');
      const newConversationId = await createCozeConversation();
      if (!newConversationId) {
        console.error('无法创建会话');
        return;
      }
      setConversationId(newConversationId);
      console.log('新会话已创建:', newConversationId);
    }

    try {
      console.log('发送请求到Coze API...');
      console.log('使用的botId:', cozeConfig.botId02);
      const response = await fetch(`${cozeConfig.baseUrl}/v3/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cozeConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bot_id: cozeConfig.botId,
          user_id: cozeConfig.userId,
          conversation_id: conversationId,
          stream: true,
          auto_save_history: true,
          max_tokens: 4000,
          temperature: 0.7,
          additional_messages: [
            {
              role: 'user',
              content: message,
              content_type: 'text'
            }
          ]
        })
      });

      if (!response.ok) {
        console.error('API请求失败:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('错误响应内容:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log('API请求成功，开始读取响应流');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let currentSection = '';
      let names: GeneratedName[] = [];

      if (!reader) {
        console.error('无法获取响应流');
        throw new Error('无法获取响应流');
      }
      console.log('成功获取响应流，开始处理数据');

      // 初始化空的生成名字数组，显示加载状态
      setGeneratedNames(Array(4).fill({ text: '', association: '', translation: '' }));
      setLoadingStates([true, true, true, true]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log('响应流读取完成');
          break;
        }

        const text = decoder.decode(value);
        const lines = text.split('\n');
        let eventType = '';

        for (const line of lines) {
          if (!line.trim()) continue;

          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim();
            continue;
          }

          if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.slice(5));
              
              if (data === '[DONE]') {
                console.log('收到结束标记');
                break;
              }

              // 处理完整响应
              if (eventType === 'conversation.message.completed') {
                console.log('收到完整响应:', data);
                console.log('完整响应内容:', data.content);
                console.log('完整响应类型:', data.type);
                console.log('完整响应时间:', new Date().toISOString());
              }

              // 处理增量更新
              if (eventType === 'conversation.message.delta' && 
                  typeof data === 'object' && 
                  data.type === 'answer') {
                const deltaContent = data.content || '';
                currentSection += deltaContent;

                // 检查是否有完整的名字信息
                if (currentSection.includes('Done.')) {
                  const sectionBeforeDone = currentSection.substring(0, currentSection.indexOf('Done.'));
                  if (sectionBeforeDone.includes('文字：') && 
                      sectionBeforeDone.includes('关联：') && 
                      sectionBeforeDone.includes('英文翻译：')) {
                    const textMatch = sectionBeforeDone.match(/文字：(.*?)(?=\n|$)/);
                    const associationMatch = sectionBeforeDone.match(/关联：([\s\S]*?)(?=\n英文翻译：|$)/);
                    const translationMatch = sectionBeforeDone.match(/英文翻译：([\s\S]*?)(?=$)/);

                    if (textMatch && associationMatch && translationMatch) {
                      const name = {
                        text: textMatch[1].trim(),
                        association: associationMatch[1].trim(),
                        translation: translationMatch[1].trim()
                      };
                      
                      // 立即更新显示，使用当前已生成的名字数量作为索引
                      console.log('新添加的名字:', name);
                      setGeneratedNames(prevNames => {
                        console.log('更新前的名字数组:', prevNames);
                        const newNames = [...prevNames];
                        // 找到第一个空位置
                        const index = newNames.findIndex(n => !n.text);
                        if (index !== -1) {
                          newNames[index] = name;
                          // 更新对应位置的loading状态
                          setLoadingStates(prevStates => {
                            const newStates = [...prevStates];
                            newStates[index] = false;
                            return newStates;
                          });
                          console.log(`名字已添加到索引 ${index}`);
                          console.log('更新后的名字数组:', newNames);
                          return [...newNames];
                        } else {
                          console.error('没有找到空位置来添加新名字');
                          return prevNames;
                        }
                      });

                      // 重置currentSection，准备接收下一个名字
                      currentSection = currentSection.substring(currentSection.indexOf('Done.') + 'Done.'.length);
                    }
                  }
                }
              }
            } catch (error) {
              console.error('解析数据时出错:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      console.error('错误详情:', error);
    }
  };

  // 处理生成按钮点击
  const handleGenerate = async () => {
    console.log('生成按钮被点击');
    if (!englishName.trim()) {
      console.log('英文名为空，不执行生成');
      return;
    }

    setIsLoading(true);
    console.log('设置加载状态为true');
    setHasGeneratedContent(true);
    console.log('设置已生成内容为true');
    setGeneratedNames([]);
    console.log('清空之前的结果');

    // 将选项转换为具体的字数
    const characterCountMap = {
      'one': '单字',
      'two': '双字',
      'three': '三字'
    };
    
    const message = `请根据英文名"${englishName}"生成4个${characterCountMap[selectedNumber]}的中文名字，${unwantedHanzi ? `避免使用以下汉字：${unwantedHanzi}` : ''}。每个名字请按照如下格式返回：\n文字：[名字]\n关联：[详细解释]\n英文翻译：[英文翻译]`;
    console.log('准备发送的消息:', message);
    
    try {
      await sendMessageToCoze(message);
      // 保存生成历史记录
      const historyData = {
        timestamp: new Date().toISOString(),
        englishName: englishName,
        characterCount: characterCountMap[selectedNumber],
        unwantedHanzi: unwantedHanzi,
        generatedNames: generatedNames
      };
      console.log('准备保存生成历史记录:', historyData);
      await saveGenerationHistory(historyData);
      console.log('历史记录保存成功');
    } finally {
      console.log('设置加载状态为false');
      setIsLoading(false);
    }
  };

  // 生成图片的函数
  const handleGenerateImages = async () => {
    if (!generatedNames[selectedNameIndex]?.association) {
      console.log('没有选中的名字或关联内容为空，不执行生成');
      message.warning('Search for a name or choose one you like first.');
      return;
    }

    // 清除现有图片
    const imageBoxes = document.querySelectorAll('.image-box');
    imageBoxes.forEach(box => {
      // 移除所有现有图片
      const existingImages = box.querySelectorAll('img');
      existingImages.forEach(img => img.remove());

      // 重置loading状态
      let loadingDiv = box.querySelector('.loading-indicator');
      if (loadingDiv) {
        loadingDiv.remove();
      }
      loadingDiv = document.createElement('div');
      loadingDiv.className = 'loading-indicator';
      loadingDiv.style.position = 'absolute';
      loadingDiv.style.inset = '0';
      loadingDiv.style.display = 'flex';
      loadingDiv.style.alignItems = 'center';
      loadingDiv.style.justifyContent = 'center';
      loadingDiv.innerHTML = '<div class="ant-spin ant-spin-spinning"><span class="ant-spin-dot ant-spin-dot-spin"><i class="ant-spin-dot-item"></i><i class="ant-spin-dot-item"></i><i class="ant-spin-dot-item"></i><i class="ant-spin-dot-item"></i></span></div>';
      box.appendChild(loadingDiv);
    });

    // 重置状态
    setImageUrls([]);
    setIsLoading(true);
    setHasGeneratedImages(true);

    // 更新现有图片容器的loading状态
    imageBoxes.forEach(box => {
      const loadingDiv = box.querySelector('.loading-indicator');
      if (!loadingDiv) {
        const div = document.createElement('div');
        div.className = 'loading-indicator';
        div.style.position = 'absolute';
        div.style.inset = '0';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.innerHTML = '<div class="ant-spin ant-spin-spinning"><span class="ant-spin-dot ant-spin-dot-spin"><i class="ant-spin-dot-item"></i><i class="ant-spin-dot-item"></i><i class="ant-spin-dot-item"></i><i class="ant-spin-dot-item"></i></span></div>';
        box.appendChild(div);
      }
    });


    setIsLoading(true);
    setHasGeneratedImages(true);
    console.log('开始生成图片');

    if (!conversationId) {
      console.log('没有会话ID，创建新会话');
      const newConversationId = await createCozeConversation();
      if (!newConversationId) {
        console.error('无法创建会话');
        setIsLoading(false);
        return;
      }
      setConversationId(newConversationId);
      console.log('新会话已创建:', newConversationId);
    }

    try {
      console.log('发送请求到Coze API...');
      console.log('使用的botId:', cozeConfig.botId02);
      const response = await fetch(`${cozeConfig.baseUrl}/v3/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cozeConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bot_id: cozeConfig.botId02,
          user_id: cozeConfig.userId,
          conversation_id: conversationId,
          stream: true,
          auto_save_history: true,
          max_tokens: 4000,
          temperature: 0.7,
          additional_messages: [
            {
              role: 'user',
              content: `${generatedNames[selectedNameIndex].association}`,
              content_type: 'text'
            }
          ]
        })
      });

      if (!response.ok) {
        console.error('API请求失败:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('错误响应内容:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      console.log('API请求成功，开始读取响应流');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let currentSection = '';
      let imageUrls: string[] = [];

      if (!reader) {
        console.error('无法获取响应流');
        throw new Error('无法获取响应流');
      }
      console.log('成功获取响应流，开始处理数据');

      while (true) {
        console.log('开始读取新的数据块...');
        const { value, done } = await reader.read();
        
        if (done) {
          console.log('响应流读取完成，检查是否收到所有图片URL...');
          console.log('当前累积的图片URL数量:', imageUrls.length);
          console.log('所有已收集的图片URL:', JSON.stringify(imageUrls, null, 2));
          
          // 保存图片历史记录
          if (imageUrls.length > 0) {
            try {
              const imageHistoryData = {
                timestamp: new Date().toISOString(),
                user: englishName || '未命名用户',
                prompt: generatedNames[selectedNameIndex]?.association || '',
                imageUrls: imageUrls
              };
              await saveImageHistory(imageHistoryData);
              console.log('图片历史记录已保存');
              // 更新状态以便在组件中使用
              setImageUrls([...imageUrls]);
            } catch (error) {
              console.error('保存图片历史记录失败:', error);
            }
          }
          
          break;
        }

        const decodedText = decoder.decode(value);
        console.log('解码后的原始数据:', decodedText);
        const lines = decodedText.split('\n');
        let eventType = '';

        for (const line of lines) {
          if (!line.trim()) continue;

          if (line.startsWith('event:')) {
            eventType = line.slice(6).trim();
            console.log('接收到事件类型:', eventType);
            continue;
          }

          if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.slice(5));
              console.log('解析到的数据:', data);
              console.log('数据类型:', data.type);
              
              if (data === '[DONE]' || eventType === 'conversation.message.completed') {
                console.log('收到完成标记或消息完成事件');
                break;
              }

              // 处理增量更新
              if (eventType === 'conversation.message.delta' && 
                  typeof data === 'object' && 
                  data.type === 'answer') {
                const deltaContent = data.content || '';
                console.log('收到增量内容:', deltaContent);
                console.log('当前累积内容:', currentSection);
                currentSection += deltaContent;

                // 提取图片URL
                const imgMatches = currentSection.match(/!\[.*?\]\((https:\/\/s\.coze\.cn\/t\/[\w-]+\/)\)/g);
                console.log('尝试匹配Coze图片URL，累积内容:', currentSection);
                if (imgMatches) {
                  console.log('找到Coze图片匹配数量:', imgMatches.length);
                  console.log('原始匹配结果:', imgMatches);
                  imgMatches.forEach((match, index) => {
                    console.log(`处理第${index + 1}个图片匹配:`, match);
                    const urlMatch = match.match(/!\[.*?\]\((https:\/\/s\.coze\.cn\/t\/[\w-]+\/)\)/);
                    if (urlMatch && urlMatch[1]) {
                      const url = urlMatch[1].trim();
                      console.log(`第${index + 1}个图片URL提取成功:`, url);
                      if (!imageUrls.includes(url)) {
                        imageUrls.push(url);
                        console.log('更新后的图片URL列表:', imageUrls);
                        // 更新图片显示
                        const imageBoxes = document.querySelectorAll('.image-box');
                        if (imageUrls.length <= imageBoxes.length) {
                          const imageBox = imageBoxes[imageUrls.length - 1];
                          if (imageBox) {
                            const img = document.createElement('img');
                            img.src = url;
                            img.style.width = '100%';
                            img.style.height = '100%';
                            img.style.objectFit = 'contain';
                            img.style.objectPosition = 'center';
                            img.style.opacity = '0';
                            img.onerror = () => {
                              console.error('图片加载失败:', url);
                              const loadingDiv = imageBox.querySelector('.loading-indicator');
                              if (loadingDiv) {
                                loadingDiv.innerHTML = '<div style="color: #ff4d4f; text-align: center;"><span style="font-size: 24px;">⚠️</span><br>图片加载失败</div>';
                              }
                            };
                            img.onload = () => {
                              console.log('图片加载成功:', url);
                              const loadingDiv = imageBox.querySelector('.loading-indicator');
                              if (loadingDiv) {
                                loadingDiv.style.transition = 'opacity 0.3s ease-out';
                              loadingDiv.style.opacity = '0';
                              setTimeout(() => loadingDiv.remove(), 300);
                              }
                              imageBox.appendChild(img);
                              setTimeout(() => {
                                img.style.transition = 'opacity 0.5s ease-in-out';
                                img.style.opacity = '1';
                              }, 50);
                            }
                          };
                        }
                      }
                    }
                  });
                }
              }
            } catch (error) {
              console.error('解析数据时出错:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('生成图片失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理名字点击事件
  const handleNameClick = (index: number) => {
    setSelectedNameIndex(index);
  };

  // 渲染名字框
  const renderNameBox = (name: GeneratedName | undefined, index: number, isSelected: boolean) => (
    <div
      key={index}
      className={`hanzi-box p-4 h-24 flex items-center justify-center text-gray-300 cursor-pointer ${isSelected ? 'border-2 border-blue-500' : ''}`}
      onClick={() => !loadingStates[index] && name?.text && handleNameClick(index)}
    >
      {loadingStates[index] ? <Spin indicator={antIcon} /> : name?.text || ''}
    </div>
  );

  // 渲染加载中的占位内容
  const renderLoadingPlaceholders = () => (
    <>
      <div className="grid grid-cols-4 gap-4 mt-8">
        {Array.from({ length: 4 }).map((_, index) => renderNameBox(generatedNames[index], index, index === selectedNameIndex))}
      </div>

      <div className="grid grid-cols-2 gap-6 mt-8">
        <div className="scroll-area h-48 p-6 text-gray-300 overflow-auto" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
          {generatedNames[selectedNameIndex] && (
            <div className="mb-4">
              <div className="whitespace-pre-wrap break-words" style={{ maxHeight: '100%', overflowY: 'auto' }}>{generatedNames[selectedNameIndex].translation}</div>
            </div>
          )}
        </div>
        <div className="scroll-area h-48 p-6 text-gray-300 overflow-auto" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
          {generatedNames[selectedNameIndex] && (
            <div className="mb-4">
              <div className="whitespace-pre-wrap break-words" style={{ maxHeight: '100%', overflowY: 'auto' }}>{generatedNames[selectedNameIndex].association}</div>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen p-4 bg-gradient-to-b from-black via-gray-900 to-black">
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
      {renderFloatingCharacters()}
      
      <div className="max-w-4xl mx-auto space-y-6 relative z-10 p-8 name-generator-container">
        <div className="flex items-center mb-8">
          <Text className="title-text text-left">Pursuing the Most Exquisite Name in Chinese</Text>
          <div className="flex-grow"></div>
          <Button 
            type="text" 
            onClick={() => navigate('/')}
            className="text-gray-300 hover:text-white mr-4"
          >
            Home
          </Button>
          <Button 
            type="text" 
            icon={<HistoryOutlined />} 
            onClick={() => navigate('/image-history')}
            className="text-gray-300 hover:text-white mr-4"
          >
            Image History
          </Button>
          <Button 
            danger
            onClick={() => navigate('/suggestion')}
          >
            Suggest
          </Button>
        </div>

        {/* 输入区域 - 只保留英文名输入框 */}
        <div className="space-y-3">
          <Text className="text-gray-300 opacity-90">Please Enter Your En_Name</Text>
          <Input
            className="custom-input"
            placeholder="Enter your name in English"
            value={englishName}
            onChange={(e) => setEnglishName(e.target.value)}
          />
        </div>

        {/* 下拉框和Unwanted Hanzi输入框区域 */}
        <div className="flex items-center gap-6 mt-6">
          <div className="flex items-center gap-3">
            <Text className="text-gray-300 opacity-90 whitespace-nowrap">Chinese Character Count:</Text>
            <Select
              value={selectedNumber}
              onChange={setSelectedNumber}
              className="custom-select w-28"
              options={[
                { value: 'one', label: 'one' },
                { value: 'two', label: 'two' },
                { value: 'three', label: 'three' },
              ]}
            />
          </div>
          <Input
            className="custom-input flex-1"
            placeholder="Characters to avoid"
            value={unwantedHanzi}
            onChange={(e) => setUnwantedHanzi(e.target.value)}
          />
        </div>

        {/* 生成内容区域 */}
        {hasGeneratedContent && (
          <>
            {isLoading ? (
              renderLoadingPlaceholders()
            ) : (
              <>
                <div className="grid grid-cols-4 gap-4 mt-8">
                  {generatedNames.map((name, index) => renderNameBox(name, index, index === selectedNameIndex))}
                </div>

                <div className="grid grid-cols-2 gap-6 mt-8">
                  <div className="scroll-area h-48 p-6 text-gray-300 overflow-auto">
                    {generatedNames[selectedNameIndex] && (
                      <div className="mb-4">
                        <div className="whitespace-pre-wrap break-words">{generatedNames[selectedNameIndex].translation}</div>
                      </div>
                    )}
                  </div>
                  <div className="scroll-area h-48 p-6 text-gray-300 overflow-auto">
                    {generatedNames[selectedNameIndex] && (
                      <div className="mb-4">
                        <div className="whitespace-pre-wrap break-words">{generatedNames[selectedNameIndex].association}</div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* 图片区域 */}
        {hasGeneratedImages && (
          <div className="grid grid-cols-2 gap-6 mt-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="image-box aspect-video flex items-center justify-center text-gray-400 bg-gray-800 rounded-lg overflow-hidden relative">
                <div className="loading-indicator absolute inset-0 flex items-center justify-center">
                  {isLoading ? <Spin indicator={antIcon} /> : `等待生成图片 ${index + 1}`}
                </div>
                {/* 添加图片容器样式 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* 图片将由JavaScript动态添加，并继承父容器的样式 */}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 按钮区域 */}
        <div className="flex justify-end space-x-6 mt-8">
          <Button 
            type="primary" 
            icon={<TranslationOutlined />} 
            className="btn-pursuing"
            onClick={handleGenerate}
            loading={isLoading}
            disabled={!englishName.trim() || isLoading}
          >
            {isLoading ? 'Generating...' : 'Pursuing'}
          </Button>
          <Button 
            type="default"
            className="btn-discover"
            onClick={handleGenerateImages}
            disabled={isLoading}
          >
            Drawing <Tooltip title="In the flow of ancient Chinese characters, we discover the soul of names—elegant in tone, rich in meaning, and a bridge to Chinese culture, where each name becomes a gateway to its beauty and depth."><ExclamationCircleOutlined style={{ fontSize: '12px', marginLeft: '4px' }} /></Tooltip>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NameGenerator;