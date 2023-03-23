const fetch = globalThis.fetch || require('node-fetch');

// A utility function to create a promise that rejects after a specified timeout
async function timeout(ms) {
    return new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));
}

// The main function to fetch a streamed chat response and process it
async function fetchStreamedChat(options, onChunkReceived) {
    const {
        apiKey,
        messageInput,
        apiUrl = 'https://api.openai.com/v1/chat/completions',
        model = 'gpt-3.5-turbo',
        temperature,
        topP,
        n,
        stop,
        maxTokens,
        presencePenalty,
        frequencyPenalty,
        logitBias,
        user,
        retryCount = 3,
        fetchTimeout = 20000,
        readTimeout = 10000,
        retryInterval = 2000,
        totalTime = 300000
    } = options;

    const stream = true;
    const messages = Array.isArray(messageInput)
        ? messageInput
        : [{ role: 'user', content: messageInput }];
    // Prepare the request body
    const body = JSON.stringify({
        model,
        messages: messages,
        stream,
        ...(temperature !== undefined && { temperature }),
        ...(topP !== undefined && { top_p: topP }),
        ...(n !== undefined && { n }),
        ...(stop !== undefined && { stop }),
        ...(maxTokens !== undefined && { max_tokens: maxTokens }),
        ...(presencePenalty !== undefined && { presence_penalty: presencePenalty }),
        ...(frequencyPenalty !== undefined && { frequency_penalty: frequencyPenalty }),
        ...(logitBias !== undefined && { logit_bias: logitBias }),
        ...(user !== undefined && { user }),
    });

    const startTime = Date.now();

    async function checkTotalTime() {
        return new Promise((_, reject) => {
            if (Date.now() - startTime >= totalTime) {
                reject(new Error('Total timeout reached'));
            }
        });
    }


    // A function to process the response stream and invoke the onChunkReceived callback
    // for each valid line in the stream
    async function processStream(reader, decoder, onChunkReceived) {
        try {
            // Wait for either the next chunk or a timeout
            const result = await Promise.race([
                reader.read().then(res => ({ type: 'data', value: res })),
                timeout(readTimeout).then(() => ({ type: 'error', value: new Error('Timeout') })),
                checkTotalTime().then(() => ({ type: 'error', value: new Error('Total timeout reached') })),
            ]);

            // Check if the result is an error
            if (result.type === 'error') {
                throw result.value;
            }

            // Destructure the result
            const { done, value } = result.value;

            // If the stream is done, return
            if (done) {
                return;
            }

            // Decode the chunk and split it into lines
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            // Process each line
            for (const line of lines) {
                // Remove the "data: " prefix from the line
                const message = line.replace(/^data: /, '');

                // If the message indicates the end of the stream, return
                if (message === '[DONE]') {
                    return;
                }

                // Otherwise, invoke the onChunkReceived callback with the message
                onChunkReceived(message);
            }

            // Continue processing the stream recursively
            await processStream(reader, decoder, onChunkReceived);
        } catch (error) {
            console.error('Error reading stream:', error);
            reader.cancel();
        }
    }


    // A function to fetch the chat response with retries and timeouts
    async function fetchChatResponseWithRetry(apiKey, options, retryCount) {
        for (let i = 0; i < retryCount; i++) {
            try {
                const response = await Promise.race([
                    fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`,
                        },
                        body: options.body, // Use the body from options
                    }),
                    timeout(options.fetchTimeout), // Use the fetchTimeout from options
                ]);

                if (response.ok) {
                    return response;
                }
            } catch (error) {
                console.error('Error fetching chat:', error);
            }
            await new Promise(resolve => setTimeout(resolve, options.retryInterval)); // Use the retryInterval from options
            await checkTotalTime(); // Check if the total timeout has been reached
        }
        throw new Error('Unable to fetch chat');
    }

    const requestOptions = {
        body,
        fetchTimeout,
        retryInterval,
    };

    const response = await fetchChatResponseWithRetry(apiKey, requestOptions, retryCount);

    // Initialize the reader and decoder
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    // Process the response stream
    await processStream(reader, decoder, onChunkReceived);
}

module.exports = { fetchStreamedChat };