// Test file for Exa Vercel AI SDK Provider
// Run with: node test.js

import { exa, createExa } from './dist/index.mjs';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function assert(condition, message) {
  if (!condition) {
    log('red', `✗ FAILED: ${message}`);
    throw new Error(message);
  }
  log('green', `✓ PASSED: ${message}`);
}

// Test 1: Provider Interface Compliance
async function testProviderInterface() {
  log('blue', '\n=== Test 1: Provider Interface Compliance ===');
  
  // Check default provider exists
  assert(typeof exa === 'function', 'Default exa provider is a function');
  
  // Check languageModel method exists
  assert(typeof exa.languageModel === 'function', 'exa.languageModel is a function');
  
  // Check answer method exists
  assert(typeof exa.answer === 'function', 'exa.answer is a function');
  
  // Check textEmbeddingModel throws error
  try {
    exa.textEmbeddingModel('test');
    assert(false, 'textEmbeddingModel should throw error');
  } catch (e) {
    assert(e.message === 'Not supported', 'textEmbeddingModel throws correct error');
  }
  
  // Check imageModel throws error
  try {
    exa.imageModel('test');
    assert(false, 'imageModel should throw error');
  } catch (e) {
    assert(e.message === 'Not supported', 'imageModel throws correct error');
  }
  
  // Check createExa function
  const customExa = createExa({
    apiKey: 'test-key',
    baseURL: 'https://custom.api.com',
  });
  assert(typeof customExa === 'function', 'createExa returns a function');
  
  log('green', 'Provider interface compliance tests passed!');
}

// Test 2: Model Creation
async function testModelCreation() {
  log('blue', '\n=== Test 2: Model Creation ===');
  
  // Test answer model creation
  const model = exa.answer({ text: true, systemPrompt: 'Be concise' });
  assert(model !== null, 'Model created successfully');
  assert(model.specificationVersion === 'v2', 'Model has correct specification version');
  assert(model.provider === 'exa.answer', 'Model has correct provider');
  assert(model.modelId === 'answer', 'Model has correct modelId');
  assert(typeof model.doGenerate === 'function', 'Model has doGenerate method');
  assert(typeof model.doStream === 'function', 'Model has doStream method');
  assert(typeof model.supportedUrls === 'object', 'Model has supportedUrls property');
  
  // Test languageModel method
  const model2 = exa.languageModel('answer', { text: false });
  assert(model2 !== null, 'Model created via languageModel method');
  
  // Test invalid model ID
  try {
    exa.languageModel('invalid-model');
    assert(false, 'Should throw error for invalid model ID');
  } catch (e) {
    assert(
      e.message.includes('Unknown Exa model'),
      'Throws error for invalid model ID'
    );
  }
  
  // Test that provider cannot be called with new keyword
  // Note: Arrow functions automatically prevent construction
  try {
    new exa('answer');
    assert(false, 'Should throw error when called with new keyword');
  } catch (e) {
    assert(
      e.message.includes('cannot be called with the new keyword') || 
      e.message.includes('not a constructor'),
      'Throws error when called with new keyword'
    );
  }
  
  log('green', 'Model creation tests passed!');
}

// Test 3: Settings and Configuration
async function testSettingsAndConfiguration() {
  log('blue', '\n=== Test 3: Settings and Configuration ===');
  
  // Test various settings
  const model1 = exa.answer({ text: true });
  assert(model1 !== null, 'Model with text setting created');
  
  const model2 = exa.answer({ 
    systemPrompt: 'Be helpful',
    text: false 
  });
  assert(model2 !== null, 'Model with systemPrompt setting created');
  
  const model3 = exa.answer({ 
    outputSchema: {
      type: 'object',
      properties: {
        answer: { type: 'string' }
      }
    }
  });
  assert(model3 !== null, 'Model with outputSchema setting created');
  
  // Test custom provider configuration
  const customExa = createExa({
    baseURL: 'https://custom.exa.ai',
    apiKey: 'custom-key',
    headers: {
      'X-Custom-Header': 'value',
    },
  });
  const customModel = customExa.answer();
  assert(customModel !== null, 'Custom provider model created');
  
  log('green', 'Settings and configuration tests passed!');
}

