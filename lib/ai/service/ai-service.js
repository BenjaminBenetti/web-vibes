/**
 * AI Service - Main service for interacting with AI providers
 * Handles provider selection, credential management, and prompt execution
 */
class AIService {
  /**
   * Create an AI service instance
   * @param {SettingsService} settingsService - Settings service for configuration
   */
  constructor(settingsService) {
    if (!settingsService) {
      throw new Error("SettingsService is required for AIService");
    }

    this.settingsService = settingsService;
    this.backends = new Map();
    this.currentBackend = null;

    // Register available backends
    this._registerBackends();
  }

  /**
   * Initialize the AI service by setting up the current backend
   * @returns {Promise<boolean>} True if initialization successful
   */
  async initialize() {
    try {
      const settings = await this.settingsService.getAllSettings();

      if (!this.settingsService.isAIConfigured()) {
        console.log("AI not configured, skipping initialization");
        return false;
      }

      const provider = settings.selectedAI;
      const credentials = await this.settingsService.getAICredentials(provider);

      return await this.switchProvider(provider, credentials);
    } catch (error) {
      console.error("Failed to initialize AI service:", error);
      return false;
    }
  }

  /**
   * Switch to a different AI provider
   * @param {string} provider - Provider name (e.g., "Gemini")
   * @param {Object} credentials - Provider credentials
   * @returns {Promise<boolean>} True if switch successful
   */
  async switchProvider(provider, credentials) {
    try {
      if (!this.backends.has(provider)) {
        throw new Error(`AI provider '${provider}' not supported`);
      }

      const backend = this.backends.get(provider);
      const initSuccess = await backend.initialize(credentials);

      if (initSuccess) {
        this.currentBackend = backend;
        console.log(`Switched to AI provider: ${provider}`);
        return true;
      } else {
        throw new Error(`Failed to initialize ${provider} backend`);
      }
    } catch (error) {
      console.error(`Error switching to provider ${provider}:`, error);
      this.currentBackend = null;
      return false;
    }
  }

  /**
   * Send a prompt to the current AI provider
   * @param {string|AIPrompt} prompt - Prompt text or AIPrompt instance
   * @param {Object} options - Optional configuration
   * @returns {Promise<AIResponse>} The AI response
   */
  async sendPrompt(prompt, options = {}) {
    try {
      if (!this.isReady()) {
        throw new Error("AI service not initialized or no provider configured");
      }

      // Convert string prompt to AIPrompt if needed
      const promptObj =
        typeof prompt === "string"
          ? AIPrompt.createUserPrompt(prompt, options)
          : prompt;

      return await this.currentBackend.sendPrompt(promptObj);
    } catch (error) {
      console.error("Error sending prompt:", error);
      return AIResponse.createError(error.message, {
        provider: this.currentBackend?.getName() || "unknown",
        createdAt: new Date(),
      });
    }
  }

  /**
   * Send a conversation (multiple prompts) to the current AI provider
   * @param {Array<string|AIPrompt>} prompts - Array of prompts
   * @param {Object} options - Optional configuration for the last prompt
   * @returns {Promise<AIResponse>} The AI response
   */
  async sendConversation(prompts, options = {}) {
    try {
      if (!this.isReady()) {
        throw new Error("AI service not initialized or no provider configured");
      }

      if (!prompts || prompts.length === 0) {
        throw new Error("No prompts provided for conversation");
      }

      // Convert string prompts to AIPrompt instances
      const promptObjects = prompts.map((prompt, index) => {
        if (typeof prompt === "string") {
          // Apply options only to the last prompt
          const promptOptions = index === prompts.length - 1 ? options : {};
          return AIPrompt.createUserPrompt(prompt, promptOptions);
        }
        return prompt;
      });

      return await this.currentBackend.sendConversation(promptObjects);
    } catch (error) {
      console.error("Error sending conversation:", error);
      return AIResponse.createError(error.message, {
        provider: this.currentBackend?.getName() || "unknown",
        createdAt: new Date(),
      });
    }
  }

  /**
   * Send a system prompt followed by a user prompt
   * @param {string} systemPrompt - System/context prompt
   * @param {string} userPrompt - User prompt
   * @param {Object} options - Optional configuration
   * @returns {Promise<AIResponse>} The AI response
   */
  async sendWithSystemPrompt(systemPrompt, userPrompt, options = {}) {
    const prompts = [
      AIPrompt.createSystemPrompt(systemPrompt),
      AIPrompt.createUserPrompt(userPrompt, options),
    ];

    return await this.sendConversation(prompts);
  }

