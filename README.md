# Exa Provider

The [Exa](https://exa.ai) provider gives you access to Exa's web search API. Exa is a search engine that gives real-time web data to your AI apps. Every response includes citations from current web sources, making it great for research, fact-checking, and getting up-to-date answers.

Get your API key from the [Exa Dashboard](https://dashboard.exa.ai/api-keys).

## Setup

Install the Exa provider:

```bash
npm install exa-ai-sdk-provider
```

## Basic Usage

Import the provider and start using it:

```typescript
import { exa } from 'exa-ai-sdk-provider';
import { generateText } from 'ai';

const { text } = await generateText({
  model: exa.answer({ text: true }),
  prompt: 'What are the latest developments in quantum computing?',
});

console.log(text);
```

## Getting Citations

Web sources used to generate the response are included in the `sources` property:

```typescript
import { exa } from 'exa-ai-sdk-provider';
import { generateText } from 'ai';

const { text, sources } = await generateText({
  model: exa.answer({ text: true }),
  prompt: 'What are the latest developments in quantum computing?',
});

console.log(sources);
```

## Full Citation Details

Get more details about citations (author, publish date, etc.) from `providerMetadata`:

```typescript
const result = await generateText({
  model: exa.answer({ text: true }),
  prompt: 'What are the latest developments in quantum computing?',
});

console.log(result.providerMetadata);
// {
//   exa: {
//     citations: [
//       {
//         id: "...",
//         url: "https://example.com/article",
//         title: "Latest Quantum Computing Advances",
//         author: "Jane Doe",
//         publishedDate: "2025-10-01",
//         text: "...",
//         image: "https://...",
//         favicon: "https://..."
//       }
//     ]
//   }
// }
```

## Model Settings

The `answer` method accepts these settings:

- **text** - Set to `true` to include full text content from search results

- **systemPrompt** - Add a custom prompt to guide how Exa responds

- **outputSchema** - Define a JSON structure for the response (can't be used with streaming)

## Examples

### Stream Text

```typescript
import { exa } from 'exa-ai-sdk-provider';
import { streamText } from 'ai';

const result = await streamText({
  model: exa.answer({ text: true }),
  prompt: 'Explain the current state of renewable energy',
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

### Custom System Prompt

```typescript
import { exa } from 'exa-ai-sdk-provider';
import { generateText } from 'ai';

const { text } = await generateText({
  model: exa.answer({ 
    text: true,
    systemPrompt: 'You are a technical expert. Give detailed answers with specific examples.'
  }),
  prompt: 'How does WebAssembly improve web performance?',
});

console.log(text);
```

### Structured Output

Get responses in a specific JSON format:

```typescript
import { exa } from 'exa-ai-sdk-provider';
import { generateText } from 'ai';

const { text } = await generateText({
  model: exa.answer({ 
    text: true,
    outputSchema: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        keyPoints: { type: 'array', items: { type: 'string' } }
      }
    }
  }),
  prompt: 'Summarize the key developments in AI this year',
});

console.log(text);
```

## Custom Configuration

You can create a custom provider instance with your own settings:

```typescript
import { createExa } from 'exa-ai-sdk-provider';

const exa = createExa({
  apiKey: process.env.EXA_API_KEY,
});
```

## What the Model Supports

| Feature           | Supported |
| ----------------- | --------- |
| Streaming         | ✓         |
| Citations         | ✓         |
| Structured Output | ✓         |

## Learn More

- [Exa Website](https://exa.ai)
- [Exa Documentation](https://docs.exa.ai)
- [Get API Key](https://dashboard.exa.ai/api-keys)
- [GitHub Repository](https://github.com/exa-labs/exa-ai-sdk-provider)
- [npm Package](https://www.npmjs.com/package/exa-ai-sdk-provider)

## License

MIT
