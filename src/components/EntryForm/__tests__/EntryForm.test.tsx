import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; // カスタムマッチャーの型定義をインポート
import { EntryForm } from '../EntryForm';

describe('EntryForm コンポーネント', () => {
  const mockSave = jest.fn();
  
  beforeEach(() => {
    mockSave.mockClear();
  });
  
  test('初期状態で3つの入力フィールドが表示される', () => {
    render(<EntryForm onSave={mockSave} />);
    
    const textareas = screen.getAllByRole('textbox');
    expect(textareas.length).toBe(3);
  });
  
  test('入力なしの状態で保存ボタンが無効になっている', () => {
    render(<EntryForm onSave={mockSave} />);
    
    const saveButton = screen.getByRole('button', { name: /保存する/i });
    expect(saveButton).toBeDisabled();
  });
  
  test('少なくとも1つの項目に入力すると保存ボタンが有効になる', () => {
    render(<EntryForm onSave={mockSave} />);
    
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: 'テスト入力' } });
    
    const saveButton = screen.getByRole('button', { name: /保存する/i });
    expect(saveButton).not.toBeDisabled();
  });
  
  test('フォーム送信時に入力内容がコールバックに渡される', () => {
    render(<EntryForm onSave={mockSave} />);
    
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: '良いこと1' } });
    fireEvent.change(textareas[1], { target: { value: '良いこと2' } });
    // 3つ目は空のまま
    
    const saveButton = screen.getByRole('button', { name: /保存する/i });
    fireEvent.click(saveButton);
    
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith(['良いこと1', '良いこと2']);
  });
  
  test('文字数が上限を超えるとエラーが表示される', () => {
    render(<EntryForm onSave={mockSave} maxLength={10} />);
    
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: 'これは10文字を超える長いテキストです' } });
    
    expect(screen.getByText(/10文字以内にしてください/i)).toBeInTheDocument();
    
    const saveButton = screen.getByRole('button', { name: /保存する/i });
    expect(saveButton).toBeDisabled();
  });
  
  test('disabled プロパティが true の場合、すべての入力が無効になる', () => {
    render(<EntryForm onSave={mockSave} disabled={true} />);
    
    const textareas = screen.getAllByRole('textbox');
    textareas.forEach(textarea => {
      expect(textarea).toBeDisabled();
    });
    
    const saveButton = screen.getByRole('button', { name: /保存する/i });
    expect(saveButton).toBeDisabled();
  });
  
  test('initialItems プロパティで初期値を設定できる', () => {
    const initialItems = ['テスト1', 'テスト2', 'テスト3'];
    render(<EntryForm onSave={mockSave} initialItems={initialItems} />);
    
    const textareas = screen.getAllByRole('textbox');
    expect(textareas[0]).toHaveValue('テスト1');
    expect(textareas[1]).toHaveValue('テスト2');
    expect(textareas[2]).toHaveValue('テスト3');
  });
});