  /**
   * Test the current AI provider connection
   * @returns {Promise<boolean>} True if connection successful
   */
  async testConnection() {
    try {
      if (!this.currentBackend) {
        return false;
      }

      return await this.currentBackend.testConnection();
    } catch (error) {
      console.error("Error testing AI connection:", error);
      return false;
    }
  }

  /**
   * Check if the AI service is ready to use
   * @returns {boolean} True if ready
   */
  isReady() {
    return this.currentBackend && this.currentBackend.isReady();
  }

  /**
   * Get the current AI provider name
   * @returns {string|null} Provider name or null if none configured
   */
  getCurrentProvider() {
    return this.currentBackend ? this.currentBackend.getName() : null;
  }

  /**
   * Get available models for the current provider
   * @returns {Array<string>} Array of model names
   */
  getAvailableModels() {
    if (!this.currentBackend) {
      return [];
    }

    return this.currentBackend.getAvailableModels();
  }

  /**
   * Get the default model for the current provider
   * @returns {string|null} Default model name
   */
  getDefaultModel() {
    if (!this.currentBackend) {
      return null;
    }

    return this.currentBackend.getDefaultModel();
  }

  /**
   * Get all supported AI providers
   * @returns {Array<string>} Array of supported provider names
   */
  getSupportedProviders() {
    return Array.from(this.backends.keys());
  }

  /**
   * Check if a provider is supported
   * @param {string} provider - Provider name to check
   * @returns {boolean} True if supported
   */
  isProviderSupported(provider) {
    return this.backends.has(provider);
  }

  /**
   * Validate credentials for a specific provider
   * @param {string} provider - Provider name
   * @param {Object} credentials - Credentials to validate
   * @returns {boolean} True if credentials are valid
   */
  validateCredentials(provider, credentials) {
    if (!this.backends.has(provider)) {
      return false;
    }

    const backend = this.backends.get(provider);
    return backend.validateCredentials(credentials);
  }

  /**
   * Get backend instance for a provider (for advanced usage)
   * @param {string} provider - Provider name
   * @returns {AIBackend|null} Backend instance or null if not found
   */
  getBackend(provider) {
    return this.backends.get(provider) || null;
  }

  /**
   * Register available AI backends
   * @private
   */
  _registerBackends() {
    // Register Gemini backend
    this.backends.set("Gemini", new GeminiBackend());

    // Additional backends can be registered here in the future
    // this.backends.set("OpenAI", new OpenAIBackend());
    // this.backends.set("Claude", new ClaudeBackend());
  }

  /**
   * Create a convenience method for code generation
   * @param {string} description - Description of what to generate
   * @param {string} language - Programming language
   * @param {Object} options - Optional configuration
   * @returns {Promise<AIResponse>} The AI response with generated code
   */
  async generateCode(description, language = "javascript", options = {}) {
    const systemPrompt = `You are a skilled programmer. Generate clean, well-documented ${language} code based on the user's description. Include comments explaining key parts.`;
    const userPrompt = `Generate ${language} code for: ${description}`;

    return await this.sendWithSystemPrompt(systemPrompt, userPrompt, options);
  }

  /**
   * Create a convenience method for CSS generation
   * @param {string} description - Description of the CSS to generate
   * @param {Object} options - Optional configuration
   * @returns {Promise<AIResponse>} The AI response with generated CSS
   */
  async generateCSS(description, options = {}) {
    const systemPrompt =
      "You are a skilled web developer. Generate clean, modern CSS code based on the user's description. Use best practices and include comments.";
    const userPrompt = `Generate CSS for: ${description}`;

    return await this.sendWithSystemPrompt(systemPrompt, userPrompt, options);
  }

  /**
   * Create a convenience method for explaining code
   * @param {string} code - Code to explain
   * @param {string} language - Programming language
   * @param {Object} options - Optional configuration
   * @returns {Promise<AIResponse>} The AI response with code explanation
   */
  async explainCode(code, language = "javascript", options = {}) {
    const systemPrompt = `You are a programming tutor. Explain the provided ${language} code in clear, simple terms. Break down what each part does.`;
    const userPrompt = `Explain this ${language} code:\n\n${code}`;

    return await this.sendWithSystemPrompt(systemPrompt, userPrompt, options);
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = AIService;
} else {
  window.AIService = AIService;
}