// Test 4: Type Safety
async function testTypeSafety() {
  log('blue', '\n=== Test 4: Type Safety ===');
  
  // Test that model has correct structure
  const model = exa.answer();
  
  assert(
    typeof model.specificationVersion === 'string',
    'specificationVersion is a string'
  );
  assert(
    typeof model.provider === 'string',
    'provider is a string'
  );
  assert(
    typeof model.modelId === 'string',
    'modelId is a string'
  );
  assert(
    typeof model.doGenerate === 'function',
    'doGenerate is a function'
  );
  assert(
    typeof model.doStream === 'function',
    'doStream is a function'
  );
  assert(
    typeof model.supportedUrls === 'object',
    'supportedUrls is an object'
  );
  
  log('green', 'Type safety tests passed!');
}

// Test 5: Error Scenarios
async function testErrorScenarios() {
  log('blue', '\n=== Test 5: Error Scenarios ===');
  
  // Test invalid model ID
  try {
    exa.languageModel('nonexistent');
    assert(false, 'Should throw error for nonexistent model');
  } catch (e) {
    assert(
      e.message.includes('Unknown Exa model'),
      'Correct error for nonexistent model'
    );
  }
  
  // Test calling with new keyword (already tested in Test 2)
  try {
    new exa('answer');
    assert(false, 'Should throw error when using new keyword');
  } catch (e) {
    assert(
      e.message.includes('cannot be called with the new keyword') || 
      e.message.includes('not a constructor'),
      'Correct error for new keyword usage'
    );
  }
  
  log('green', 'Error scenario tests passed!');
}

// Test 6: Integration with Vercel AI SDK patterns
async function testVercelAISDKIntegration() {
  log('blue', '\n=== Test 6: Vercel AI SDK Integration Patterns ===');
  
  // Test that model can be used in generateText pattern
  const model = exa.answer({ text: true, systemPrompt: 'Be concise' });
  
  // Simulate what generateText would do - create call options
  const callOptions = {
    prompt: [
      { role: 'user', content: [{ type: 'text', text: 'What is AI?' }] }
    ],
    abortSignal: undefined,
  };
  
  // Verify model has required methods
  assert(
    typeof model.doGenerate === 'function',
    'Model has doGenerate for non-streaming'
  );
  assert(
    typeof model.doStream === 'function',
    'Model has doStream for streaming'
  );
  
  log('green', 'Vercel AI SDK integration pattern tests passed!');
}

// Main test runner
async function runAllTests() {
  log('yellow', '\n╔════════════════════════════════════════════════╗');
  log('yellow', '║  Exa Vercel AI SDK Provider - Test Suite     ║');
  log('yellow', '╚════════════════════════════════════════════════╝');
  
  try {
    await testProviderInterface();
    await testModelCreation();
    await testSettingsAndConfiguration();
    await testTypeSafety();
    await testErrorScenarios();
    await testVercelAISDKIntegration();
    
    log('green', '\n╔════════════════════════════════════════════════╗');
    log('green', '║  ✓ ALL TESTS PASSED!                          ║');
    log('green', '╚════════════════════════════════════════════════╝\n');
    
    log('blue', 'Summary:');
    log('green', '  ✓ Provider interface compliance');
    log('green', '  ✓ Model creation and validation');
    log('green', '  ✓ Settings and configuration');
    log('green', '  ✓ Type safety');
    log('green', '  ✓ Error handling');
    log('green', '  ✓ Vercel AI SDK integration patterns');
    
  } catch (error) {
    log('red', '\n╔════════════════════════════════════════════════╗');
    log('red', '║  ✗ TESTS FAILED                                ║');
    log('red', '╚════════════════════════════════════════════════╝\n');
    log('red', `Error: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run tests
runAllTests();

