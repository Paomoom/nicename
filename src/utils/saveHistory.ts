interface GeneratedName {
  text: string;
  association: string;
  translation: string;
}

interface HistoryRecord {
  timestamp: string;
  englishName: string;
  characterCount: string;
  unwantedHanzi: string;
  generatedNames: GeneratedName[];
}

export const saveGenerationHistory = async (historyData: HistoryRecord) => {
  try {
    const response = await fetch('http://localhost:3001/api/history/save', {
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
    console.log('历史记录已保存:', result);
    return result;
  } catch (error) {
    console.error('保存历史记录失败:', error);
    throw error;
  }
};