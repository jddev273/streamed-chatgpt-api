const fetch = globalThis.fetch || require('node-fetch');

// A utility function to create a promise that rejects after a specified timeout
async function timeout(ms) {
    return new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));
}

async function fetchStreamedChatContent(options, onResponse = null, onFinish = null, onError = null) {

    try {
        await fetchStreamedChat(
            options,
            (responseChunk) => {
                const content = JSON.parse(responseChunk).choices[0].delta.content;
                if (content && onResponse) {
                    onResponse(content);
                }
            }
        );

        if (onFinish) {
            onFinish();
        }
    } catch (error) {
        if (onError) {
            onError(error);
        }
    }
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

    function totalTimeTimeout() {
        return new Promise((_, reject) => {
            const elapsedTime = Date.now() - startTime;
            const remainingTime = totalTime - elapsedTime;

            if (remainingTime <= 0) {
                reject(new Error('Total timeout reached'));
            } else {
                setTimeout(() => reject(new Error('Total timeout reached')), remainingTime);
            }
        });
    }

    // A function to process the response stream from node-fetch using Node.js stream methods
    async function processNodeStream(readableStream, decoder, onChunkReceived) {
        try {
            // Set up event listeners for the Node.js readable stream
            return new Promise((resolve, reject) => {
                let buffer = '';
                
                // Setup read timeout timer
                let readTimeoutId = null;
                const resetReadTimeout = () => {
                    if (readTimeoutId) clearTimeout(readTimeoutId);
                    readTimeoutId = setTimeout(() => {
                        reject(new Error('Timeout'));
                    }, readTimeout);
                };
                
                // Initial timeout
                resetReadTimeout();
                
                // Set up total time timeout
                const totalTimeoutPromise = totalTimeTimeout();
                totalTimeoutPromise.catch(reject);

                readableStream.on('data', (chunk) => {
                    try {
                        // Reset read timeout when data is received
                        resetReadTimeout();
                        
                        // Decode the chunk and add it to the buffer
                        const textChunk = decoder.decode(chunk, { stream: true });
                        buffer += textChunk;

                        // Process complete lines
                        const lines = buffer.split('\n');
                        buffer = lines.pop(); // Keep the last potentially incomplete line in the buffer

                        // Process each complete line
                        for (const line of lines) {
                            if (line.trim() === '') continue;

                            // Remove the "data: " prefix from the line
                            const message = line.replace(/^data: /, '');

                            // If the message indicates the end of the stream, resolve
                            if (message === '[DONE]') {
                                if (readTimeoutId) clearTimeout(readTimeoutId);
                                resolve();
                                return;
                            }

                            // Otherwise, invoke the onChunkReceived callback with the message
                            onChunkReceived(message);
                        }
                    } catch (error) {
                        if (readTimeoutId) clearTimeout(readTimeoutId);
                        reject(error);
                    }
                });

                readableStream.on('end', () => {
                    // Clear timeout when stream ends
                    if (readTimeoutId) clearTimeout(readTimeoutId);
                    
                    // Process any remaining data in the buffer
                    if (buffer.trim() !== '') {
                        const message = buffer.replace(/^data: /, '');
                        if (message !== '[DONE]' && message.trim() !== '') {
                            onChunkReceived(message);
                        }
                    }
                    resolve();
                });

                readableStream.on('error', (error) => {
                    // Clear timeout on error
                    if (readTimeoutId) clearTimeout(readTimeoutId);
                    console.error('Error reading stream:', error);
                    reject(error);
                });
            });
        } catch (error) {
            console.error('Error processing node stream:', error);
        }
    }

    // A function to process the response stream and invoke the onChunkReceived callback
    // for each valid line in the stream
    async function processStream(reader, decoder, onChunkReceived) {
        try {
            // Wait for either the next chunk or a timeout
            const result = await Promise.race([
                reader.read().then(res => ({ type: 'data', value: res })),
                timeout(readTimeout).then(() => ({ type: 'error', value: new Error('Timeout') })),
                totalTimeTimeout().then(() => ({ type: 'error', value: new Error('Total timeout reached') })),
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
                        body: options.body,
                    }),
                    timeout(options.fetchTimeout),
                    totalTimeTimeout(),
                ]);

                if (response.ok) {
                    return response;
                }
            } catch (error) {
                console.error('Error fetching chat:', error);
                if (i === retryCount - 1) {
                    throw new Error(`Failed to fetch chat after ${retryCount} retry attempts`);
                }
            }
            await new Promise(resolve => setTimeout(resolve, options.retryInterval));
        }
        throw new Error('Unable to fetch chat');
    }

    const requestOptions = {
        body,
        fetchTimeout,
        retryInterval,
    };

    const response = await fetchChatResponseWithRetry(apiKey, requestOptions, retryCount);

    // Initialize the decoder
    const decoder = new TextDecoder('utf-8');

    // Check if response.body has getReader method (native fetch)
    if (typeof response.body.getReader === 'function') {
        // Initialize the reader for native fetch
        const reader = response.body.getReader();
        
        // Process the response stream using getReader
        await processStream(reader, decoder, onChunkReceived);
    } else {
        // Handle node-fetch which doesn't have getReader
        // Process the stream using Node.js stream methods
        await processNodeStream(response.body, decoder, onChunkReceived);
    }
}

module.exports = { fetchStreamedChat, fetchStreamedChatContent };

