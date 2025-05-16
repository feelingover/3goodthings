// OpenAI APIのモック
const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [{ message: { content: 'モックされたAIの返答です' } }]
      })
    }
  }
};

export default jest.fn(() => mockOpenAI);
