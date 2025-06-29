/**
 * Data model for Gemini AI specific settings
 * Represents Gemini API configuration and preferences
 */
class GeminiSettings {
  constructor(
    apiKey = "",
    model = "gemini-1.5-flash",
    temperature = 0.7,
    maxTokens = 2048,
    topP = 0.9,
    topK = 40,
    safetySettings = GeminiSettings.getDefaultSafetySettings(),
    generationConfig = GeminiSettings.getDefaultGenerationConfig(),
    createdAt = new Date(),
    updatedAt = new Date()
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.temperature = temperature;
    this.maxTokens = maxTokens;
    this.topP = topP;
    this.topK = topK;
    this.safetySettings = safetySettings;
    this.generationConfig = generationConfig;
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
   * Set the temperature for generation
   * @param {number} temperature - Temperature value between 0 and 2
   */
  setTemperature(temperature) {
    if (temperature < 0 || temperature > 2) {
      throw new Error("Temperature must be between 0 and 2");
    }
    this.temperature = temperature;
    this.updatedAt = new Date();
  }

  /**
   * Set the maximum tokens for generation
   * @param {number} maxTokens - Maximum tokens between 1 and 8192
   */
  setMaxTokens(maxTokens) {
    if (maxTokens < 1 || maxTokens > 8192) {
      throw new Error("Max tokens must be between 1 and 8192");
    }
    this.maxTokens = maxTokens;
    this.updatedAt = new Date();
  }

  /**
   * Set the top-p value for generation
   * @param {number} topP - Top-p value between 0 and 1
   */
  setTopP(topP) {
    if (topP < 0 || topP > 1) {
      throw new Error("Top-p must be between 0 and 1");
    }
    this.topP = topP;
    this.updatedAt = new Date();
  }

  /**
   * Set the top-k value for generation
   * @param {number} topK - Top-k value between 1 and 40
   */
  setTopK(topK) {
    if (topK < 1 || topK > 40) {
      throw new Error("Top-k must be between 1 and 40");
    }
    this.topK = topK;
    this.updatedAt = new Date();
  }

  /**
   * Set safety settings for content generation
   * @param {Object} safetySettings - Safety settings configuration
   */
  setSafetySettings(safetySettings) {
    if (!GeminiSettings.isValidSafetySettings(safetySettings)) {
      throw new Error("Invalid safety settings configuration");
    }
    this.safetySettings = safetySettings;
    this.updatedAt = new Date();
  }

  /**
   * Set generation configuration
   * @param {Object} generationConfig - Generation configuration
   */
  setGenerationConfig(generationConfig) {
    if (!GeminiSettings.isValidGenerationConfig(generationConfig)) {
      throw new Error("Invalid generation configuration");
    }
    this.generationConfig = generationConfig;
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
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      topP: this.topP,
      topK: this.topK,
      safetySettings: this.safetySettings,
      generationConfig: this.generationConfig,
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
      data.model || "gemini-1.5-flash",
      data.temperature || 0.7,
      data.maxTokens || 2048,
      data.topP || 0.9,
      data.topK || 40,
      data.safetySettings || GeminiSettings.getDefaultSafetySettings(),
      data.generationConfig || GeminiSettings.getDefaultGenerationConfig(),
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
      GeminiSettings.isValidModel(data.model) &&
      typeof data.temperature === "number" &&
      data.temperature >= 0 &&
      data.temperature <= 2 &&
      typeof data.maxTokens === "number" &&
      data.maxTokens >= 1 &&
      data.maxTokens <= 8192 &&
      typeof data.topP === "number" &&
      data.topP >= 0 &&
      data.topP <= 1 &&
      typeof data.topK === "number" &&
      data.topK >= 1 &&
      data.topK <= 40 &&
      GeminiSettings.isValidSafetySettings(data.safetySettings) &&
      GeminiSettings.isValidGenerationConfig(data.generationConfig)
    );
  }

