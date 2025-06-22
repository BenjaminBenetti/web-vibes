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
    Object.keys(settingsObject).forEach(key => {
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
}
