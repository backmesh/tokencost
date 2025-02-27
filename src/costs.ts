/**
 * Costs dictionary and utility tool for counting tokens
 */

import { getEncoding, encodingForModel } from 'js-tiktoken';
import Anthropic from '@anthropic-ai/sdk';
import { TOKEN_COSTS } from './constants';

// Type definitions
export type Message = {
  role: string;
  content: string;
  name?: string;
};

/**
 * Strip the fine-tuned model name to get the base model name for cost info.
 * @param model The model name
 * @returns The base model name
 */
export function stripFtModelName(model: string): string {
  if (model.startsWith("ft:gpt-3.5-turbo")) {
    return "ft:gpt-3.5-turbo";
  }
  return model;
}

/**
 * Get the encoding for a model
 * @param model The model name
 * @returns The encoding object
 */
function getEncodingForModel(model: string) {
  try {
    // Cast the model to any to bypass TypeScript's type checking
    return encodingForModel(model as any);
  } catch (error) {
    console.warn("Model not found. Using cl100k_base encoding.");
    return getEncoding("cl100k_base");
  }
}

/**
 * Count tokens for Anthropic Claude models using their official SDK
 * @param messages Message format for prompt requests
 * @param model Name of the Claude model
 * @returns Total number of tokens in the messages
 */
async function countClaudeTokens(messages: Message[], model: string): Promise<number> {
  try {
    const anthropic = new Anthropic();
    const result = await anthropic.beta.messages.countTokens({
      model: model,
      messages: messages.map(msg => ({
        role: (msg.role === "user" || msg.role === "assistant") ? msg.role : "user",
        content: msg.content
      }))
    });
    return result.input_tokens;
  } catch (error) {
    console.error("Error counting tokens with Anthropic API:", error);
    // Fallback to rough estimate if API call fails
    return messages.reduce((total, msg) => total + Math.ceil(msg.content.length / 4), 0);
  }
}

/**
 * Count the number of tokens in a message array.
 * @param messages Message format for prompt requests
 * @param model Name of LLM to choose encoding for
 * @returns Total number of tokens in the messages
 */
export async function countMessageTokens(messages: Message[], model: string): Promise<number> {
  model = model.toLowerCase();
  model = stripFtModelName(model);

  // Use Anthropic's API for Claude models
  if (model.includes("claude-")) {
    return await countClaudeTokens(messages, model);
  }

  const encoding = getEncodingForModel(model);

  let tokensPerMessage = 3;
  let tokensPerName = 1;

  if (model.includes("gpt-3.5-turbo-0301")) {
    tokensPerMessage = 4;
    tokensPerName = -1;
  } else if (
    [
      "gpt-3.5-turbo-0613",
      "gpt-3.5-turbo-16k-0613",
      "gpt-4-0314",
      "gpt-4-32k-0314",
      "gpt-4-0613",
      "gpt-4-32k-0613",
      "gpt-4-turbo",
      "gpt-4-turbo-2024-04-09",
      "gpt-4o",
      "gpt-4o-2024-05-13",
    ].includes(model)
  ) {
    tokensPerMessage = 3;
    tokensPerName = 1;
  } else if (model.includes("gpt-3.5-turbo")) {
    console.warn("gpt-3.5-turbo may update over time. Returning num tokens assuming gpt-3.5-turbo-0613.");
    return countMessageTokens(messages, "gpt-3.5-turbo-0613");
  } else if (model.includes("gpt-4o")) {
    console.warn("Warning: gpt-4o may update over time. Returning num tokens assuming gpt-4o-2024-05-13.");
    return countMessageTokens(messages, "gpt-4o-2024-05-13");
  } else if (model.includes("gpt-4")) {
    console.warn("gpt-4 may update over time. Returning num tokens assuming gpt-4-0613.");
    return countMessageTokens(messages, "gpt-4-0613");
  } else {
    console.warn(`Token counting not specifically implemented for model ${model}. Using default values.`);
  }

  let numTokens = 0;
  for (const message of messages) {
    numTokens += tokensPerMessage;
    for (const [key, value] of Object.entries(message)) {
      numTokens += encoding.encode(value).length;
      if (key === "name") {
        numTokens += tokensPerName;
      }
    }
  }
  
  // Every reply is primed with <|start|>assistant<|message|>
  numTokens += 3;
  
  return numTokens;
}

/**
 * Count the number of tokens in a string.
 * @param prompt The text string
 * @param model The name of the encoding to use
 * @returns The number of tokens in the text string
 */
