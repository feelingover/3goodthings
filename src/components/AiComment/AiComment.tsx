import { useState } from 'react';
import { getAiComment } from '../../services/openai';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import './AiComment.css';

interface AiCommentProps {
  items: string[];
  initialComment?: string;
  hasRequestedComment: boolean;
  onCommentSaved: (comment: string) => void;
  onCommentRequested: () => void;
}

export function AiComment({
  items,
  initialComment,
  hasRequestedComment,
  onCommentSaved,
  onCommentRequested
}: AiCommentProps) {
  const [comment, setComment] = useState<string | undefined>(initialComment);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useNetworkStatus();

  // コメント取得ハンドラ
  const handleGetComment = async () => {
    // 項目が3つない場合はエラー
    if (items.length < 3 || items.some(item => !item.trim())) {
      setError('3つすべての項目を入力してください');
      return;
    }

    // オフラインの場合はエラー
    if (!isOnline) {
      setError('オフラインのため、コメントを取得できません。ネットワーク接続を確認してください。');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const aiComment = await getAiComment(items);
      setComment(aiComment);
      onCommentSaved(aiComment);
      
      // コメントリクエスト済みとしてマーク
      onCommentRequested();
    } catch (err) {
      setError(`コメントの取得に失敗しました: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // コンテンツをレンダリング
  const renderContent = () => {
    // すべての項目が入力されていない場合
    if (items.length < 3 || items.some(item => !item.trim())) {
      return <p className="ai-comment-info">3つの項目をすべて入力すると、AIからのコメントが表示されます</p>;
    }

    // コメントが既に保存済みの場合
    if (comment && hasRequestedComment) {
      return (
        <div className="ai-comment-content">
          <h3>AIからのコメント</h3>
          <p className="comment-text">{comment}</p>
        </div>
      );
    }

    // オンラインでコメントがまだ取得されていない場合
    if (isOnline && !hasRequestedComment) {
      return (
        <div className="ai-comment-actions">
          <button 
            className="get-comment-button" 
            onClick={handleGetComment} 
            disabled={isLoading}
          >
            {isLoading ? 'コメント取得中...' : 'AIコメントを取得'}
          </button>
        </div>
      );
    }

    // オフラインでコメントがまだ取得されていない場合
    if (!isOnline && !hasRequestedComment) {
      return (
        <div className="ai-comment-offline">
          <p>オフラインのため、AIコメントを取得できません</p>
          <p>オンラインになったら、コメントを取得できます</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="ai-comment">
      {error && <div className="ai-comment-error">{error}</div>}
      {renderContent()}
    </div>
  );
}
