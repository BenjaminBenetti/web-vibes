/**
 * Service for managing extension settings
 * Handles business logic for settings using the Settings model and SettingsRepository
 */
class SettingsService {
  constructor(settingsRepository) {
    this.repository = settingsRepository;
  }

  /**
   * Get all settings as a Settings instance
   * @returns {Promise<Settings>} Settings instance with current values
   */
  async getAllSettings() {
    return await this.repository.getSettings();
  }

  /**
   * Save settings instance to storage
   * @param {Settings} settings - Settings instance to save
   * @returns {Promise<Settings>} Saved settings instance
   */
  async saveSettings(settings) {
    return await this.repository.saveSettings(settings);
  }

  /**
   * Update multiple settings at once
   * @param {Object} settingsObject - Object with setting key-value pairs
   * @returns {Promise<Settings>} Updated settings instance
   */
  async updateSettings(settingsObject) {
    const currentSettings = await this.getAllSettings();

    // Update the settings object
    Object.keys(settingsObject).forEach((key) => {
      if (key in currentSettings) {
        currentSettings[key] = settingsObject[key];
      }
    });

    currentSettings.updatedAt = new Date();
    return await this.saveSettings(currentSettings);
  }

  /**
   * Reset all settings to defaults
   * @returns {Promise<Settings>} Default settings instance
   */
  async resetToDefaults() {
    const defaultSettings = Settings.getDefaults();
    return await this.saveSettings(defaultSettings);
  }

  /**
   * Get available themes
   * @returns {Object} Available themes object
   */
  getAvailableThemes() {
    return Settings.getAvailableThemes();
  }

  /**
   * Get available AI providers
   * @returns {Object} Available AI providers object
   */
  getAvailableAIs() {
    return Settings.getAvailableAIs();
  }

  /**
   * Get current theme data
   * @returns {Promise<Object>} Current theme object
   */
  async getCurrentTheme() {
    const settings = await this.getAllSettings();
    return settings.getCurrentThemeData();
  }

  /**
   * Set the selected theme
   * @param {string} themeKey - Theme identifier
   * @returns {Promise<Settings>} Updated settings instance
   */
  async setTheme(themeKey) {
    if (!Settings.isValidTheme(themeKey)) {
      throw new Error(`Theme '${themeKey}' not found`);
    }

    const settings = await this.getAllSettings();
    settings.setTheme(themeKey);
    return await this.saveSettings(settings);
  }

  /**
   * Get current AI provider data
   * @returns {Promise<Object>} Current AI provider object
   */
  async getCurrentAI() {
    const settings = await this.getAllSettings();
    return settings.getCurrentAIData();
  }

  /**
   * Set the selected AI provider
   * @param {string} aiProvider - AI provider identifier
   * @returns {Promise<Settings>} Updated settings instance
   */
  async setAI(aiProvider) {
    if (!Settings.isValidAI(aiProvider)) {
      throw new Error(`AI provider '${aiProvider}' not found`);
    }

    const settings = await this.getAllSettings();
    settings.setAI(aiProvider);
    return await this.saveSettings(settings);
  }

  /**
   * Set AI credentials for a specific provider
   * @param {string} aiProvider - AI provider identifier
   * @param {Object} credentials - Credentials object
   * @returns {Promise<Settings>} Updated settings instance
   */
  async setAICredentials(aiProvider, credentials) {
    if (!Settings.isValidAI(aiProvider)) {
      throw new Error(`AI provider '${aiProvider}' not found`);
    }

    const settings = await this.getAllSettings();
    settings.setAICredentials(aiProvider, credentials);
    return await this.saveSettings(settings);
  }

  /**
   * Get AI credentials for a specific provider
   * @param {string} aiProvider - AI provider identifier
   * @returns {Promise<Object>} Credentials object
   */
  async getAICredentials(aiProvider) {
    const settings = await this.getAllSettings();
    return settings.getAICredentials(aiProvider);
  }

  /**
   * Clear AI credentials for a specific provider
   * @param {string} aiProvider - AI provider identifier
   * @returns {Promise<Settings>} Updated settings instance
   */
  async clearAICredentials(aiProvider) {
    const settings = await this.getAllSettings();
    settings.clearAICredentials(aiProvider);
    return await this.saveSettings(settings);
  }

  /**
   * Check if settings exist in storage
   * @returns {Promise<boolean>} True if settings exist
   */
  async hasSettings() {
    return await this.repository.hasSettings();
  }

  /**
   * Clear all settings
   * @returns {Promise<void>}
   */
  async clearAllSettings() {
    return await this.repository.clearSettings();
  }

  /**
   * Get storage usage information
   * @returns {Promise<Object>} Storage usage stats
   */
  async getStorageInfo() {
    return await this.repository.getStorageInfo();
  }

  /**
   * Check if current AI configuration is complete
   * @returns {Promise<boolean>} True if AI is properly configured
   */
  async isAIConfigured() {
    const settings = await this.getAllSettings();
    return settings.isAIConfigured();
  }

  /**
   * Set the max conversation size
   * @param {number} sizeInTokens - The max conversation size in tokens
   * @returns {Promise<Settings>} Updated settings instance
   */
  async setMaxConversationSize(sizeInTokens) {
    const settings = await this.getAllSettings();
    settings.setMaxConversationSize(sizeInTokens);
    return await this.saveSettings(settings);
  }

  /**
   * Set the max individual message size
   * @param {number} sizeInTokens - The max message size in tokens
   * @returns {Promise<Settings>} Updated settings instance
   */
  async setMaxIndividualMessageSize(sizeInTokens) {
    const settings = await this.getAllSettings();
    settings.setMaxIndividualMessageSize(sizeInTokens);
    return await this.saveSettings(settings);
  }
}
