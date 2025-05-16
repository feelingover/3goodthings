// アプリ全体の設定

export const config = {
  // OpenAI API設定
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY as string,
    model: import.meta.env.VITE_OPENAI_MODEL as string || "gpt-4o", // 未設定の場合はデフォルト値
    maxTokens: 50, // 短いコメント用
  },
  
  // データベース設定
  db: {
    name: "3GoodThingsDB",
    version: 1,
  },
};
