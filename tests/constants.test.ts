import { describe, it, expect } from 'vitest';
import { TOKEN_COSTS, TOKEN_COSTS_STATIC } from '../src/constants';

describe('TOKEN_COSTS', () => {
  it('should be an object with model information', () => {
    expect(TOKEN_COSTS).toBeDefined();
    expect(typeof TOKEN_COSTS).toBe('object');
    expect(Object.keys(TOKEN_COSTS).length).toBeGreaterThan(0);
  });

  it('should have gpt-4 model information', () => {
    expect(TOKEN_COSTS['gpt-4']).toBeDefined();
    expect(TOKEN_COSTS['gpt-4'].input_cost_per_token).toBeDefined();
    expect(TOKEN_COSTS['gpt-4'].output_cost_per_token).toBeDefined();
    expect(typeof TOKEN_COSTS['gpt-4'].input_cost_per_token).toBe('number');
    expect(typeof TOKEN_COSTS['gpt-4'].output_cost_per_token).toBe('number');
  });
});

describe('TOKEN_COSTS_STATIC', () => {
  it('should be an object with model information', () => {
    expect(TOKEN_COSTS_STATIC).toBeDefined();
    expect(typeof TOKEN_COSTS_STATIC).toBe('object');
    expect(Object.keys(TOKEN_COSTS_STATIC).length).toBeGreaterThan(0);
  });

  it('should have the same structure as TOKEN_COSTS', () => {
    const staticKeys = Object.keys(TOKEN_COSTS_STATIC);
    expect(staticKeys.length).toBeGreaterThan(0);
    
    // Check a sample model
    if (staticKeys.includes('gpt-4')) {
      expect(TOKEN_COSTS_STATIC['gpt-4'].input_cost_per_token).toBeDefined();
      expect(TOKEN_COSTS_STATIC['gpt-4'].output_cost_per_token).toBeDefined();
    }
  });
}); 