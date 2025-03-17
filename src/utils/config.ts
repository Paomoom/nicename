interface CozeConfig {
  apiKey: string;
  botId: string;
  botId02: string;
  userId: string;
  baseUrl: string;
}

export const getCozeConfig = (): CozeConfig => {
  const config = {
    apiKey: import.meta.env.VITE_COZE_API_KEY,
    botId: import.meta.env.VITE_COZE_BOT_ID,
    botId02: import.meta.env.VITE_COZE_BOT_ID_02,
    userId: import.meta.env.VITE_COZE_USER_ID,
    baseUrl: import.meta.env.VITE_COZE_BASE_URL || 'https://api.coze.cn'
  };

  // 验证配置
  if (!config.apiKey || !config.botId || !config.userId) {
    console.error('缺少必要的配置信息');
    throw new Error('配置信息不完整');
  }

  return config;
};