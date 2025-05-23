// Test CommonJS import in CommonJS context
const { fetchStreamedChat, fetchStreamedChatContent } = require('../index');

describe('CommonJS imports', () => {
    test('should export fetchStreamedChat function via require', () => {
        expect(typeof fetchStreamedChat).toBe('function');
        expect(fetchStreamedChat.name).toBe('fetchStreamedChat');
    });

    test('should export fetchStreamedChatContent function via require', () => {
        expect(typeof fetchStreamedChatContent).toBe('function');
        expect(fetchStreamedChatContent.name).toBe('fetchStreamedChatContent');
    });

    test('should have correct function signatures', () => {
        // fetchStreamedChat should accept 2 parameters
        expect(fetchStreamedChat.length).toBe(2);
        // fetchStreamedChatContent should accept 1 parameter (options) with optional callbacks
        expect(fetchStreamedChatContent.length).toBe(1);
    });
});