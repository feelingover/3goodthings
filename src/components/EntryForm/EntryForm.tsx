import { useState, useEffect } from 'react';
import './EntryForm.css';

interface EntryFormProps {
  initialItems?: string[];
  maxItems?: number;
  maxLength?: number;
  onSave: (items: string[]) => void;
  onSaveAndGetComment?: (items: string[]) => void;
  disabled?: boolean;
  buttonText?: string;
}

export function EntryForm({
  initialItems = ['', '', ''],
  maxItems = 3,
  maxLength = 1000,
  onSave,
  onSaveAndGetComment,
  disabled = false,
  buttonText = '保存してコメントを取得'
}: EntryFormProps) {
  const [items, setItems] = useState<string[]>(initialItems);
  const [error, setError] = useState<string | null>(null);

  // 初期値が変更されたら、状態を更新
  // 依存配列に items を含めないことで無限ループを防止
  useEffect(() => {
    // ディープコピーを行い、参照の比較ではなく実際の値を比較
    const initialItemsCopy = JSON.stringify(initialItems);
    const currentItemsCopy = JSON.stringify(items);
    
    // 値が実際に変わった場合のみ更新
    if (initialItemsCopy !== currentItemsCopy) {
      setItems([...initialItems]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialItems)]);

  // 入力値の変更ハンドラ
  const handleChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
    
    // 文字数制限チェック
    if (value.length > maxLength) {
      setError(`入力は${maxLength}文字以内にしてください`);
    } else {
      setError(null);
    }
  };

  // フォーム送信ハンドラ
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (items.some(item => item.length > maxLength)) {
      setError(`入力は${maxLength}文字以内にしてください`);
      return;
    }
    
    // 空の項目をフィルタリング
    const filledItems = items.filter(item => item.trim() !== '');
    
    // 保存とコメント取得（優先）
    if (onSaveAndGetComment) {
      onSaveAndGetComment(filledItems);
    } else {
      // 通常の保存
      onSave(filledItems);
    }
  };

  return (
    <div className="entry-form">
      <h2>今日の3つの良いこと</h2>
      
      <form onSubmit={handleSubmit}>
        {Array.from({ length: maxItems }).map((_, index) => (
          <div key={index} className="entry-item">
            <label htmlFor={`item-${index}`}>{index + 1}.</label>
            <textarea
              id={`item-${index}`}
              value={items[index] || ''}
              onChange={(e) => handleChange(index, e.target.value)}
              placeholder="良かったことを入力してください"
              maxLength={maxLength}
              disabled={disabled}
            />
            {items[index] && (
              <div className="char-count">
                {items[index].length} / {maxLength}
              </div>
            )}
          </div>
        ))}
        
        {error && <div className="error">{error}</div>}
        
        <button 
          type="submit" 
          className="save-button"
          disabled={disabled || items.every(item => !item.trim()) || !!error}
        >
          {buttonText}
        </button>
      </form>
    </div>
  );
}
