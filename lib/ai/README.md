# AI Module

The AI module provides a generic interface for interacting with various AI providers (LLMs) in the Web Vibes extension. It follows the three-layer architecture pattern with pluggable backends for different AI providers.

## Architecture

### 1. Model Layer (`model/`)
- **AIPrompt**: Represents a prompt request with metadata (role, tokens, temperature, etc.)
- **AIResponse**: Represents a response from an AI provider with success/error handling

### 2. Backend Layer (`backend/`)
- **AIBackend**: Abstract base class defining the interface for AI providers
- **GeminiBackend**: Concrete implementation for Google's Gemini API
- Future backends can be added (OpenAI, Claude, etc.)

### 3. Service Layer (`service/`)
- **AIService**: Main service that orchestrates backend selection and prompt execution

## Usage

### Basic Setup

```javascript
// Initialize the AI service
const settingsRepo = new SettingsRepository();
const settingsService = new SettingsService(settingsRepo);
const aiService = new AIService(settingsService);

// Initialize with current settings
await aiService.initialize();
```

### Sending Prompts

```javascript
// Simple prompt
const response = await aiService.sendPrompt("What is JavaScript?");
if (response.isSuccess()) {
  console.log(response.getContent());
} else {
  console.error(response.getError());
}

// Prompt with options
const response = await aiService.sendPrompt("Generate a function", {
  maxTokens: 500,
  temperature: 0.7
});

// System + user prompt
const response = await aiService.sendWithSystemPrompt(
  "You are a helpful coding assistant",
  "Explain closures in JavaScript"
);
```

### Conversation Context

```javascript
// Multi-turn conversation
const prompts = [
  "What is React?",
  "How do I create a component?",
  "Show me an example with hooks"
];

const response = await aiService.sendConversation(prompts);
```

### Convenience Methods

```javascript
// Generate code
const codeResponse = await aiService.generateCode(
  "A function that validates email addresses",
  "javascript"
);

// Generate CSS
const cssResponse = await aiService.generateCSS(
  "A responsive navigation bar with hover effects"
);

// Explain code
const explanation = await aiService.explainCode(
  "const sum = (a, b) => a + b;",
  "javascript"
);
```

### Provider Management

```javascript
// Check if service is ready
if (aiService.isReady()) {
  // Send prompts
}

// Get current provider
const provider = aiService.getCurrentProvider(); // "Gemini"

// Get available models
const models = aiService.getAvailableModels(); // ["gemini-1.5-flash", ...]

// Test connection
const isConnected = await aiService.testConnection();

// Switch provider (if credentials are available)
const success = await aiService.switchProvider("Gemini", { apiKey: "..." });
```

## Configuration

### Settings Integration

The AI module integrates with the existing Settings system. AI provider selection and credentials are managed through the Settings model:

```javascript
// In Settings model
{
  selectedAI: "Gemini",
  aiCredentials: {
    "Gemini": {
      apiKey: "your-api-key-here"
    }
  }
}
```

### Available Providers

Currently supported providers:
- **Gemini**: Google's AI models (gemini-1.5-flash, gemini-1.5-pro, gemini-1.0-pro)

Future providers will include:
- OpenAI (GPT models)
- Anthropic (Claude models)
- Local models (Ollama)

## Backend Implementation

### Creating a New Backend

To add a new AI provider, create a class that extends `AIBackend`:

```javascript
class CustomBackend extends AIBackend {
  constructor(config = {}) {
    super("CustomProvider", config);
  }

  async initialize(credentials) {
    // Setup API client with credentials
  }

  async sendPrompt(prompt) {
    // Send prompt to API and return AIResponse
  }

  // Implement other required methods...
}

// Register in AIService
this.backends.set("CustomProvider", new CustomBackend());
```

### Required Methods

All backends must implement:
- `initialize(credentials)`: Setup with credentials
- `isReady()`: Check if ready to use
- `sendPrompt(prompt)`: Send single prompt
- `sendConversation(prompts)`: Send conversation
- `getAvailableModels()`: List available models
- `getDefaultModel()`: Get default model
- `validateCredentials(credentials)`: Validate credential format
- `testConnection()`: Test API connection

## Error Handling

The AI module provides comprehensive error handling:

```javascript
const response = await aiService.sendPrompt("Hello");

if (response.hasError()) {
  console.error("Error:", response.getError());
  console.log("Provider:", response.getProvider());
  console.log("Processing time:", response.getProcessingTime());
} else {
  console.log("Success:", response.getContent());
  console.log("Tokens used:", response.getTokensUsed());
  console.log("Model:", response.getModel());
}
```

## Security Considerations

1. **API Keys**: Stored securely in Chrome extension storage
2. **Validation**: All inputs are validated before sending to APIs
3. **Error Handling**: API errors are caught and don't expose sensitive data
4. **Rate Limiting**: Backends should implement appropriate rate limiting

## Integration with UI

The AI module integrates with the extension's settings UI:

1. **Provider Selection**: Users can choose their preferred AI provider
2. **Credential Management**: Secure input forms for API keys
3. **Connection Testing**: UI feedback for connection status
4. **Usage Monitoring**: Display tokens used and processing times

## Future Enhancements

- **Caching**: Response caching for improved performance
- **Rate Limiting**: Built-in rate limiting across all providers
- **Usage Analytics**: Track token usage and costs
- **Model Comparison**: A/B testing different models
- **Local Models**: Support for locally-run models via Ollama
- **Streaming**: Support for streaming responses
- **Function Calling**: Support for AI function/tool calling

## Dependencies

- Chrome Extension APIs (storage)
- Fetch API (for HTTP requests)
- Settings module (for configuration)

No external libraries required - uses only browser/extension native APIs.
