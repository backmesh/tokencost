# tokencost-js

A JavaScript/TypeScript port of the [tokencost](https://github.com/AgentOps-AI/tokencost) library that works in any JavaScript runtime.

This library calculates token counts and costs for prompts and completions of various LLM models. It supports Anthropic Claude models using their token counting API [endpoint](https://docs.anthropic.com/en/docs/build-with-claude/token-counting) from their official SDK. This requires for the Anthropic SDK to be configured via [environment variables](https://github.com/anthropics/anthropic-sdk-typescript/blob/e44b7ec548444fbb4ac83061e4c6785b685131ba/src/index.ts#L205) for Anthropic cost calculations to work. If you calculate the costs of a completion for an Anthropic model, it will fail unless you set these environment variables.

> [!CAUTION]
> Make sure you not expose your `ANTHROPIC_API_KEY` on the internet! You should never expose any secrets in the bundle of a web or mobile app. The demo site supports Anthropic calculations because it uses a [Backmesh LLM API Gatekeeper](https://backmesh.com/docs) for communication with the Anthropic API. The `ANTHROPIC_BASE_URL` is set to the Backmesh URL and the `ANTHROPIC_API_KEY` is set to a JWT generated using anonymous Firebase authentication. Backmesh is an open source Backend as a Service (BaaS) available [here](https://github.com/backmesh/backmesh).


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

// Count tokens in a string
const stringTokens = countStringTokens("Hello, world!", "gpt-4");
console.log(`String tokens: ${stringTokens}`);

// Count tokens in messages
const messages = [
  { role: "user", content: "Hello, how are you?" },
  { role: "assistant", content: "I'm doing well, thank you for asking!" }
];
const messageTokens = countMessageTokens(messages, "gpt-3.5-turbo");
console.log(`Message tokens: ${messageTokens}`);

// Calculate prompt cost
const promptCost = calculatePromptCost("What is the capital of France?", "gpt-4");
console.log(`Prompt cost: $${promptCost.toFixed(6)}`);

// Calculate completion cost
const completionCost = calculateCompletionCost("The capital of France is Paris.", "gpt-4");
console.log(`Completion cost: $${completionCost.toFixed(6)}`);

// Calculate all costs and tokens
const allCosts = calculateAllCostsAndTokens(
  "What is the capital of France?",
  "The capital of France is Paris.",
  "gpt-4"
);
console.log(allCosts);
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

const cost = calculatePromptCost(messages, "gpt-4");
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