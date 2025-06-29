/**
 * Service for Gemini AI settings business logic
 * Handles operations that combine model and repository functionality
 */
class GeminiSettingsService {
  constructor(geminiSettingsRepository) {
    if (!geminiSettingsRepository) {
      throw new Error("GeminiSettingsRepository is required");
    }
    this.repository = geminiSettingsRepository;
  }

  /**
   * Get all Gemini settings
   * @returns {Promise<GeminiSettings>} The current Gemini settings
   */
  async getAllSettings() {
    return await this.repository.getGeminiSettings();
  }

  /**
   * Update the API key
   * @param {string} apiKey - The new API key
   * @returns {Promise<GeminiSettings>} The updated settings
   */
  async setApiKey(apiKey) {
    const settings = await this.repository.getGeminiSettings();
    settings.setApiKey(apiKey);
    return await this.repository.saveGeminiSettings(settings);
  }

  /**
   * Update the model selection
   * @param {string} model - The model identifier
   * @returns {Promise<GeminiSettings>} The updated settings
   */
  async setModel(model) {
    const settings = await this.repository.getGeminiSettings();
    settings.setModel(model);
    return await this.repository.saveGeminiSettings(settings);
  }

  /**
   * Update generation parameters
   * @param {Object} params - Generation parameters to update
   * @returns {Promise<GeminiSettings>} The updated settings
   */
  async updateGenerationParams(params) {
    const settings = await this.repository.getGeminiSettings();

    if (params.temperature !== undefined) {
      settings.setTemperature(params.temperature);
    }
    if (params.maxTokens !== undefined) {
      settings.setMaxTokens(params.maxTokens);
    }
    if (params.topP !== undefined) {
      settings.setTopP(params.topP);
    }
    if (params.topK !== undefined) {
      settings.setTopK(params.topK);
    }

    return await this.repository.saveGeminiSettings(settings);
  }

  /**
   * Update safety settings
   * @param {Object} safetySettings - New safety settings
   * @returns {Promise<GeminiSettings>} The updated settings
   */
  async updateSafetySettings(safetySettings) {
    const settings = await this.repository.getGeminiSettings();
    settings.setSafetySettings(safetySettings);
    return await this.repository.saveGeminiSettings(settings);
  }

  /**
   * Update generation configuration
   * @param {Object} generationConfig - New generation configuration
   * @returns {Promise<GeminiSettings>} The updated settings
   */
  async updateGenerationConfig(generationConfig) {
    const settings = await this.repository.getGeminiSettings();
    settings.setGenerationConfig(generationConfig);
    return await this.repository.saveGeminiSettings(settings);
  }

  /**
   * Check if Gemini is properly configured
   * @returns {Promise<boolean>} True if configured
   */
  async isConfigured() {
    const settings = await this.repository.getGeminiSettings();
    return settings.isConfigured();
  }

  /**
   * Reset settings to defaults
   * @returns {Promise<GeminiSettings>} The default settings
   */
  async resetToDefaults() {
    return await this.repository.resetToDefaults();
  }

  /**
   * Get available models for selection
   * @returns {Object} Available models with their properties
   */
  getAvailableModels() {
    return GeminiSettings.getAvailableModels();
  }

  /**
   * Get available safety levels
   * @returns {Object} Available safety levels with descriptions
   */
  getSafetyLevels() {
    return GeminiSettings.getSafetyLevels();
  }

  /**
   * Get current model information
   * @returns {Promise<Object>} Current model data
   */
  async getCurrentModelInfo() {
    const settings = await this.repository.getGeminiSettings();
    return settings.getCurrentModelData();
  }

  /**
   * Validate API key format (basic validation)
   * @param {string} apiKey - The API key to validate
   * @returns {boolean} True if format looks valid
   */
  validateApiKeyFormat(apiKey) {
    if (!apiKey || typeof apiKey !== "string") {
      return false;
    }

    // Basic Gemini API key format validation
    // Gemini API keys typically start with "AI" and are 39 characters long
    const trimmedKey = apiKey.trim();
    return trimmedKey.length > 0 && trimmedKey.length >= 20;
  }

  /**
   * Get settings summary for display
   * @returns {Promise<Object>} Summary of current settings
   */
  async getSettingsSummary() {
    const settings = await this.repository.getGeminiSettings();
    const modelInfo = settings.getCurrentModelData();

    return {
      isConfigured: settings.isConfigured(),
      model: {
        key: settings.model,
        name: modelInfo.name,
        description: modelInfo.description,
      },
      generation: {
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        topP: settings.topP,
        topK: settings.topK,
      },
      safety: {
        harassment: settings.safetySettings.harassment,
        hateSpeech: settings.safetySettings.hateSpeech,
        sexuallyExplicit: settings.safetySettings.sexuallyExplicit,
        dangerousContent: settings.safetySettings.dangerousContent,
      },
      lastUpdated: settings.updatedAt,
    };
  }

