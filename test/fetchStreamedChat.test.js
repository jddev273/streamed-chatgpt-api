const { fetchStreamedChat } = require('../index');

if (!process.env.OPENAI_API_KEY) {
    console.error('You must set the OPENAI_API_KEY environment variable to run tests.');
    process.exit(1);
}
const apiKey = process.env.OPENAI_API_KEY;

describe('fetchStreamedChat', () => {
    test('should fetch a chat response with a single message and custom temperature', async () => {
        expect.assertions(1);

        const testMessage = 'write a haiku on chatgpt.';
        let response = '';

        await fetchStreamedChat({
            apiKey,
            messageInput: testMessage,
            maxTokens: 20,
            temperature: 0.7
        }, (responseChunk) => {
            const content = JSON.parse(responseChunk).choices[0].delta.content;
            response += content;
        });

        expect(response).toBeTruthy();
    }, 30000);

    test('should fetch a chat response with a single message and custom top_p', async () => {
        expect.assertions(1);

        const testMessage = 'write a haiku on chatgpt.';
        let response = '';

        await fetchStreamedChat({
            apiKey,
            messageInput: testMessage,
            maxTokens: 20,
            topP: 0.9
        }, (responseChunk) => {
            const content = JSON.parse(responseChunk).choices[0].delta.content;
            response += content;
        });

        const numLines = response.split('\n').filter(line => line.trim() !== '').length;
        expect(numLines).toBeGreaterThanOrEqual(3);
    }, 30000);

    test('should fetch a chat response with a single message and custom presence_penalty', async () => {
        expect.assertions(1);

        const testMessage = 'write a haiku on chatgpt.';
        let response = '';

        await fetchStreamedChat({
            apiKey,
            messageInput: testMessage,
            maxTokens: 20,
            presencePenalty: 0.1
        }, (responseChunk) => {
            const content = JSON.parse(responseChunk).choices[0].delta.content;
            response += content;
        });

        const numLines = response.split('\n').filter(line => line.trim() !== '').length;
        expect(numLines).toBeGreaterThanOrEqual(3);
    }, 30000);

    test('should fetch a chat response with a single message and custom frequency_penalty', async () => {
        expect.assertions(1);

        const testMessage = 'write a haiku on chatgpt.';
        let response = '';

        await fetchStreamedChat({
            apiKey,
            messageInput: testMessage,
            maxTokens: 20,
            frequencyPenalty: 0.1
        }, (responseChunk) => {
            const content = JSON.parse(responseChunk).choices[0].delta.content;
            response += content;
        });

        const numLines = response.split('\n').filter(line => line.trim() !== '').length;
        expect(numLines).toBeGreaterThanOrEqual(3);
    }, 30000);

    test('should fetch a chat response with a single message and custom user ID', async () => {
        expect.assertions(1);

        const testMessage = 'write a haiku on chatgpt.';
        let response = '';

        await fetchStreamedChat({
            apiKey,
            messageInput: testMessage,
            maxTokens: 20,
            user: 'user123'
        }, (responseChunk) => {
            const content = JSON.parse(responseChunk).choices[0].delta.content;
            response += content;
        });

        const numLines = response.split('\n').filter(line => line.trim() !== '').length;
        expect(numLines).toBeGreaterThanOrEqual(3);
    }, 30000);

    test('should fetch a chat response with an array of messages and default options', async () => {
        expect.assertions(1);

        const messages = [{ role: 'system', content: '' }, { role: 'user', content: 'capital of canada' }];
        let response = '';

        await fetchStreamedChat({
            apiKey,
            messageInput: messages,
            maxTokens: 15
        }, (responseChunk) => {
            const content = JSON.parse(responseChunk).choices[0].delta.content;
            response += content;
        });

        expect(response).toContain('Ottawa');
    }, 30000);
});
