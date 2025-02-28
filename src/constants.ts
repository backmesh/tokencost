// Import fs and path conditionally for browser compatibility
import { ModelCostInfo } from './costs';
import staticCostsRaw from './model_prices.json';

/**
 * Prompt (aka context) tokens are based on number of words + other chars (eg spaces and punctuation) in input.
 * Completion tokens are similarly based on how long the model's response is.
 * Prompt tokens + completion tokens = total tokens.
 * The max total limit is typically 1 more than the prompt token limit, so there's space for at least one completion token.
 * 
 * You can use OpenAI's tokenizer to see how many tokens your phrase is:
 * https://platform.openai.com/tokenizer
 */

// URL for fetching the latest token costs
export const PRICES_URL = "https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json";

// Filter and export the static token costs from the JSON file
export const TOKEN_COSTS_STATIC: Record<string, ModelCostInfo> = Object.entries(staticCostsRaw)
  .filter(([_, value]) =>
    typeof value === 'object' &&
    'input_cost_per_token' in value &&
    'output_cost_per_token' in value
  )
  .reduce((acc, [key, value]) => {
    acc[key] = value as ModelCostInfo;
    return acc;
  }, {} as Record<string, ModelCostInfo>);

// Initialize TOKEN_COSTS with the static costs
export let TOKEN_COSTS: Record<string, ModelCostInfo> = { ...TOKEN_COSTS_STATIC };

/**
 * Fetch the latest token costs from the LiteLLM cost tracker.
 * @returns A promise that resolves to the token costs for each model.
 * @throws If the request fails.
 */
export async function fetchCosts(): Promise<Record<string, ModelCostInfo>> {
  try {
    const response = await fetch(PRICES_URL);
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error(`Failed to fetch token costs, status code: ${response.status}`);
    }
  } catch (error) {
    console.error(`Failed to fetch token costs: ${error}`);
    throw error;
  }
}

/**
 * Update the TOKEN_COSTS object with the latest costs from the LiteLLM cost tracker.
 */
export async function updateTokenCosts(): Promise<void> {
  try {
    const fetchedCosts = await fetchCosts();
    // Update the TOKEN_COSTS with the fetched costs
    TOKEN_COSTS = { ...TOKEN_COSTS, ...fetchedCosts };
    // Remove 'sample_spec' if it exists
    delete TOKEN_COSTS.sample_spec;
  } catch (error) {
    console.error(`Failed to update TOKEN_COSTS: ${error}`);
    throw error;
  }
}

// Try to update the token costs when the module is loaded
// Only in browser environment
if (typeof window !== 'undefined') {
  try {
    updateTokenCosts().catch(error => {
      console.error("Failed to update token costs. Using static costs.", error);
    });
  } catch (error) {
    console.error("Failed to update token costs. Using static costs.", error);
  }
} 