  /**
   * Export settings for backup
   * @returns {Promise<string>} JSON string of settings
   */
  async exportSettings() {
    return await this.repository.exportSettings();
  }

  /**
   * Import settings from backup
   * @param {string} jsonString - JSON string of settings
   * @returns {Promise<GeminiSettings>} The imported settings
   */
  async importSettings(jsonString) {
    return await this.repository.importSettings(jsonString);
  }

  /**
   * Get storage information
   * @returns {Promise<Object>} Storage usage information
   */
  async getStorageInfo() {
    return await this.repository.getStorageInfo();
  }

  /**
   * Test API key validity by making a simple request
   * @param {string} apiKey - The API key to test
   * @returns {Promise<boolean>} True if API key is valid
   */
  async testApiKey(apiKey) {
    try {
      // This would typically make a test API call to Gemini
      // For now, we'll just validate the format
      return this.validateApiKeyFormat(apiKey);
    } catch (error) {
      console.error("Error testing API key:", error);
      return false;
    }
  }

  /**
   * Get recommended settings for different use cases
   * @returns {Object} Recommended settings presets
   */
  getRecommendedSettings() {
    return {
      creative: {
        name: "Creative Writing",
        description: "Optimized for creative and imaginative content",
        settings: {
          temperature: 0.9,
          topP: 0.95,
          topK: 40,
          model: "gemini-1.5-pro",
        },
      },
      analytical: {
        name: "Analytical",
        description: "Optimized for precise and factual responses",
        settings: {
          temperature: 0.1,
          topP: 0.8,
          topK: 20,
          model: "gemini-1.5-flash",
        },
      },
      balanced: {
        name: "Balanced",
        description: "Good balance between creativity and accuracy",
        settings: {
          temperature: 0.7,
          topP: 0.9,
          topK: 40,
          model: "gemini-1.5-flash",
        },
      },
      conservative: {
        name: "Conservative",
        description: "Conservative safety settings with strict filtering",
        settings: {
          temperature: 0.5,
          topP: 0.8,
          topK: 30,
          model: "gemini-1.5-flash",
          safetySettings: {
            harassment: "BLOCK_LOW_AND_ABOVE",
            hateSpeech: "BLOCK_LOW_AND_ABOVE",
            sexuallyExplicit: "BLOCK_LOW_AND_ABOVE",
            dangerousContent: "BLOCK_LOW_AND_ABOVE",
          },
        },
      },
    };
  }

  /**
   * Apply a recommended settings preset
   * @param {string} presetKey - The preset to apply
   * @returns {Promise<GeminiSettings>} The updated settings
   */
  async applyRecommendedSettings(presetKey) {
    const presets = this.getRecommendedSettings();
    const preset = presets[presetKey];

    if (!preset) {
      throw new Error(`Preset '${presetKey}' not found`);
    }

    const settings = await this.repository.getGeminiSettings();

    // Apply preset settings
    if (preset.settings.temperature !== undefined) {
      settings.setTemperature(preset.settings.temperature);
    }
    if (preset.settings.topP !== undefined) {
      settings.setTopP(preset.settings.topP);
    }
    if (preset.settings.topK !== undefined) {
      settings.setTopK(preset.settings.topK);
    }
    if (preset.settings.model !== undefined) {
      settings.setModel(preset.settings.model);
    }
    if (preset.settings.safetySettings !== undefined) {
      settings.setSafetySettings(preset.settings.safetySettings);
    }

    return await this.repository.saveGeminiSettings(settings);
  }

  /**
   * Set all Gemini settings fields from a credentials/settings object
   * @param {Object} data - Object with any Gemini settings fields
   * @returns {Promise<GeminiSettings>} The updated settings
   */
  async setAll(data) {
    const settings = await this.repository.getGeminiSettings();
    if (data.apiKey !== undefined) settings.setApiKey(data.apiKey);
    if (data.model !== undefined) settings.setModel(data.model);
    if (data.temperature !== undefined) settings.setTemperature(data.temperature);
    if (data.maxTokens !== undefined) settings.setMaxTokens(data.maxTokens);
    if (data.topP !== undefined) settings.setTopP(data.topP);
    if (data.topK !== undefined) settings.setTopK(data.topK);
    if (data.safetySettings !== undefined) settings.setSafetySettings(data.safetySettings);
    if (data.generationConfig !== undefined) settings.setGenerationConfig(data.generationConfig);
    return await this.repository.saveGeminiSettings(settings);
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = GeminiSettingsService;
} else {
  window.GeminiSettingsService = GeminiSettingsService;
} 