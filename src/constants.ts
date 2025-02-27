import * as fs from 'fs';
import * as path from 'path';

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

// Load the static token costs from the JSON file
let modelPricesPath = path.join(__dirname, 'model_prices.json');
export const TOKEN_COSTS_STATIC = JSON.parse(fs.readFileSync(modelPricesPath, 'utf-8'));

// Initialize TOKEN_COSTS with the static costs
export let TOKEN_COSTS = { ...TOKEN_COSTS_STATIC };

/**
 * Fetch the latest token costs from the LiteLLM cost tracker.
 * @returns A promise that resolves to the token costs for each model.
 * @throws If the request fails.
 */
export async function fetchCosts(): Promise<Record<string, any>> {
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
try {
  updateTokenCosts().catch(error => {
    console.error("Failed to update token costs. Using static costs.", error);
  });
} catch (error) {
  console.error("Failed to update token costs. Using static costs.", error);
} 