# tokencost-js

A JavaScript/TypeScript port of the [tokencost](https://github.com/AgentOps-AI/tokencost) library that works in any JavaScript runtime.

Demo that estimates the price for a given prompt or completion across multiple LLMs: [llmcomp.backmesh.com](https://llmcomp.backmesh.com)

This library calculates token counts and costs for prompts and completions of various LLM models. It supports Anthropic Claude models using their token counting API [endpoint](https://docs.anthropic.com/en/docs/build-with-claude/token-counting) from their official SDK. This requires for the Anthropic SDK to be configured via [environment variables](https://github.com/anthropics/anthropic-sdk-typescript/blob/e44b7ec548444fbb4ac83061e4c6785b685131ba/src/index.ts#L205) for Anthropic cost calculations to work. If you calculate the costs of a completion for an Anthropic model, it will fail unless you set these environment variables.

> [!CAUTION]
> Make sure you do not expose your `ANTHROPIC_API_KEY` on the internet! You should never expose any secrets in the bundle of a web or mobile app. The demo site supports Anthropic calculations because it uses a [Backmesh LLM API Gatekeeper](https://backmesh.com/docs) for communication with the Anthropic API. The `ANTHROPIC_BASE_URL` is set to the Backmesh URL and the `ANTHROPIC_API_KEY` is set to a JWT generated using anonymous Firebase authentication. Backmesh is an open source Backend as a Service (BaaS) available [here](https://github.com/backmesh/backmesh).


## Installation

```bash
npm install tokencost-js
```

## Usage

### Basic Usage

```typescript
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
```

### Working with Messages

```typescript
import { calculatePromptCost, type Message } from 'tokencost-js';

const messages: Message[] = [
  { role: "system", content: "You are a helpful assistant." },
  { role: "user", content: "Tell me about the solar system." },
  { role: "assistant", content: "The solar system consists of the Sun and everything that orbits around it." },
  { role: "user", content: "How many planets are there?" }
];

const cost = await calculatePromptCost(messages, "gpt-4");
console.log(`Cost to process these messages: $${cost.toFixed(6)}`);
```

### Updating Token Costs

The library comes with a static set of token costs, but you can update them with the latest costs from the LiteLLM cost tracker:

```typescript
import { updateTokenCosts, TOKEN_COSTS } from 'tokencost-js';

// Update token costs
await updateTokenCosts();
console.log("Token costs updated:", TOKEN_COSTS);
```

## Supported Models

The library supports a wide range of models including:

- OpenAI models (GPT-3.5, GPT-4, GPT-4o, etc.)
- Claude models (with estimated token counts)
- And many more