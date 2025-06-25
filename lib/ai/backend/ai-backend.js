/**
 * Abstract base class for AI backend implementations
 * Defines the interface that all AI providers must implement
 */
class AIBackend {
  /**
   * Create an AI backend
   * @param {string} name - The backend name/identifier
   * @param {Object} config - Backend configuration
   */
  constructor(name, config = {}) {
    if (this.constructor === AIBackend) {
      throw new Error(
        "AIBackend is abstract and cannot be instantiated directly"
      );
    }

    this.name = name;
    this.config = config;
  }

  /**
   * Initialize the backend with credentials
   * @param {Object} credentials - Provider-specific credentials
   * @returns {Promise<boolean>} True if initialization successful
   * @abstract
   */
  async initialize(credentials) {
    throw new Error("initialize() method must be implemented by backend");
  }

  /**
   * Check if the backend is properly configured and ready to use
   * @returns {boolean} True if ready
   * @abstract
   */
  isReady() {
    throw new Error("isReady() method must be implemented by backend");
  }

  /**
   * Send a prompt to the AI provider and get a response
   * @param {AIPrompt} prompt - The prompt to send
   * @returns {Promise<AIResponse>} The AI response
   * @abstract
   */
  async sendPrompt(prompt) {
    throw new Error("sendPrompt() method must be implemented by backend");
  }

  /**
   * Send multiple prompts in a conversation context
   * @param {Array<AIPrompt>} prompts - Array of prompts in conversation order
   * @returns {Promise<AIResponse>} The AI response to the conversation
   * @abstract
   */
  async sendConversation(prompts) {
    throw new Error("sendConversation() method must be implemented by backend");
  }

  /**
   * Get available models for this backend
   * @returns {Array<string>} Array of available model names
   * @abstract
   */
  getAvailableModels() {
    throw new Error(
      "getAvailableModels() method must be implemented by backend"
    );
  }

  /**
   * Get the default model for this backend
   * @returns {string} Default model name
   * @abstract
   */
  getDefaultModel() {
    throw new Error("getDefaultModel() method must be implemented by backend");
  }

  /**
   * Validate credentials for this backend
   * @param {Object} credentials - Credentials to validate
   * @returns {boolean} True if credentials are valid format
   * @abstract
   */
  validateCredentials(credentials) {
    throw new Error(
      "validateCredentials() method must be implemented by backend"
    );
  }

  /**
   * Get backend name
   * @returns {string} Backend name
   */
  getName() {
    return this.name;
  }

  /**
   * Get backend configuration
   * @returns {Object} Backend configuration
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Update backend configuration
   * @param {Object} newConfig - New configuration to merge
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = AIBackend;
} else {
  window.AIBackend = AIBackend;
}
