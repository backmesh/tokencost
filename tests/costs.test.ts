import { describe, it, expect } from 'vitest';
import { 
  stripFtModelName, 
  countStringTokens, 
  countMessageTokens, 
  calculatePromptCost, 
  calculateCompletionCost, 
  calculateAllCostsAndTokens 
} from '../src/costs';
import { loadEnvFile } from 'process'
import path from 'path';

loadEnvFile(path.resolve(__dirname, '../.env'))

describe('stripFtModelName', () => {
  it('should strip fine-tuned model name correctly', () => {
    expect(stripFtModelName('ft:gpt-3.5-turbo:org:custom:id')).toBe('ft:gpt-3.5-turbo');
    expect(stripFtModelName('gpt-4')).toBe('gpt-4');
  });
});

describe('countStringTokens', () => {
  it('should count tokens in a string correctly', () => {
    const text = 'Hello, world!';
    const tokens = countStringTokens(text, 'gpt-4');
    expect(tokens).toBeGreaterThan(0);
    expect(typeof tokens).toBe('number');
  });

  it('should throw an error for Claude models', () => {
    expect(() => countStringTokens('Hello', 'claude-3-opus-latest')).toThrow();
  });
});

describe('countMessageTokens', () => {
  it('should count tokens in messages correctly', async () => {
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello, how are you?' }
    ];
    const tokens = await countMessageTokens(messages, 'gpt-4');
    expect(tokens).toBeGreaterThan(0);
    expect(typeof tokens).toBe('number');
  });

  it('should count tokens for Claude models', async () => {
    const messages = [
      { role: 'user', content: 'Hello, how are you?' }
    ];
    const tokens = await countMessageTokens(messages, 'claude-3-opus-latest');
    expect(tokens).toBeGreaterThan(0);
    expect(typeof tokens).toBe('number');
  });
});

describe('calculatePromptCost', () => {
  it('should calculate prompt cost correctly for string input', async () => {
    const cost = await calculatePromptCost('Hello, world!', 'gpt-4');
    expect(cost).toBeGreaterThan(0);
    expect(typeof cost).toBe('number');
  });

  it('should calculate prompt cost correctly for message array input', async () => {
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello, how are you?' }
    ];
    const cost = await calculatePromptCost(messages, 'gpt-4');
    expect(cost).toBeGreaterThan(0);
    expect(typeof cost).toBe('number');
  });
  
  it('should calculate prompt cost correctly for Claude models', async () => {
    const messages = [
      { role: 'user', content: 'Hello, how are you?' }
    ];
    const cost = await calculatePromptCost(messages, 'claude-3-opus-latest');
    expect(cost).toBeGreaterThan(0);
    expect(typeof cost).toBe('number');
  });

  it('should throw an error for invalid model', async () => {
    await expect(calculatePromptCost('Hello', 'invalid-model')).rejects.toThrow();
  });
});

describe('calculateCompletionCost', () => {
  it('should calculate completion cost correctly', async () => {
    const cost = await calculateCompletionCost('Hello, world!', 'gpt-4');
    expect(cost).toBeGreaterThan(0);
    expect(typeof cost).toBe('number');
  });

  it('should calculate completion cost correctly for HuggingFaceH4 models', async () => {
    const cost = await calculateCompletionCost('Hello, world!', 'anyscale/HuggingFaceH4/zephyr-7b-beta');
    expect(cost).toBeGreaterThan(0);
    expect(typeof cost).toBe('number');
  });
  
  it('should calculate completion cost correctly for Claude models', async () => {
    const cost = await calculateCompletionCost('Hello, world!', 'claude-3-opus-latest');
    expect(cost).toBeGreaterThan(0);
    expect(typeof cost).toBe('number');
  });

  it('should throw an error for invalid model', async () => {
    await expect(calculateCompletionCost('Hello', 'invalid-model')).rejects.toThrow();
  });
});

describe('calculateAllCostsAndTokens', () => {
  it('should calculate all costs and tokens correctly', async () => {
    const result = await calculateAllCostsAndTokens('Hello, world!', 'I am an AI assistant.', 'gpt-4');
    expect(result).toHaveProperty('promptCost');
    expect(result).toHaveProperty('promptTokens');
    expect(result).toHaveProperty('completionCost');
    expect(result).toHaveProperty('completionTokens');
    expect(result.promptCost).toBeGreaterThan(0);
    expect(result.promptTokens).toBeGreaterThan(0);
    expect(result.completionCost).toBeGreaterThan(0);
    expect(result.completionTokens).toBeGreaterThan(0);
  });
  
  it('should calculate all costs and tokens correctly for Claude models', async () => {
    const result = await calculateAllCostsAndTokens('Hello, world!', 'I am an AI assistant.', 'claude-3-opus-latest');
    expect(result).toHaveProperty('promptCost');
    expect(result).toHaveProperty('promptTokens');
    expect(result).toHaveProperty('completionCost');
    expect(result).toHaveProperty('completionTokens');
    expect(result.promptCost).toBeGreaterThan(0);
    expect(result.promptTokens).toBeGreaterThan(0);
    expect(result.completionCost).toBeGreaterThan(0);
    expect(result.completionTokens).toBeGreaterThan(0);
  });
}); 