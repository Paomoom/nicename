import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 安全中间件
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: true
}));

// 请求速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 每个IP限制100个请求
});
app.use(limiter);

// 请求体大小限制
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use(express.static('dist'));

// 确保history目录存在
const ensureHistoryDir = async () => {
  const historyDir = path.join(__dirname, 'history');
  try {
    await fs.access(historyDir);
  } catch {
    await fs.mkdir(historyDir, { recursive: true });
  }
  return historyDir;
};

// 验证用户请求的中间件
const validateRequest = (req, res, next) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ success: false, error: '需要提供用户名' });
  }
  next();
};

// 保存历史记录的API端点
app.post('/api/history/save', validateRequest, async (req, res) => {
  try {
    const historyDir = await ensureHistoryDir();
    const historyPath = path.join(historyDir, 'GenHistory.json');
    
    // 读取现有的历史记录
    let existingHistory = [];
    try {
      const existingData = await fs.readFile(historyPath, 'utf8');
      existingHistory = JSON.parse(existingData);
    } catch (error) {
      // 如果文件不存在或无法解析，使用空数组
      console.log('没有找到现有历史记录或解析失败，创建新的历史记录');
    }

    // 确保 existingHistory 是数组
    if (!Array.isArray(existingHistory)) {
      existingHistory = [];
    }

    // 添加新的记录
    existingHistory.push(req.body);
    
    // 写入更新后的历史记录
    await fs.writeFile(
      historyPath,
      JSON.stringify(existingHistory, null, 2),
      'utf8'
    );

    console.log('历史记录已保存到:', historyPath);
    res.json({ success: true, message: '历史记录已保存' });
  } catch (error) {
    console.error('保存历史记录失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取图片历史记录的API端点
app.get('/api/image-history/get', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(400).json({ success: false, error: '需要提供用户名' });
    }

    const historyDir = await ensureHistoryDir();
    const historyPath = path.join(historyDir, 'image_history.json');
    
    // 读取现有的历史记录
    let imageHistory = [];
    try {
      const existingData = await fs.readFile(historyPath, 'utf8');
      imageHistory = JSON.parse(existingData);
    } catch (error) {
      // 如果文件不存在或无法解析，使用空数组
      console.log('没有找到现有图片历史记录或解析失败，返回空数组');
    }

    // 确保 imageHistory 是数组
    if (!Array.isArray(imageHistory)) {
      imageHistory = [];
    }

    // 过滤当前用户的历史记录
    const userHistory = imageHistory.filter(record => record.user === username);
    res.json(userHistory);
  } catch (error) {
    console.error('获取图片历史记录失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 保存图片历史记录的API端点
app.post('/api/image-history/save', validateRequest, async (req, res) => {
  try {
    const historyDir = await ensureHistoryDir();
    const historyPath = path.join(historyDir, 'image_history.json');
    
    // 读取现有的历史记录
    let imageHistory = [];
    try {
      const existingData = await fs.readFile(historyPath, 'utf8');
      imageHistory = JSON.parse(existingData);
    } catch (error) {
      // 如果文件不存在或无法解析，使用空数组
      console.log('没有找到现有图片历史记录或解析失败，创建新的历史记录');
    }

    // 确保 imageHistory 是数组
    if (!Array.isArray(imageHistory)) {
      imageHistory = [];
    }

    // 添加新的记录
    const newRecord = {
      id: uuidv4(),
      ...req.body,
      timestamp: new Date().toISOString()
    };
    imageHistory.push(newRecord);
    
    // 写入更新后的历史记录
    await fs.writeFile(
      historyPath,
      JSON.stringify(imageHistory, null, 2),
      'utf8'
    );

    console.log('图片历史记录已保存到:', historyPath);
    res.json({ success: true, message: '图片历史记录已保存', record: newRecord });
  } catch (error) {
    console.error('保存图片历史记录失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取建议列表的API端点
app.get('/api/suggestions', async (req, res) => {
  try {
    const historyDir = await ensureHistoryDir();
    const suggestionsPath = path.join(historyDir, 'suggestions.json');
    
    let suggestions = [];
    try {
      const existingData = await fs.readFile(suggestionsPath, 'utf8');
      suggestions = JSON.parse(existingData);
    } catch (error) {
      console.log('没有找到建议列表或解析失败，返回空数组');
    }

    if (!Array.isArray(suggestions)) {
      suggestions = [];
    }

    res.json(suggestions);
  } catch (error) {
    console.error('获取建议列表失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 验证建议内容的中间件
const validateSuggestion = (req, res, next) => {
  const { content, username } = req.body;
  if (!content || !username) {
    return res.status(400).json({ success: false, error: '需要提供内容和用户名' });
  }
  if (content.length > 1000) {
    return res.status(400).json({ success: false, error: '内容长度不能超过1000字符' });
  }
  next();
};

// 保存建议的API端点
app.post('/api/suggestions', validateSuggestion, async (req, res) => {
  try {
    const historyDir = await ensureHistoryDir();
    const suggestionsPath = path.join(historyDir, 'suggestions.json');
    
    let suggestions = [];
    try {
      const existingData = await fs.readFile(suggestionsPath, 'utf8');
      suggestions = JSON.parse(existingData);
    } catch (error) {
      console.log('没有找到建议列表或解析失败，创建新的建议列表');
    }

    if (!Array.isArray(suggestions)) {
      suggestions = [];
    }

    const newSuggestion = {
      id: uuidv4(),
      ...req.body,
      timestamp: new Date().toISOString()
    };
    suggestions.push(newSuggestion);

    await fs.writeFile(
      suggestionsPath,
      JSON.stringify(suggestions, null, 2),
      'utf8'
    );

    res.json({ success: true, message: '建议已保存', suggestion: newSuggestion });
  } catch (error) {
    console.error('保存建议失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});