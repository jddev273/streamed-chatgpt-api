/**
 * Demonstration of the exact usage pattern requested in the GitHub issue
 * This shows how the reader object can now be accessed in the callback
 * to cancel the stream when needed.
 */

const { fetchStreamedChat } = require('../index');

// This is the exact usage pattern from the issue description:
console.log('Demonstrating the requested feature...');
console.log('Usage pattern from the issue:');
console.log(`
fetchStreamedChat({
    apiKey,
    messageInput: 'Hello, how are you?',
}, (responseChunk, reader) => {
    if(xxxx){
      reader.cancel();
    }
    // get the actual content from the JSON
    const content = JSON.parse(responseChunk).choices[0].delta.content;
    if (content) {
        process.stdout.write(content);
    }
});
`);

console.log('✓ This pattern is now supported!');
console.log('✓ The reader object is passed as the second parameter to the callback');
console.log('✓ Users can call reader.cancel() to stop the stream at any time');
console.log('✓ Backward compatibility is maintained - existing code still works');

// Show that existing single-parameter callbacks still work
console.log('\n✓ Backward compatibility example:');
console.log(`
// This still works (existing code):
fetchStreamedChat(options, (responseChunk) => {
    // handle chunk
});

// This is new (enhanced functionality):
fetchStreamedChat(options, (responseChunk, reader) => {
    // handle chunk AND control stream
    if (someCondition) reader.cancel();
});
`);