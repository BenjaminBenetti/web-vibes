# Gemini AI Settings Module

This module provides a complete three-layer architecture for managing Gemini AI settings in the Web Vibes Chrome extension.

## Architecture

```
lib/ai/gemini/
├── model/
│   └── gemini-settings.js          # Data model for Gemini settings
├── repo/
│   └── gemini-settings-repo.js     # Repository for storage operations
├── service/
│   └── gemini-settings-service.js  # Business logic service
├── gemini-backend.js               # Gemini AI backend implementation
└── README.md                       # This documentation
```

## Components

### Model Layer (`gemini-settings.js`)

The `GeminiSettings` class represents the data structure for Gemini AI configuration:

**Key Properties:**
- `apiKey` - Gemini API key
- `model` - Selected model (gemini-1.5-flash, gemini-1.5-pro, gemini-1.0-pro)
- `temperature` - Generation temperature (0-2)
- `maxTokens` - Maximum tokens for generation (1-8192)
- `topP` - Top-p sampling parameter (0-1)
- `topK` - Top-k sampling parameter (1-40)
- `safetySettings` - Content safety configuration
- `generationConfig` - Additional generation settings

**Key Methods:**
- `setApiKey(apiKey)` - Update API key
- `setModel(model)` - Change model selection
- `setTemperature(temperature)` - Update temperature
- `isConfigured()` - Check if API key is present
- `toJSON()` / `fromJSON(data)` - Serialization methods

### Repository Layer (`gemini-settings-repo.js`)

The `GeminiSettingsRepository` class handles Chrome storage operations:

**Key Methods:**
- `getGeminiSettings()` - Retrieve settings from storage
- `saveGeminiSettings(settings)` - Save settings to storage
- `deleteGeminiSettings()` - Remove settings from storage
- `resetToDefaults()` - Reset to default configuration
- `exportSettings()` / `importSettings(jsonString)` - Backup/restore

### Service Layer (`gemini-settings-service.js`)

The `GeminiSettingsService` class provides business logic and combines model/repository operations:

**Key Methods:**
- `getAllSettings()` - Get current settings
- `setApiKey(apiKey)` - Update API key with validation
- `updateGenerationParams(params)` - Update generation parameters
- `updateSafetySettings(safetySettings)` - Update safety configuration
- `isConfigured()` - Check if Gemini is properly configured
- `getSettingsSummary()` - Get formatted settings summary
- `applyRecommendedSettings(presetKey)` - Apply preset configurations

### Backend Layer (`gemini-backend.js`)

The `GeminiBackend` class extends `AIBackend` and provides the actual AI communication:

**Key Methods:**
- `sendPrompt(prompt)` - Send a single prompt to Gemini
- `sendConversation(prompts)` - Send a conversation to Gemini
- `testConnection()` - Test API connectivity
- `validateCredentials(credentials)` - Validate API key format
- `getAvailableModels()` - Get supported Gemini models
- `isReady()` - Check if backend is properly configured

## Usage Example

```javascript
// Initialize the three-layer architecture
const repository = new GeminiSettingsRepository();
const service = new GeminiSettingsService(repository);

// Get current settings
const settings = await service.getAllSettings();

// Update API key
await service.setApiKey("your-gemini-api-key");

// Update generation parameters
await service.updateGenerationParams({
  temperature: 0.8,
  maxTokens: 1024,
  topP: 0.9
});

// Apply a recommended preset
await service.applyRecommendedSettings("creative");

// Check if configured
const isConfigured = await service.isConfigured();

// Use the backend for AI communication
const backend = new GeminiBackend();
await backend.initialize(settings);
const response = await backend.sendPrompt("Hello, how are you?");
```

## Available Models

- **gemini-1.5-flash**: Fast and efficient model for most tasks
- **gemini-1.5-pro**: Most capable model for complex tasks
- **gemini-1.0-pro**: Previous generation pro model

## Safety Settings

The module supports four safety categories with different blocking levels:
- `harassment` - Harassment content filtering
- `hateSpeech` - Hate speech content filtering
- `sexuallyExplicit` - Sexually explicit content filtering
- `dangerousContent` - Dangerous content filtering

Blocking levels:
- `BLOCK_NONE` - Allow all content
- `BLOCK_LOW_AND_ABOVE` - Block low and higher risk content
- `BLOCK_MEDIUM_AND_ABOVE` - Block medium and higher risk content
- `BLOCK_HIGH_AND_ABOVE` - Block only high risk content

## Recommended Presets

The service provides several preset configurations:

- **creative**: Optimized for creative and imaginative content
- **analytical**: Optimized for precise and factual responses
- **balanced**: Good balance between creativity and accuracy
- **conservative**: Conservative safety settings with strict filtering

## Storage

Settings are stored in Chrome's local storage with the key `"webVibesGeminiSettings"`. The module includes methods for:
- Exporting settings as JSON for backup
- Importing settings from JSON backup
- Getting storage usage information
- Resetting to default configuration

## Validation

The model includes comprehensive validation for:
- API key format (basic validation)
- Model selection (must be from available models)
- Generation parameters (within valid ranges)
- Safety settings (valid categories and levels)
- Generation configuration (valid structure)

## Error Handling

All operations include proper error handling with:
- Try/catch blocks for storage operations
- Validation errors with descriptive messages
- Graceful fallbacks to default values
- Console logging for debugging

## Integration with Main Settings

This module is designed to integrate with the main `Settings` model, where Gemini-specific settings can be stored in the `aiCredentials` field or as a separate configuration that the main settings service can reference.

## Integration with AI Service

The `GeminiBackend` is automatically registered with the main `AIService` and can be used through the standard AI service interface:

```javascript
const aiService = new AIService(settingsService);
await aiService.initialize();
await aiService.switchProvider("Gemini", { apiKey: "your-key" });
const response = await aiService.sendPrompt("Hello!");
``` 