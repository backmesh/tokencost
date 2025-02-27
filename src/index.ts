/**
 * tokencost-js - A JavaScript port of the tokencost library
 * 
 * This library provides utilities for calculating token counts and costs
 * for various LLM models.
 */

export {
  countMessageTokens,
  countStringTokens,
  calculateCompletionCost,
  calculatePromptCost,
  calculateAllCostsAndTokens,
  calculateCostByTokens,
  stripFtModelName,
  type Message,
  type TokenCostResult,
  type ModelCostInfo
} from './costs';

export {
  TOKEN_COSTS,
  TOKEN_COSTS_STATIC,
  updateTokenCosts,
  fetchCosts
} from './constants'; 