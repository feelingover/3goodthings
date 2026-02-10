// アプリ全体の設定

// Viteでビルドする際、defineにより VITE_API_ENDPOINT が置換されるように設定する。
// Jest環境では global.VITE_API_ENDPOINT を定義することで動作させる。
// TypeScriptのエラー回避のため、アンビエント宣言が必要だが、ここでは簡略化してanyキャスト等で対応。

declare const VITE_API_ENDPOINT: string;

const getApiEndpoint = (): string => {
  try {
    // @ts-ignore
    if (typeof VITE_API_ENDPOINT !== 'undefined') {
      // @ts-ignore
      return VITE_API_ENDPOINT;
    }
  } catch (e) {
    // ignore
  }
  return "http://localhost:8787";
};

export const config = {
  // API設定
  api: {
    endpoint: getApiEndpoint(),
  },

  // データベース設定
  db: {
    name: "3GoodThingsDB",
    version: 2,
  },
};
