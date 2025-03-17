interface ImageHistoryRecord {
  timestamp: string;
  user: string;
  prompt: string;
  imageUrls: string[];
}

export const saveImageHistory = async (historyData: ImageHistoryRecord, isGuest: boolean) => {
  // 如果是游客，不保存历史记录
  if (isGuest) {
    console.log('游客模式不保存历史记录');
    return;
  }

  try {
    const response = await fetch('http://localhost:3001/api/image-history/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(historyData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('图片历史记录已保存:', result);
    return result;
  } catch (error) {
    console.error('保存图片历史记录失败:', error);
    throw error;
  }
};