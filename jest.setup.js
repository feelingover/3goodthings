// Jest setup file
import '@testing-library/jest-dom';

// OpenAI モジュールのためのフェッチ API モック
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
  })
);

// オンラインステータスのモック
Object.defineProperty(global.navigator, 'onLine', {
  writable: true,
  value: true
});
