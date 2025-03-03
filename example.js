import { 
  countMessageTokens, 
  countStringTokens, 
  calculatePromptCost, 
  calculateCompletionCost, 
  calculateAllCostsAndTokens 
} from 'tokencost-js';

async function main() {
  // Example 1: Count tokens in a string
  const text = "Hello, world! This is a test message to count tokens.";
  const model = "gpt-4";
  const stringTokens = await countStringTokens(text, model);
  console.log(`Example 1: String "${text}" has ${stringTokens} tokens with model ${model}`);

  // Example 2: Count tokens in messages
  const messages = [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "What is the capital of France?" },
    { role: "assistant", content: "The capital of France is Paris." },
    { role: "user", content: "What about Germany?" }
  ];
  const messageTokens = await countMessageTokens(messages, "gpt-3.5-turbo");
  console.log(`Example 2: Messages have ${messageTokens} tokens with model gpt-3.5-turbo`);

  // Example 3: Calculate prompt cost
  const promptCost = await calculatePromptCost("What is the capital of France?", "gpt-4");
  console.log(`Example 3: Prompt cost: $${promptCost.toFixed(6)} with model gpt-4`);

  // Example 4: Calculate completion cost
  const completionCost = await calculateCompletionCost("The capital of France is Paris.", "gpt-4");
  console.log(`Example 4: Completion cost: $${completionCost.toFixed(6)} with model gpt-4`);

  // Example 5: Calculate all costs and tokens
  const allCosts = await calculateAllCostsAndTokens(
    "What is the capital of France?",
    "The capital of France is Paris.",
    "gpt-4"
  );
  console.log("Example 5: All costs and tokens:");
  console.log(`  Prompt tokens: ${allCosts.promptTokens}`);
  console.log(`  Prompt cost: $${allCosts.promptCost.toFixed(6)}`);
  console.log(`  Completion tokens: ${allCosts.completionTokens}`);
  console.log(`  Completion cost: $${allCosts.completionCost.toFixed(6)}`);
  console.log(`  Total cost: $${(allCosts.promptCost + allCosts.completionCost).toFixed(6)}`);
}

main().catch(console.error); 