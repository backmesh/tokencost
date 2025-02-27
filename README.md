# tokencost-js

A JavaScript/TypeScript port of the [tokencost](https://github.com/AgentOps-AI/tokencost) library that works in any JavaScript runtime.

This library provides utilities for calculating token counts and costs for various LLM models.

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

## License

ISC 