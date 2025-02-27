import { describe, it, expect } from 'vitest';
import { 
  stripFtModelName, 
  countStringTokens, 
  countMessageTokens, 
  calculatePromptCost, 
  calculateCompletionCost, 
  calculateAllCostsAndTokens 
} from '../src/costs';

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
    expect(() => countStringTokens('Hello', 'claude-3-opus')).toThrow();
  });
});

describe('countMessageTokens', () => {
  it('should count tokens in messages correctly', () => {
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello, how are you?' }
    ];
    const tokens = countMessageTokens(messages, 'gpt-4');
    expect(tokens).toBeGreaterThan(0);
    expect(typeof tokens).toBe('number');
  });

  it('should estimate tokens for Claude models', () => {
    const messages = [
      { role: 'user', content: 'Hello, how are you?' }
    ];
    const tokens = countMessageTokens(messages, 'claude-3-opus');
    expect(tokens).toBeGreaterThan(0);
    expect(typeof tokens).toBe('number');
  });
});

describe('calculatePromptCost', () => {
  it('should calculate prompt cost correctly for string input', () => {
    const cost = calculatePromptCost('Hello, world!', 'gpt-4');
    expect(cost).toBeGreaterThan(0);
    expect(typeof cost).toBe('number');
  });

  it('should calculate prompt cost correctly for message array input', () => {
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello, how are you?' }
    ];
    const cost = calculatePromptCost(messages, 'gpt-4');
    expect(cost).toBeGreaterThan(0);
    expect(typeof cost).toBe('number');
  });

  it('should throw an error for invalid model', () => {
    expect(() => calculatePromptCost('Hello', 'invalid-model')).toThrow();
  });
});

describe('calculateCompletionCost', () => {
  it('should calculate completion cost correctly', () => {
    const cost = calculateCompletionCost('Hello, world!', 'gpt-4');
    expect(cost).toBeGreaterThan(0);
    expect(typeof cost).toBe('number');
  });

  it('should throw an error for invalid model', () => {
    expect(() => calculateCompletionCost('Hello', 'invalid-model')).toThrow();
  });
});

describe('calculateAllCostsAndTokens', () => {
  it('should calculate all costs and tokens correctly', () => {
    const result = calculateAllCostsAndTokens('Hello, world!', 'I am an AI assistant.', 'gpt-4');
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