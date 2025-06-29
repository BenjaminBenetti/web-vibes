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
   * Set all Gemini settings fields from a credentials/settings object
   * @param {Object} data - Object with any Gemini settings fields
   * @returns {Promise<GeminiSettings>} The updated settings
   */
  async setAll(data) {
    const settings = await this.repository.getGeminiSettings();
    if (data.apiKey !== undefined) settings.setApiKey(data.apiKey);
    if (data.model !== undefined) settings.setModel(data.model);
    return await this.repository.saveGeminiSettings(settings);
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = GeminiSettingsService;
} else {
  window.GeminiSettingsService = GeminiSettingsService;
} 