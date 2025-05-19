import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EntryForm } from '../EntryForm';

describe('EntryForm コンポーネント', () => {
  const mockSave = jest.fn();
  const mockSaveAndGetComment = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('初期状態で3つの入力フィールドが表示される', () => {
    render(<EntryForm onSave={mockSave} />);
    
    const textareas = screen.getAllByRole('textbox');
    expect(textareas.length).toBe(3);
  });
  
  test('入力なしの状態で保存ボタンが無効になっている', () => {
    render(<EntryForm onSave={mockSave} />);
    
    const saveButton = screen.getByRole('button', { name: /保存してコメントを取得/i });
    expect(saveButton).toBeDisabled();
  });
  
  test('少なくとも1つの項目に入力すると保存ボタンが有効になる', () => {
    render(<EntryForm onSave={mockSave} />);
    
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: 'テスト入力' } });
    
    const saveButton = screen.getByRole('button', { name: /保存してコメントを取得/i });
    expect(saveButton).not.toBeDisabled();
  });
  
  test('フォーム送信時に入力内容がコールバックに渡される', () => {
    render(<EntryForm onSave={mockSave} />);
    
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: '良いこと1' } });
    fireEvent.change(textareas[1], { target: { value: '良いこと2' } });
    // 3つ目は空のまま
    
    const saveButton = screen.getByRole('button', { name: /保存してコメントを取得/i });
    fireEvent.click(saveButton);
    
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith(['良いこと1', '良いこと2']);
  });
  
  test('文字数が上限を超えるとエラーが表示され、保存ボタンが無効になる', () => {
    render(<EntryForm onSave={mockSave} maxLength={10} />);
    
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: 'これは10文字を超える長いテキストです' } });
    
    expect(screen.getByText(/10文字以内にしてください/i)).toBeInTheDocument();
    
    const saveButton = screen.getByRole('button', { name: /保存してコメントを取得/i });
    expect(saveButton).toBeDisabled();
  });
  
  test('disabled プロパティが true の場合、すべての入力が無効になる', () => {
    render(<EntryForm onSave={mockSave} disabled={true} />);
    
    const textareas = screen.getAllByRole('textbox');
    textareas.forEach(textarea => {
      expect(textarea).toBeDisabled();
    });
    
    const saveButton = screen.getByRole('button', { name: /保存してコメントを取得/i });
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
  
  test('文字数ぎりぎりの境界値テスト（許可される場合）', () => {
    const maxLength = 5;
    render(<EntryForm onSave={mockSave} maxLength={maxLength} />);
    
    const textareas = screen.getAllByRole('textbox');
    // 文字数ちょうどの入力
    fireEvent.change(textareas[0], { target: { value: '12345' } });
    
    // エラーが表示されないこと
    expect(screen.queryByText(/文字以内にしてください/i)).not.toBeInTheDocument();
    
    // 文字数カウンターが表示されること
    expect(screen.getByText(`5 / ${maxLength}`)).toBeInTheDocument();
    
    const saveButton = screen.getByRole('button', { name: /保存してコメントを取得/i });
    expect(saveButton).not.toBeDisabled();
  });
  
  test('文字数ぴったりから1文字超えた場合のエラー表示', () => {
    const maxLength = 5;
    render(<EntryForm onSave={mockSave} maxLength={maxLength} />);
    
    const textareas = screen.getAllByRole('textbox');
    
    // 最初は文字数ぎりぎり
    fireEvent.change(textareas[0], { target: { value: '12345' } });
    expect(screen.queryByText(/文字以内にしてください/i)).not.toBeInTheDocument();
    
    // 1文字追加してエラーになることを確認
    fireEvent.change(textareas[0], { target: { value: '123456' } });
    expect(screen.getByText(/5文字以内にしてください/i)).toBeInTheDocument();
  });
  
  test('複数のフィールドに同時入力した場合の挙動', () => {
    render(<EntryForm onSave={mockSave} />);
    
    const textareas = screen.getAllByRole('textbox');
    
    // 複数フィールドに入力
    fireEvent.change(textareas[0], { target: { value: '良いこと1' } });
    fireEvent.change(textareas[1], { target: { value: '良いこと2' } });
    fireEvent.change(textareas[2], { target: { value: '良いこと3' } });
    
    // 全て送信されることを確認
    const saveButton = screen.getByRole('button', { name: /保存してコメントを取得/i });
    fireEvent.click(saveButton);
    
    expect(mockSave).toHaveBeenCalledWith(['良いこと1', '良いこと2', '良いこと3']);
  });
  
  test('onSaveAndGetComment プロパティが優先的に呼び出される', () => {
    render(<EntryForm onSave={mockSave} onSaveAndGetComment={mockSaveAndGetComment} />);
    
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: 'テスト' } });
    
    const saveButton = screen.getByRole('button', { name: /保存してコメントを取得/i });
    fireEvent.click(saveButton);
    
    expect(mockSaveAndGetComment).toHaveBeenCalledWith(['テスト']);
    expect(mockSave).not.toHaveBeenCalled();
  });
  
  test('buttonText プロパティでボタンテキストをカスタマイズできる', () => {
    render(<EntryForm onSave={mockSave} buttonText="カスタムボタン" />);
    
    expect(screen.getByRole('button', { name: 'カスタムボタン' })).toBeInTheDocument();
  });
  
  test('initialItemsが後から変更された場合の挙動', async () => {
    // 初期レンダリング
    const { rerender } = render(<EntryForm onSave={mockSave} initialItems={['初期値1', '初期値2', '初期値3']} />);
    
    // 初期値の確認
    const textareas = screen.getAllByRole('textbox');
    expect(textareas[0]).toHaveValue('初期値1');
    
    // 新しいpropsでの再レンダリング
    rerender(<EntryForm onSave={mockSave} initialItems={['新しい値1', '新しい値2', '新しい値3']} />);
    
    // 新しい値が反映されていることを確認
    const updatedTextareas = screen.getAllByRole('textbox');
    expect(updatedTextareas[0]).toHaveValue('新しい値1');
    expect(updatedTextareas[1]).toHaveValue('新しい値2');
    expect(updatedTextareas[2]).toHaveValue('新しい値3');
  });
  
  test('フォーム送信後に入力がクリアされないことを確認', () => {
    render(<EntryForm onSave={mockSave} />);
    
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: 'テスト入力' } });
    
    const saveButton = screen.getByRole('button', { name: /保存してコメントを取得/i });
    fireEvent.click(saveButton);
    
    // 入力値が保持されていることを確認
    expect(textareas[0]).toHaveValue('テスト入力');
  });
  
  test('空白文字のみの入力は保存時にフィルタリングされることを確認', () => {
    render(<EntryForm onSave={mockSave} />);
    
    const textareas = screen.getAllByRole('textbox');
    fireEvent.change(textareas[0], { target: { value: '   ' } });
    
    // 空白のみでは保存ボタンは無効のまま
    const saveButton = screen.getByRole('button', { name: /保存してコメントを取得/i });
    expect(saveButton).toBeDisabled();
    
    // 実際の値を持つ入力を追加
    fireEvent.change(textareas[1], { target: { value: '実際の内容' } });
    
    // 今度はボタンが有効になる
    expect(saveButton).not.toBeDisabled();
    
    // クリック
    fireEvent.click(saveButton);
    
    // 空白のみの入力は除外され、実際の内容のみが送信される
    expect(mockSave).toHaveBeenCalledWith(['実際の内容']);
  });
});