export function countStringTokens(prompt: string, model: string): number {
  model = model.toLowerCase();

  if (model.includes("/")) {
    model = model.split("/").pop() || model;
  }

  if (model.includes("claude-")) {
    throw new Error("Warning: Anthropic does not support this method. Please use the `countMessageTokens` function for the exact counts.");
  }

  const encoding = getEncodingForModel(model);
  return encoding.encode(prompt).length;
}

/**
 * Calculate the cost based on the number of tokens and the model.
 * @param numTokens The number of tokens
 * @param model The model name
 * @param tokenType Type of token ('input' or 'output')
 * @returns The calculated cost in USD
 */
export function calculateCostByTokens(numTokens: number, model: string, tokenType: 'input' | 'output'): number {
  model = model.toLowerCase();
  
  if (!TOKEN_COSTS[model]) {
    throw new Error(`Model ${model} is not implemented. Double-check your spelling, or submit an issue/PR`);
  }

  const costPerTokenKey = tokenType === 'input' ? 'input_cost_per_token' : 'output_cost_per_token';
  const costPerToken = TOKEN_COSTS[model][costPerTokenKey];

  return costPerToken * numTokens;
}

/**
 * Calculate the prompt's cost in USD.
 * @param prompt List of message objects or single string prompt
 * @param model The model name
 * @returns The calculated cost in USD
 */
export async function calculatePromptCost(prompt: Message[] | string, model: string): Promise<number> {
  model = model.toLowerCase();
  model = stripFtModelName(model);
  
  if (!TOKEN_COSTS[model]) {
    throw new Error(`Model ${model} is not implemented. Double-check your spelling, or submit an issue/PR`);
  }
  
  if (typeof prompt !== 'string' && !Array.isArray(prompt)) {
    throw new TypeError(`Prompt must be either a string or list of message objects but found ${typeof prompt} instead.`);
  }
  
  let promptTokens: number;
  if (typeof prompt === 'string' && !model.includes("claude-")) {
    promptTokens = countStringTokens(prompt, model);
  } else {
    promptTokens = await countMessageTokens(Array.isArray(prompt) ? prompt : [{ role: "user", content: prompt }], model);
  }

  return calculateCostByTokens(promptTokens, model, 'input');
}

/**
 * Calculate the completion's cost in USD.
 * @param completion Completion string
 * @param model The model name
 * @returns The calculated cost in USD
 */
export async function calculateCompletionCost(completion: string, model: string): Promise<number> {
  model = stripFtModelName(model);
  
  if (!TOKEN_COSTS[model]) {
    throw new Error(`Model ${model} is not implemented. Double-check your spelling, or submit an issue/PR`);
  }

  if (typeof completion !== 'string') {
    throw new TypeError(`Completion must be a string but found ${typeof completion} instead.`);
  }

  let completionTokens: number;
  
  if (model.includes("claude-")) {
    const completionList = [{ role: "assistant", content: completion }];
    // Anthropic appends some 13 additional tokens to the actual completion tokens
    completionTokens = await countMessageTokens(completionList, model);
    completionTokens = Math.max(0, completionTokens - 13); // Ensure we don't go negative
  } else {
    completionTokens = countStringTokens(completion, model);
  }

  return calculateCostByTokens(completionTokens, model, 'output');
}

/**
 * Calculate the prompt and completion costs and tokens in USD.
 * @param prompt List of message objects or single string prompt
 * @param completion Completion string
 * @param model The model name
 * @returns The calculated cost and tokens in USD
 */
export async function calculateAllCostsAndTokens(
  prompt: Message[] | string,
  completion: string,
  model: string
): Promise<{
  promptCost: number;
  promptTokens: number;
  completionCost: number;
  completionTokens: number;
}> {
  const promptCost = await calculatePromptCost(prompt, model);
  const completionCost = await calculateCompletionCost(completion, model);
  
  let promptTokens: number;
  if (typeof prompt === 'string' && !model.includes("claude-")) {
    promptTokens = countStringTokens(prompt, model);
  } else {
    promptTokens = await countMessageTokens(
      Array.isArray(prompt) ? prompt : [{ role: "user", content: prompt }],
      model
    );
  }

  let completionTokens: number;
  if (model.includes("claude-")) {
    const completionList = [{ role: "assistant", content: completion }];
    // Anthropic appends some 13 additional tokens to the actual completion tokens
    completionTokens = await countMessageTokens(completionList, model);
    completionTokens = Math.max(0, completionTokens - 13); // Ensure we don't go negative
  } else {
    completionTokens = countStringTokens(completion, model);
  }

  return {
    promptCost,
    promptTokens,
    completionCost,
    completionTokens,
  };
} 