import { useState, useEffect } from 'react';
import { db, type Theme } from '../db/database';

export interface UseThemeReturn {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => Promise<void>;
  isLoading: boolean;
}

// システムのprefers-color-schemeを検出
const getSystemTheme = (): 'light' | 'dark' => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

// effectiveThemeを計算（systemの場合はシステム設定を使用）
const calculateEffectiveTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
};

export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>('system');
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(() => getSystemTheme());
  const [isLoading, setIsLoading] = useState(true);

  // IndexedDBから設定を読み込み
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await db.getThemeSetting();
        if (savedTheme) {
          setThemeState(savedTheme);
          setEffectiveTheme(calculateEffectiveTheme(savedTheme));
        } else {
          // デフォルトは'system'
          setEffectiveTheme(getSystemTheme());
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, []);

  // システムのprefers-color-scheme変更を監視
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setEffectiveTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // effectiveThemeが変更されたらdata-theme属性を更新
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }, [effectiveTheme]);

  // テーマを変更
  const setTheme = async (newTheme: Theme) => {
    try {
      setThemeState(newTheme);
      const newEffectiveTheme = calculateEffectiveTheme(newTheme);
      setEffectiveTheme(newEffectiveTheme);
      await db.saveThemeSetting(newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
      throw error;
    }
  };

  return {
    theme,
    effectiveTheme,
    setTheme,
    isLoading
  };
}
