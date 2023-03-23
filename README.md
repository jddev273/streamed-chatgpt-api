# Streamed ChatGPT API With Node

A Node.js module for streaming ChatGPT API responses using the OpenAI API.  I created this because I had issues with another module, it kept freezing, which was unacceptable for the user.  

So i added a number of timeouts so that it would automatically retry, and throw an error if things got disconnected.

## Installation

Install using npm:

```
npm install streamed-chatgpt-api
```

## Usage

To use the module, first import it:

```js
const { fetchStreamedChat } = require('streamed-chatgpt-api');
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

You can specify the same options as specified in OpenAI's chat completion reference.

Here is a table of the parameters below.  Only the API key and messageInput (prompt) are required.  By default the gpt-3.5-turbo is used.

### Options

The following options are available for the `fetchStreamedChat` function:

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

