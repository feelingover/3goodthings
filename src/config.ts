// アプリ全体の設定

export const config = {
  // API設定
  api: {
    endpoint: import.meta.env.VITE_API_ENDPOINT as string || "http://localhost:8787", // Cloudflare Workers endpoint
  },

  // データベース設定
  db: {
    name: "3GoodThingsDB",
    version: 2,
  },
};
