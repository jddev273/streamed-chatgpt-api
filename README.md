# Streamed ChatGPT API With Node

A Node.js module for streaming ChatGPT API responses using the OpenAI API. Streamed ChatGPT API allows users to fetch AI-generated responses in real-time. This module was created due to issues with other modules that were causing freezing, which provided a poor user experience. Various timeouts have been implemented to automatically retry and throw errors in case of disconnections.

## Introduction

ChatGPT is an advanced AI language model developed by OpenAI. This module enables you to interact with the ChatGPT API, allowing you to send messages and receive AI-generated responses in real-time. The OpenAI API provides access to various models, including the gpt-3.5-turbo model, which is used by default in this module.

## Usage Example

A simple node web app showing usage of the module with streamed chat can be found here: [Streamed ChatGPT API Usage Example](https://github.com/jddev273/simple-chatgpt-chat-streaming-demo)

## Installation

Install using npm:

```
npm install streamed-chatgpt-api
```

## Usage

To use the module, first import it:

```js
const { fetchStreamedChat, fetchStreamedChatContent } = require('streamed-chatgpt-api');
```

Then call the `fetchStreamedChat` function with your options and a callback function to process the streamed response.  This is the simplest example, you can pass in an OpenAI API key and a single string as a prompt:

```js
const apiKey = 'your_api_key_here';

fetchStreamedChat({
    apiKey,
    messageInput: 'Hello, how are you?',
}, (responseChunk) => {
    // get the actual content from the JSON
    const content = JSON.parse(responseChunk).choices[0].delta.content;
    if (content) {
        process.stdout.write(content);
    }
});
```

You can also pass in an an array as shown in the OpenAI API documentation, where you can define the System prompt, and on going conversation.  Here's a simple example:

```js
const apiKey = 'your_api_key_here';

const messages = [{ role: 'system', content: '' }, { role: 'user', content: 'capital of canada' }];

fetchStreamedChat({
    apiKey,
    messageInput: messages,
    fetchTimeout: 10000,
    }, (responseChunk) => {
    // get the actual content from the JSON
    const content = JSON.parse(responseChunk).choices[0].delta.content;
    if (content) {
        process.stdout.write(content);
    }
});
```

### Using fetchStreamedChatContent

The `fetchStreamedChatContent` function is a higher-level function that simplifies the process of fetching the generated content by not requiring you to deal with individual chunks. It takes the same options as `fetchStreamedChat` but also accepts three optional callback functions, `onResponse`, `onFinish`, and `onError`.

```js
const apiKey = 'your_api_key_here';

fetchStreamedChatContent({
    apiKey,
    messageInput: 'Hello, how are you?',
}, (content) => {
    // onResponse
    process.stdout.write(content);
}, () => {
    // onFinish
    console.log('Chat completed');
}, (error) => {
    // onError
    console.error('Error:', error);
});

```

You can specify the same options as specified in OpenAI's chat completion reference.

Here is a table of the parameters below.  Only the API key and messageInput (prompt) are required.  By default the gpt-3.5-turbo is used.

### Options

The following options are available for the `fetchStreamedChat` and `fetchStreamedChatContent` functions:

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| apiKey | string | - | Your OpenAI API key. |
| messageInput | string or array of objects | - | The input message or messages to generate a chat response for. |
| apiUrl | string | "https://api.openai.com/v1/chat/completions" | The OpenAI API URL to use. |
| model | string | "gpt-3.5-turbo" | The OpenAI model to use. |
| temperature | number | - | The softmax temperature to use. |
| topP | number | - | The top_p value to use. |
| n | number | - | The number of responses to generate. |
| stop | string or array of strings | - | The sequence or sequences to stop generation at. |
| maxTokens | number | - | The maximum number of tokens to generate. |
| presencePenalty | number | - | The presence penalty value to use. |
| frequencyPenalty | number | - | The frequency penalty value to use. |
| logitBias | object | - | The logit bias object to use. |
| user | string | - | The user ID to use for the chat session. |
| retryCount | number | 3 | The number of times to retry if the chat response fetch fails. |
| fetchTimeout | number | 20000 | The timeout value for the fetch request. |
| readTimeout | number | 10000 | The timeout value for reading the response stream. |
| retryInterval | number | 2000 | The interval between retries. |
| totalTime | number | 300000 | The total time to allow for the chat response fetch. |

## License

MIT

## Author

Created by Johann Dowa

