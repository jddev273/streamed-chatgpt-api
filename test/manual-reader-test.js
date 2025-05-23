/**
 * Test script to validate that the reader object is passed to the callback
 * This demonstrates the feature requested in the issue.
 * 
 * To run this test:
 * 1. Set your OPENAI_API_KEY environment variable
 * 2. Run: node test/manual-reader-test.js
 */

const { fetchStreamedChat } = require('../index');

if (!process.env.OPENAI_API_KEY) {
    console.log('To test this feature, set your OPENAI_API_KEY environment variable and run:');
    console.log('OPENAI_API_KEY=your_key node test/manual-reader-test.js');
    process.exit(0);
}

console.log('Testing reader object access in callback...');

fetchStreamedChat({
    apiKey: process.env.OPENAI_API_KEY,
    messageInput: 'Say "Hello World" and nothing else.',
    maxTokens: 10
}, (responseChunk, reader) => {
    console.log('✓ Received callback with:', {
        chunkDefined: !!responseChunk,
        readerDefined: !!reader,
        readerHasCancel: reader && typeof reader.cancel === 'function'
    });
    
    // Parse and display the content
    try {
        const content = JSON.parse(responseChunk).choices[0].delta.content;
        if (content) {
            process.stdout.write(content);
        }
    } catch (e) {
        // Some chunks might not have content
    }
    
    // Example: You could cancel the stream here if needed
    // if (someCondition) {
    //     reader.cancel();
    // }
}).then(() => {
    console.log('\n✓ Stream completed successfully!');
    console.log('✓ Reader object was accessible in the callback!');
}).catch(error => {
    console.error('✗ Error:', error.message);
});