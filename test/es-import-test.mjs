// Simple script to test ES module imports work
// Run with: node test/es-import-test.mjs

import { fetchStreamedChat, fetchStreamedChatContent } from '../index.js';

console.log('✓ ES module imports working');
console.log('  fetchStreamedChat:', typeof fetchStreamedChat);
console.log('  fetchStreamedChatContent:', typeof fetchStreamedChatContent);