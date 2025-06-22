/**
 * Repository for managing settings data storage using Chrome's storage API
 * Handles persistence and retrieval of extension settings
 */
class SettingsRepository {
  constructor() {
    this.storageKey = "webVibesSettings";
  }

  /**
   * Get settings from storage
   * @returns {Promise<Settings>} Settings instance
   */
  async getSettings() {
    try {
      const result = await chrome.storage.local.get([this.storageKey]);
      const storedData = result[this.storageKey];

      if (storedData && Settings.isValid(storedData)) {
        return Settings.fromJSON(storedData);
      }

      // Return defaults if no valid stored settings
      return Settings.getDefaults();
    } catch (error) {
      console.error("Error loading settings:", error);
      return Settings.getDefaults();
    }
  }

  /**
   * Save settings to storage
   * @param {Settings} settings - Settings instance to save
   * @returns {Promise<Settings>} Saved settings instance
   */
  async saveSettings(settings) {
    try {
      await chrome.storage.local.set({ [this.storageKey]: settings.toJSON() });
      return settings;
    } catch (error) {
      console.error("Error saving settings:", error);
      throw error;
    }
  }

  /**
   * Clear all settings from storage
   * @returns {Promise<void>}
   */
  async clearSettings() {
    try {
      await chrome.storage.local.remove([this.storageKey]);
    } catch (error) {
      console.error("Error clearing settings:", error);
      throw error;
    }
  }

  /**
   * Check if settings exist in storage
   * @returns {Promise<boolean>} True if settings exist
   */
  async hasSettings() {
    try {
      const result = await chrome.storage.local.get([this.storageKey]);
      return result[this.storageKey] !== undefined;
    } catch (error) {
      console.error("Error checking settings existence:", error);
      return false;
    }
  }

  /**
   * Get storage usage information for settings
   * @returns {Promise<Object>} Storage usage stats
   */
  async getStorageInfo() {
    try {
      const bytesInUse = await chrome.storage.local.getBytesInUse([
        this.storageKey,
      ]);
      const quota = chrome.storage.local.QUOTA_BYTES || 5242880; // 5MB default

      return {
        used: bytesInUse,
        total: quota,
        percentage: Math.round((bytesInUse / quota) * 100),
        key: this.storageKey,
      };
    } catch (error) {
      console.error("Error getting storage info:", error);
      return {
        used: 0,
        total: 5242880,
        percentage: 0,
        key: this.storageKey,
      };
    }
  }
}
