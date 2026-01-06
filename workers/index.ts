/**
 * Cloudflare Workers - OpenAI APIプロキシ
 *
 * このWorkerはフロントエンドからのリクエストを受け取り、
 * OpenAI APIを呼び出してレスポンスを返します。
 * APIキーをブラウザに露出させずに安全にAPIを使用できます。
 */

export interface Env {
  OPENAI_API_KEY: string;
  OPENAI_MODEL?: string;
  ALLOWED_ORIGINS?: string;
}

interface CommentRequest {
  goodThing?: string;
  goodThings?: string[];
}

// CORSヘッダーを設定
function corsHeaders(origin: string, allowedOrigins: string): Headers {
  const headers = new Headers();
  const allowedOriginsList = allowedOrigins.split(',').map(o => o.trim());

  if (allowedOriginsList.includes(origin) || allowedOrigins === '*') {
    headers.set('Access-Control-Allow-Origin', origin);
  }

  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  headers.set('Content-Type', 'application/json');

  return headers;
}

// プリフライトリクエスト（OPTIONS）を処理
function handleOptions(request: Request, env: Env): Response {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = env.ALLOWED_ORIGINS || '*';

  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin, allowedOrigins),
  });
}

// OpenAI APIを呼び出す共通関数
async function callOpenAI(
  prompt: string,
  systemPrompt: string,
  apiKey: string,
  model: string
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      max_tokens: 50,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API Error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'コメントを取得できませんでした';
}

// 1つの良いことに対するコメントを取得
async function getCommentForItem(goodThing: string, env: Env): Promise<string> {
  const prompt = `
「良いこと」: ${goodThing}

この「良いこと」に対して、友達のような感覚で一言コメントをください。
ポジティブで共感的な短いメッセージにしてください（1文程度）。
`;

  const systemPrompt = '友達のように気軽にコメントする日本語アシスタントです。';
  const model = env.OPENAI_MODEL || 'gpt-4o';

  return await callOpenAI(prompt, systemPrompt, env.OPENAI_API_KEY, model);
}

// 3つの良いことに対するコメントを取得
async function getCommentForThree(goodThings: string[], env: Env): Promise<string> {
  const prompt = `
今日の3つの「良いこと」:
1. ${goodThings[0] || ''}
2. ${goodThings[1] || ''}
3. ${goodThings[2] || ''}

これらの「良いこと」に対して、友達のような感覚で一言コメントをください。
ポジティブで共感的な短いメッセージにしてください（1文程度）。
`;

  const systemPrompt = '友達のように気軽にコメントする日本語アシスタントです。';
  const model = env.OPENAI_MODEL || 'gpt-4o';

  return await callOpenAI(prompt, systemPrompt, env.OPENAI_API_KEY, model);
}

// メインのリクエストハンドラ
async function handleRequest(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = env.ALLOWED_ORIGINS || '*';

  try {
    // APIキーチェック
    if (!env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        {
          status: 500,
          headers: corsHeaders(origin, allowedOrigins),
        }
      );
    }

    // リクエストボディを解析
    const body: CommentRequest = await request.json();

    let comment: string;

    // 1つの良いことに対するコメント
    if (body.goodThing) {
      comment = await getCommentForItem(body.goodThing, env);
    }
    // 3つの良いことに対するコメント
    else if (body.goodThings && Array.isArray(body.goodThings)) {
      comment = await getCommentForThree(body.goodThings, env);
    }
    else {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        {
          status: 400,
          headers: corsHeaders(origin, allowedOrigins),
        }
      );
    }

    // 成功レスポンス
    return new Response(
      JSON.stringify({ comment }),
      {
        status: 200,
        headers: corsHeaders(origin, allowedOrigins),
      }
    );

  } catch (error) {
    console.error('Error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: corsHeaders(origin, allowedOrigins),
      }
    );
  }
}

// Cloudflare Workersのエントリーポイント
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // URLパスのチェック
    const url = new URL(request.url);

    if (url.pathname !== '/api/comment') {
      return new Response('Not Found', { status: 404 });
    }

    // OPTIONSリクエスト（CORS preflight）
    if (request.method === 'OPTIONS') {
      return handleOptions(request, env);
    }

    // POSTリクエストのみ許可
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    return handleRequest(request, env);
  },
};
