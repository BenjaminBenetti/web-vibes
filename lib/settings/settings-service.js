/**
 * Service for managing extension settings
 * Handles reading, writing, and validating settings
 */
class SettingsService {
  constructor() {
    this.defaultSettings = {
      // Settings will be added here as needed
    };
  }

  /**
   * Get all settings
   * @returns {Promise<Object>} All settings with defaults applied
   */
  async getAllSettings() {
    try {
      const result = await chrome.storage.local.get("webVibesSettings");
      const storedSettings = result.webVibesSettings || {};

      // Merge with defaults to ensure all settings exist
      return { ...this.defaultSettings, ...storedSettings };
    } catch (error) {
      console.error("Error getting settings:", error);
      return this.defaultSettings;
    }
  }

  /**
   * Update multiple settings at once
   * @param {Object} settingsObject - Object with setting key-value pairs
   * @returns {Promise<Object>} Updated settings object
   */
  async updateSettings(settingsObject) {
    const currentSettings = await this.getAllSettings();
    const updatedSettings = { ...currentSettings, ...settingsObject };

    await chrome.storage.local.set({ webVibesSettings: updatedSettings });
    return updatedSettings;
  }

  /**
   * Reset all settings to defaults
   * @returns {Promise<Object>} Default settings object
   */
  async resetToDefaults() {
    await chrome.storage.local.set({ webVibesSettings: this.defaultSettings });
    return this.defaultSettings;
  }
}
