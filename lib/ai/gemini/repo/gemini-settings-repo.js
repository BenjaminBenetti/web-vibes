/**
 * Repository for Gemini AI settings storage operations
 * Handles Chrome storage API interactions for Gemini configuration
 */
class GeminiSettingsRepository {
  constructor() {
    this.storageKey = "webVibesGeminiSettings";
  }

  /**
   * Get Gemini settings from storage
   * @returns {Promise<GeminiSettings>} The stored Gemini settings
   */
  async getGeminiSettings() {
    try {
      const result = await chrome.storage.local.get([this.storageKey]);
      const data = result[this.storageKey];

      if (!data) {
        return GeminiSettings.getDefaults();
      }

      if (!GeminiSettings.isValid(data)) {
        console.warn("Invalid Gemini settings data found, using defaults");
        return GeminiSettings.getDefaults();
      }

      return GeminiSettings.fromJSON(data);
    } catch (error) {
      console.error("Error getting Gemini settings:", error);
      throw error;
    }
  }

  /**
   * Save Gemini settings to storage
   * @param {GeminiSettings} settings - The Gemini settings to save
   * @returns {Promise<GeminiSettings>} The saved settings
   */
  async saveGeminiSettings(settings) {
    try {
      if (!(settings instanceof GeminiSettings)) {
        throw new Error("Invalid GeminiSettings instance");
      }

      await chrome.storage.local.set({
        [this.storageKey]: settings.toJSON(),
      });

      return settings;
    } catch (error) {
      console.error("Error saving Gemini settings:", error);
      throw error;
    }
  }

  /**
   * Delete Gemini settings from storage
   * @returns {Promise<void>}
   */
  async deleteGeminiSettings() {
    try {
      await chrome.storage.local.remove([this.storageKey]);
    } catch (error) {
      console.error("Error deleting Gemini settings:", error);
      throw error;
    }
  }

  /**
   * Check if Gemini settings exist in storage
   * @returns {Promise<boolean>} True if settings exist
   */
  async hasGeminiSettings() {
    try {
      const result = await chrome.storage.local.get([this.storageKey]);
      return !!result[this.storageKey];
    } catch (error) {
      console.error("Error checking Gemini settings existence:", error);
      throw error;
    }
  }

  /**
   * Get storage usage information for Gemini settings
   * @returns {Promise<Object>} Storage usage information
   */
  async getStorageInfo() {
    try {
      const result = await chrome.storage.local.get([this.storageKey]);
      const data = result[this.storageKey];

      if (!data) {
        return {
          exists: false,
          size: 0,
          lastModified: null,
        };
      }

      const dataString = JSON.stringify(data);
      const sizeInBytes = new Blob([dataString]).size;

      return {
        exists: true,
        size: sizeInBytes,
        sizeInKB: (sizeInBytes / 1024).toFixed(2),
        lastModified: data.updatedAt ? new Date(data.updatedAt) : null,
      };
    } catch (error) {
      console.error("Error getting Gemini settings storage info:", error);
      throw error;
    }
  }

  /**
   * Reset Gemini settings to defaults
   * @returns {Promise<GeminiSettings>} The default settings
   */
  async resetToDefaults() {
    try {
      const defaultSettings = GeminiSettings.getDefaults();
      await this.saveGeminiSettings(defaultSettings);
      return defaultSettings;
    } catch (error) {
      console.error("Error resetting Gemini settings to defaults:", error);
      throw error;
    }
  }

  /**
   * Update specific Gemini setting fields
   * @param {Object} updates - Object containing field updates
   * @returns {Promise<GeminiSettings>} The updated settings
   */
  async updateGeminiSettings(updates) {
    try {
      const currentSettings = await this.getGeminiSettings();

      // Apply updates
      for (const [key, value] of Object.entries(updates)) {
        if (currentSettings.hasOwnProperty(key)) {
          currentSettings[key] = value;
        }
      }

      currentSettings.updatedAt = new Date();

      await this.saveGeminiSettings(currentSettings);
      return currentSettings;
    } catch (error) {
      console.error("Error updating Gemini settings:", error);
      throw error;
    }
  }

  /**
   * Export Gemini settings as JSON string
   * @returns {Promise<string>} JSON string representation
   */
  async exportSettings() {
    try {
      const settings = await this.getGeminiSettings();
      return JSON.stringify(settings.toJSON(), null, 2);
    } catch (error) {
      console.error("Error exporting Gemini settings:", error);
      throw error;
    }
  }

  /**
   * Import Gemini settings from JSON string
   * @param {string} jsonString - JSON string to import
   * @returns {Promise<GeminiSettings>} The imported settings
   */
  async importSettings(jsonString) {
    try {
      const data = JSON.parse(jsonString);

      if (!GeminiSettings.isValid(data)) {
        throw new Error("Invalid Gemini settings data format");
      }

      const settings = GeminiSettings.fromJSON(data);
      await this.saveGeminiSettings(settings);
      return settings;
    } catch (error) {
      console.error("Error importing Gemini settings:", error);
      throw error;
    }
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = GeminiSettingsRepository;
} else {
  window.GeminiSettingsRepository = GeminiSettingsRepository;
} 