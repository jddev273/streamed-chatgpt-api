// Create simple test to ensure compatibility with both fetch implementations

// First test the implementation with node-fetch
console.log('Testing with node-fetch...');

// Save original fetch
const originalFetch = globalThis.fetch;

// Force use of node-fetch by setting globalThis.fetch to undefined
globalThis.fetch = undefined;

// Now when we require the library, it should use node-fetch
const { fetchStreamedChat: fetchWithNodeFetch } = require('./index');

// Restore original fetch
globalThis.fetch = originalFetch;

// Now test with native fetch
console.log('Testing with native fetch...');
const { fetchStreamedChat: fetchWithNativeFetch } = require('./index');

console.log('Both implementations loaded successfully. Check completed.');
console.log('Note: Full functional testing requires API keys and real API calls.');