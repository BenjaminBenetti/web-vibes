/**
 * Data model for Gemini AI specific settings
 * Represents Gemini API configuration and preferences
 */
class GeminiSettings {
  constructor(
    apiKey = "",
    model = "gemini-2.5-flash",
    createdAt = new Date(),
    updatedAt = new Date()
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Set the API key for Gemini
   * @param {string} apiKey - The Gemini API key
   */
  setApiKey(apiKey) {
    this.apiKey = apiKey;
    this.updatedAt = new Date();
  }

  /**
   * Set the model to use for Gemini
   * @param {string} model - The model identifier
   */
  setModel(model) {
    if (!GeminiSettings.isValidModel(model)) {
      throw new Error(`Model '${model}' is not supported`);
    }
    this.model = model;
    this.updatedAt = new Date();
  }

  /**
   * Check if the Gemini settings are properly configured
   * @returns {boolean} True if API key is present
   */
  isConfigured() {
    return this.apiKey && this.apiKey.trim().length > 0;
  }

  /**
   * Convert the settings to a plain object for storage
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      apiKey: this.apiKey,
      model: this.model,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  /**
   * Create a GeminiSettings instance from stored data
   * @param {Object} data - The stored settings data
   * @returns {GeminiSettings} New GeminiSettings instance
   */
  static fromJSON(data) {
    return new GeminiSettings(
      data.apiKey || "",
      data.model || "gemini-2.5-flash",
      data.createdAt ? new Date(data.createdAt) : new Date(),
      data.updatedAt ? new Date(data.updatedAt) : new Date()
    );
  }

  /**
   * Get default Gemini settings instance
   * @returns {GeminiSettings} Default settings
   */
  static getDefaults() {
    return new GeminiSettings();
  }

  /**
   * Validate settings data before creating instance
   * @param {Object} data - The settings data to validate
   * @returns {boolean} True if valid
   */
  static isValid(data) {
    return (
      data &&
      typeof data.apiKey === "string" &&
      typeof data.model === "string" &&
      GeminiSettings.isValidModel(data.model)
    );
  }

  /**
   * Get available Gemini models
   * @returns {Object} Available models with their properties
   */
  static getAvailableModels() {
    return {
      "gemini-2.5-flash": {
        name: "Gemini 2.5 Flash",
        description: "A lighter, faster, and more cost-efficient model for high-frequency tasks.",
        maxTokens: 1048576,
        supportsImages: true,
        supportsAudio: true,
      },
      "gemini-2.5-pro": {
        name: "Gemini 2.5 Pro",
        description: "The most capable Gemini model for complex, creative, and multi-modal tasks.",
        maxTokens: 1048576,
        supportsImages: true,
        supportsAudio: true,
      },
    };
  }

  /**
   * Check if a model is valid
   * @param {string} model - Model identifier to validate
   * @returns {boolean} True if model exists
   */
  static isValidModel(model) {
    return model in GeminiSettings.getAvailableModels();
  }

  /**
   * Get model data for the current selected model
   * @returns {Object} Current model configuration
   */
  getCurrentModelData() {
    const models = GeminiSettings.getAvailableModels();
    return models[this.model] || models["gemini-2.5-flash"];
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = GeminiSettings;
} else {
  window.GeminiSettings = GeminiSettings;
} 