import OpenAI from 'openai';
import { config } from '../config';

// OpenAI APIクライアントの作成
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
  dangerouslyAllowBrowser: true, // ブラウザでの実行を許可（本来はサーバーで実行するのが望ましい）
});

/**
 * 1つの良いことに対してOpenAI APIからコメントを取得
 * @param goodThing 1つの「良いこと」
 * @returns AIからのコメント
 */
export async function getAiCommentForItem(goodThing: string): Promise<string> {
  try {
    // ネットワーク接続がない場合はエラー
    if (!navigator.onLine) {
      throw new Error('ネットワーク接続がありません');
    }

    // APIキーが設定されていない場合はエラー
    if (!config.openai.apiKey || config.openai.apiKey === 'your-api-key-here') {
      throw new Error('OpenAI APIキーが設定されていません');
    }

    // 1つの良いことに対してプロンプトを作成
    const prompt = `
「良いこと」: ${goodThing}

この「良いこと」に対して、友達のような感覚で一言コメントをください。
ポジティブで共感的な短いメッセージにしてください（1文程度）。
`;

    // OpenAI APIを呼び出し
    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        { role: 'system', content: '友達のように気軽にコメントする日本語アシスタントです。' },
        { role: 'user', content: prompt }
      ],
      max_tokens: config.openai.maxTokens,
    });

    // 返答を取得
    return response.choices[0]?.message?.content || 'コメントを取得できませんでした';
  } catch (error) {
    console.error('OpenAI API呼び出しエラー:', error);
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

    // APIキーが設定されていない場合はエラー
    if (!config.openai.apiKey || config.openai.apiKey === 'your-api-key-here') {
      throw new Error('OpenAI APIキーが設定されていません');
    }

    // 3つの良いことをまとめてプロンプトを作成
    const prompt = `
今日の3つの「良いこと」:
1. ${goodThings[0] || ''}
2. ${goodThings[1] || ''}
3. ${goodThings[2] || ''}

これらの「良いこと」に対して、友達のような感覚で一言コメントをください。
ポジティブで共感的な短いメッセージにしてください（1文程度）。
`;

    // OpenAI APIを呼び出し
    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [
        { role: 'system', content: '友達のように気軽にコメントする日本語アシスタントです。' },
        { role: 'user', content: prompt }
      ],
      max_tokens: config.openai.maxTokens,
    });

    // 返答を取得
    return response.choices[0]?.message?.content || 'コメントを取得できませんでした';
  } catch (error) {
    console.error('OpenAI API呼び出しエラー:', error);
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
