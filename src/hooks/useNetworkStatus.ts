import { useState, useEffect } from 'react';

interface NetworkStatus {
  isOnline: boolean;
}

/**
 * ネットワーク接続状態を監視するカスタムフック
 * @returns ネットワーク状態 (オンライン/オフライン)
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    // オンラインになったときのイベントリスナー
    const handleOnline = () => {
      setIsOnline(true);
    };

    // オフラインになったときのイベントリスナー
    const handleOffline = () => {
      setIsOnline(false);
    };

    // イベントリスナーの登録
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // コンポーネントのクリーンアップ時にイベントリスナーを削除
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}
