/**
 * Example usage of Exa Provider with Vercel AI SDK
 * 
 * This example demonstrates how to use the Exa provider with the Vercel AI SDK.
 * 
 * Prerequisites:
 * 1. Install dependencies: npm install ai @exa/ai-sdk-provider
 * 2. Set your EXA_API_KEY environment variable
 * 
 * Run: node example.js
 */

import { exa } from './dist/index.mjs';

// Mock generateText and streamText for demonstration
// In a real application, you would import these from 'ai'
async function mockGenerateText({ model, prompt }) {
  console.log('📝 Generating text with model:', model.modelId);
  console.log('📝 Prompt:', prompt);
  
  // Simulate what the AI SDK would do
  const callOptions = {
    prompt: [
      { role: 'user', content: [{ type: 'text', text: prompt }] }
    ],
  };
  
  try {
    const result = await model.doGenerate(callOptions);
    return {
      text: result.content.find(c => c.type === 'text')?.text || '',
      sources: result.content.filter(c => c.type === 'source'),
      usage: result.usage,
    };
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

async function mockStreamText({ model, prompt }) {
  console.log('🌊 Streaming text with model:', model.modelId);
  console.log('🌊 Prompt:', prompt);
  
  // Simulate what the AI SDK would do
  const callOptions = {
    prompt: [
      { role: 'user', content: [{ type: 'text', text: prompt }] }
    ],
  };
  
  try {
    const { stream } = await model.doStream(callOptions);
    
    const reader = stream.getReader();
    const textChunks = [];
    const sources = [];
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      if (value.type === 'text-delta') {
        textChunks.push(value.delta);
        process.stdout.write(value.delta);
      } else if (value.type === 'source') {
        sources.push(value);
      }
    }
    
    console.log('\n');
    return {
      text: textChunks.join(''),
      sources,
    };
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Example 1: Basic text generation
async function example1() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  Example 1: Basic Question Answering            ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  
  const model = exa.answer({ text: true });
  
  try {
    const result = await mockGenerateText({
      model,
      prompt: 'What is the latest valuation of SpaceX?',
    });
    
    console.log('✅ Generated text:', result.text);
    console.log('📚 Sources:', result.sources.length);
  } catch (error) {
    console.log('Note: This requires a valid EXA_API_KEY to run');
  }
}

// Example 2: Streaming response
async function example2() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  Example 2: Streaming Response                   ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  
  const model = exa.answer({ 
    text: true,
    systemPrompt: 'Be concise and informative'
  });
  
  try {
    console.log('Response: ');
    const result = await mockStreamText({
      model,
      prompt: 'Explain quantum computing in simple terms',
    });
    
    console.log('✅ Streaming complete!');
    console.log('📚 Sources:', result.sources.length);
  } catch (error) {
    console.log('Note: This requires a valid EXA_API_KEY to run');
  }
}

// Example 3: Structured output
async function example3() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  Example 3: Structured Output (JSON Schema)     ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  
  const model = exa.answer({ 
    text: true,
    outputSchema: {
      type: 'object',
      required: ['summary', 'keyPoints'],
      properties: {
        summary: {
          type: 'string',
          description: 'A brief summary of the answer'
        },
        keyPoints: {
          type: 'array',
          items: { type: 'string' },
          description: 'Key points from the answer'
        }
      }
    }
  });
  
  try {
    const result = await mockGenerateText({
      model,
      prompt: 'What are the main benefits of solar energy?',
    });
    
    console.log('✅ Structured response received');
    console.log('📚 Sources:', result.sources.length);
  } catch (error) {
    console.log('Note: This requires a valid EXA_API_KEY to run');
  }
}

// Example 4: Custom configuration
async function example4() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  Example 4: Custom Provider Configuration       ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  
  // Using the default provider
  console.log('Using default provider with environment API key');
  const defaultModel = exa.answer({ text: true });
  console.log('✅ Default model created:', defaultModel.modelId);
  
  // Using custom configuration
  console.log('\nUsing custom provider configuration');
  // In a real app, you would do:
  // import { createExa } from '@exa/ai-sdk-provider';
  // const customExa = createExa({
  //   apiKey: 'your-custom-key',
  //   baseURL: 'https://api.exa.ai',
  //   headers: {
  //     'X-Custom-Header': 'value'
  //   }
  // });
  // const customModel = customExa.answer({ text: true });
  
  console.log('✅ Custom configuration supported');
}

// Example 5: Model selection
async function example5() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  Example 5: Different Ways to Create Models     ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  
  // Method 1: Using answer() helper
  const model1 = exa.answer({ text: true });
  console.log('✅ Method 1 - exa.answer():', model1.modelId);
  
  // Method 2: Using languageModel() method
  const model2 = exa.languageModel('answer', { text: false });
  console.log('✅ Method 2 - exa.languageModel():', model2.modelId);
  
  // Method 3: Direct call
  const model3 = exa('answer', { systemPrompt: 'Be helpful' });
  console.log('✅ Method 3 - exa():', model3.modelId);
}

// Example 6: Integration patterns
async function example6() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  Example 6: Vercel AI SDK Integration Patterns  ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  
  console.log('Example code for real Vercel AI SDK integration:\n');
  
  console.log(`
// 1. Install dependencies
// npm install ai @exa/ai-sdk-provider

// 2. Import and use with generateText
import { generateText } from 'ai';
import { exa } from '@exa/ai-sdk-provider';

const result = await generateText({
  model: exa.answer({ text: true }),
  prompt: 'What is the latest news about AI?',
});

console.log(result.text);
console.log('Sources:', result.experimental_providerMetadata?.exa?.citations);

// 3. Use with streamText
import { streamText } from 'ai';

const stream = await streamText({
  model: exa.answer({ 
    text: true,
    systemPrompt: 'Be concise'
  }),
  prompt: 'Explain machine learning',
});

for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}

// 4. Use with system prompts
const result = await generateText({
  model: exa.answer(),
  system: 'You are a helpful research assistant',
  prompt: 'What is quantum entanglement?',
});
  `);
}

// Run all examples
async function runExamples() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  Exa Vercel AI SDK Provider - Examples          ║');
  console.log('╚══════════════════════════════════════════════════╝');
  
  await example1();
  await example2();
  await example3();
  await example4();
  await example5();
  await example6();
  
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║  ✓ Examples completed!                           ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  
  console.log('Note: To run these examples with real API calls,');
  console.log('set your EXA_API_KEY environment variable and');
  console.log('install the full Vercel AI SDK:');
  console.log('  export EXA_API_KEY="your-api-key"');
  console.log('  npm install ai\n');
}

runExamples();

