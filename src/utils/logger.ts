/**
 * Logger ユーティリティ
 *
 * 開発環境でのみログを出力します。
 * 本番環境ではログを抑制することで、パフォーマンスを向上させ、
 * コンソールを綺麗に保ちます。
 */

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
  }

  /**
   * デバッグレベルのログ（開発環境のみ）
   */
  debug(...args: unknown[]): void {
    if (this.isDevelopment) {
      console.log(...args);
    }
  }

  /**
   * 情報レベルのログ（開発環境のみ）
   */
  info(...args: unknown[]): void {
    if (this.isDevelopment) {
      console.info(...args);
    }
  }

  /**
   * 警告レベルのログ（常に出力）
   */
  warn(...args: unknown[]): void {
    console.warn(...args);
  }

  /**
   * エラーレベルのログ（常に出力）
   */
  error(...args: unknown[]): void {
    console.error(...args);
  }
}

// シングルトンインスタンスをエクスポート
export const logger = new Logger();