  /**
   * Get available Gemini models
   * @returns {Object} Available models with their properties
   */
  static getAvailableModels() {
    return {
      "gemini-1.5-flash": {
        name: "Gemini 1.5 Flash",
        description: "Fast and efficient model for most tasks",
        maxTokens: 8192,
        supportsImages: true,
        supportsAudio: false,
      },
      "gemini-1.5-pro": {
        name: "Gemini 1.5 Pro",
        description: "Most capable model for complex tasks",
        maxTokens: 8192,
        supportsImages: true,
        supportsAudio: true,
      },
      "gemini-1.0-pro": {
        name: "Gemini 1.0 Pro",
        description: "Previous generation pro model",
        maxTokens: 30720,
        supportsImages: true,
        supportsAudio: false,
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
   * Get default safety settings
   * @returns {Object} Default safety settings
   */
  static getDefaultSafetySettings() {
    return {
      harassment: "BLOCK_MEDIUM_AND_ABOVE",
      hateSpeech: "BLOCK_MEDIUM_AND_ABOVE",
      sexuallyExplicit: "BLOCK_MEDIUM_AND_ABOVE",
      dangerousContent: "BLOCK_MEDIUM_AND_ABOVE",
    };
  }

  /**
   * Validate safety settings
   * @param {Object} safetySettings - Safety settings to validate
   * @returns {boolean} True if valid
   */
  static isValidSafetySettings(safetySettings) {
    const validLevels = [
      "BLOCK_LOW_AND_ABOVE",
      "BLOCK_MEDIUM_AND_ABOVE",
      "BLOCK_HIGH_AND_ABOVE",
      "BLOCK_NONE",
    ];

    const requiredCategories = [
      "harassment",
      "hateSpeech",
      "sexuallyExplicit",
      "dangerousContent",
    ];

    if (!safetySettings || typeof safetySettings !== "object") {
      return false;
    }

    for (const category of requiredCategories) {
      if (
        !safetySettings[category] ||
        !validLevels.includes(safetySettings[category])
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get default generation configuration
   * @returns {Object} Default generation configuration
   */
  static getDefaultGenerationConfig() {
    return {
      stopSequences: [],
      candidateCount: 1,
      includeEchoPrompt: false,
    };
  }

  /**
   * Validate generation configuration
   * @param {Object} generationConfig - Generation config to validate
   * @returns {boolean} True if valid
   */
  static isValidGenerationConfig(generationConfig) {
    if (!generationConfig || typeof generationConfig !== "object") {
      return false;
    }

    if (
      generationConfig.stopSequences &&
      (!Array.isArray(generationConfig.stopSequences) ||
        !generationConfig.stopSequences.every((seq) => typeof seq === "string"))
    ) {
      return false;
    }

    if (
      generationConfig.candidateCount &&
      (typeof generationConfig.candidateCount !== "number" ||
        generationConfig.candidateCount < 1 ||
        generationConfig.candidateCount > 4)
    ) {
      return false;
    }

    if (
      generationConfig.includeEchoPrompt &&
      typeof generationConfig.includeEchoPrompt !== "boolean"
    ) {
      return false;
    }

    return true;
  }

  /**
   * Get model data for the current selected model
   * @returns {Object} Current model configuration
   */
  getCurrentModelData() {
    const models = GeminiSettings.getAvailableModels();
    return models[this.model] || models["gemini-1.5-flash"];
  }

  /**
   * Get safety level options
   * @returns {Object} Available safety levels with descriptions
   */
  static getSafetyLevels() {
    return {
      BLOCK_NONE: {
        name: "Allow All",
        description: "No content filtering",
      },
      BLOCK_LOW_AND_ABOVE: {
        name: "Block Low+",
        description: "Block low and higher risk content",
      },
      BLOCK_MEDIUM_AND_ABOVE: {
        name: "Block Medium+",
        description: "Block medium and higher risk content",
      },
      BLOCK_HIGH_AND_ABOVE: {
        name: "Block High+",
        description: "Block only high risk content",
      },
    };
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = GeminiSettings;
} else {
  window.GeminiSettings = GeminiSettings;
} 