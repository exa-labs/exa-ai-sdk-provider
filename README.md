# Exa Provider for Vercel AI SDK

Integrate Exa's web search API with Vercel AI SDK.

## Installation

```bash
npm install @exa/ai-sdk-provider
```

## Setup

```bash
export EXA_API_KEY="your-api-key"
```

## Usage

```typescript
import { exa } from '@exa/ai-sdk-provider';
import { generateText } from 'ai';

const result = await generateText({
  model: exa.answer({ text: true }),
  prompt: 'What is the latest news about SpaceX?',
});

console.log(result.text);
```

## Streaming

```typescript
import { streamText } from 'ai';

const result = await streamText({
  model: exa.answer({ text: true }),
  prompt: 'Explain quantum computing',
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

## Custom Configuration

```typescript
import { createExa } from '@exa/ai-sdk-provider';

const exa = createExa({
  apiKey: 'your-key',
  baseURL: 'https://api.exa.ai'
});
```

## License

MIT
