import { config } from '../config';

/**
 * 1つの良いことに対してOpenAI APIからコメントを取得
 * @param goodThing 1つの「良いこと」
 * @returns AIからのコメント
 */
export async function getAiCommentForItem(
  goodThing: string,
  checkNetworkConnection: () => boolean
): Promise<string> {
  try {
    // ネットワーク接続がない場合はエラー
    if (!checkNetworkConnection()) {
      throw new Error('ネットワーク接続がありません');
    }

    // Cloudflare Workersエンドポイントにリクエスト
    const response = await fetch(`${config.api.endpoint}/api/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        goodThing,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'APIエラーが発生しました');
    }

    const data = await response.json();
    return data.comment || 'コメントを取得できませんでした';
  } catch (error) {
    throw error;
  }
}

/**
 * 3つの良いことに対してOpenAI APIからコメントを取得
 * @param goodThings 3つの「良いこと」の配列
 * @returns AIからのコメント
 */
export async function getAiComment(goodThings: string[]): Promise<string> {
  try {
    // ネットワーク接続がない場合はエラー
    if (!navigator.onLine) {
      throw new Error('ネットワーク接続がありません');
    }

    // Cloudflare Workersエンドポイントにリクエスト
    const response = await fetch(`${config.api.endpoint}/api/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        goodThings,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'APIエラーが発生しました');
    }

    const data = await response.json();
    return data.comment || 'コメントを取得できませんでした';
  } catch (error) {
    throw error;
  }
}

/**
 * ネットワーク接続状態を確認
 * @returns ネットワーク接続があればtrue、なければfalse
 */
export function checkNetworkConnection(): boolean {
  return navigator.onLine;
}
