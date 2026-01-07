import { useState, useEffect, memo } from 'react';
import { getAiComment, getAiCommentForItem, checkNetworkConnection } from '../../services/openai';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import './AiComment.css';

interface AiCommentItemProps {
  item: string;
  itemIndex: number;
  initialComment?: string;
  hasRequestedComment: boolean;
  onCommentSaved: (itemIndex: number, comment: string) => void;
  onCommentRequested: (itemIndex: number) => void;
}

interface AiCommentProps {
  items: string[];
  initialComment?: string;
  hasRequestedComment: boolean;
  onCommentSaved: (comment: string) => void;
  onCommentRequested: () => void;
}

  // 単一項目用のAIコメントコンポーネント
export const AiCommentItem = memo(function AiCommentItem({
  item,
  itemIndex,
  initialComment,
  hasRequestedComment,
  onCommentSaved,
  onCommentRequested
}: AiCommentItemProps) {
  const [comment, setComment] = useState<string | undefined>(initialComment);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useNetworkStatus();
  
  // initialCommentが変更された場合にcommentステートを更新
  useEffect(() => {
    if (initialComment !== undefined) {
      setComment(initialComment);
    }
  }, [initialComment]);

  // コメント取得ハンドラ
  const handleGetComment = async () => {
    // 項目が空の場合はエラー
    if (!item.trim()) {
      setError('項目を入力してください');
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
      
      const aiComment = await getAiCommentForItem(item, checkNetworkConnection);
      setComment(aiComment);
      onCommentSaved(itemIndex, aiComment);
      
      // コメントリクエスト済みとしてマーク
      onCommentRequested(itemIndex);
    } catch (err) {
      setError(`コメントの取得に失敗しました: ${(err as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // コンテンツをレンダリング
  const renderContent = () => {
    // 重要: 先に保存されているコメントの表示をチェック
    // コメントが保存済みの場合（コメントがあるか、initialCommentが存在する場合）
    if (comment || initialComment) {
      const displayComment = comment || initialComment;
      return (
        <div className="ai-comment-content">
          <p className="comment-text">{displayComment}</p>
        </div>
      );
    }
    
    // 項目が入力されていない場合
    if (!item.trim()) {
      return <p className="ai-comment-info">項目を入力するとAIからのコメントを表示できます</p>;
    }

    // オンラインでコメントがまだ取得されていない場合
    if (isOnline) {
      return (
        <div className="ai-comment-actions">
          <button
            className="get-comment-button"
            onClick={handleGetComment}
            disabled={isLoading}
            aria-busy={isLoading}
          >
            <span aria-live="polite" aria-atomic="true">
              {isLoading ? 'コメント取得中...' : 'AIコメントを取得'}
            </span>
          </button>
        </div>
      );
    }

    // オフラインでコメントがまだ取得されていない場合
    if (!isOnline && !hasRequestedComment) {
      return (
        <div className="ai-comment-offline">
          <p>オフライン中のためコメントを取得できません</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="ai-comment-item">
      {error && <div className="ai-comment-error" role="alert" aria-live="assertive">{error}</div>}
      {renderContent()}
    </div>
  );
});

// 従来の複数項目用AIコメントコンポーネント（後方互換性のため維持）
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
            aria-busy={isLoading}
          >
            <span aria-live="polite" aria-atomic="true">
              {isLoading ? 'コメント取得中...' : 'AIコメントを取得'}
            </span>
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
