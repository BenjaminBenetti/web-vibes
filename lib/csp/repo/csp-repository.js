/**
 * Repository for managing CSP settings storage
 * Handles persistence of CSP settings using Chrome storage API
 */
class CSPRepository {
  constructor() {
    this.storageKey = "csp_settings";
  }

  /**
   * Get CSP settings for a specific hostname
   * @param {string} hostname - The hostname to get settings for
   * @returns {Promise<CSPSettings|null>} CSP settings or null if not found
   */
  async getCSPSettings(hostname) {
    try {
      const result = await chrome.storage.local.get(this.storageKey);
      const allSettings = result[this.storageKey] || {};

      if (allSettings[hostname]) {
        return CSPSettings.fromStorage(allSettings[hostname]);
      }

      return null;
    } catch (error) {
      console.error("Error getting CSP settings:", error);
      return null;
    }
  }

  /**
   * Save CSP settings for a hostname
   * @param {CSPSettings} cspSettings - The CSP settings to save
   * @returns {Promise<CSPSettings>} Saved CSP settings
   */
  async saveCSPSettings(cspSettings) {
    try {
      if (!cspSettings.isValid()) {
        throw new Error("Invalid CSP settings");
      }

      const result = await chrome.storage.local.get(this.storageKey);
      const allSettings = result[this.storageKey] || {};

      allSettings[cspSettings.hostname] = cspSettings.toStorage();

      await chrome.storage.local.set({
        [this.storageKey]: allSettings,
      });

      return cspSettings;
    } catch (error) {
      console.error("Error saving CSP settings:", error);
      throw error;
    }
  }

  /**
   * Delete CSP settings for a hostname
   * @param {string} hostname - The hostname to delete settings for
   * @returns {Promise<boolean>} True if deleted successfully
   */
  async deleteCSPSettings(hostname) {
    try {
      const result = await chrome.storage.local.get(this.storageKey);
      const allSettings = result[this.storageKey] || {};

      if (allSettings[hostname]) {
        delete allSettings[hostname];
        await chrome.storage.local.set({
          [this.storageKey]: allSettings,
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error deleting CSP settings:", error);
      return false;
    }
  }

  /**
   * Get all CSP settings
   * @returns {Promise<Object>} Object with hostname as key and CSPSettings as value
   */
  async getAllCSPSettings() {
    try {
      const result = await chrome.storage.local.get(this.storageKey);
      const allSettings = result[this.storageKey] || {};

      const cspSettingsMap = {};
      for (const [hostname, data] of Object.entries(allSettings)) {
        cspSettingsMap[hostname] = CSPSettings.fromStorage(data);
      }

      return cspSettingsMap;
    } catch (error) {
      console.error("Error getting all CSP settings:", error);
      return {};
    }
  }

  /**
   * Check if CSP settings exist for a hostname
   * @param {string} hostname - The hostname to check
   * @returns {Promise<boolean>} True if settings exist
   */
  async hasCSPSettings(hostname) {
    try {
      const result = await chrome.storage.local.get(this.storageKey);
      const allSettings = result[this.storageKey] || {};
      return hostname in allSettings;
    } catch (error) {
      console.error("Error checking CSP settings existence:", error);
      return false;
    }
  }

  /**
   * Clear all CSP settings
   * @returns {Promise<void>}
   */
  async clearAllCSPSettings() {
    try {
      await chrome.storage.local.remove(this.storageKey);
    } catch (error) {
      console.error("Error clearing all CSP settings:", error);
      throw error;
    }
  }

  /**
   * Get storage usage information for CSP settings
   * @returns {Promise<Object>} Storage usage stats
   */
  async getStorageInfo() {
    try {
      const result = await chrome.storage.local.get(this.storageKey);
      const allSettings = result[this.storageKey] || {};

      return {
        totalHostnames: Object.keys(allSettings).length,
        enabledHostnames: Object.values(allSettings).filter((s) => s.enabled)
          .length,
        serviceWorkerBlockingEnabledHostnames: Object.values(
          allSettings
        ).filter((s) => s.serviceWorkerBlockingEnabled).length,
        storageSize: JSON.stringify(allSettings).length,
      };
    } catch (error) {
      console.error("Error getting CSP storage info:", error);
      return {
        totalHostnames: 0,
        enabledHostnames: 0,
        serviceWorkerBlockingEnabledHostnames: 0,
        storageSize: 0,
      };
    }
  }
}
