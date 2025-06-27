/**
 * Service for managing hack operations and business logic
 * Acts as an intermediary between the UI and the repository
 */
class HackService {
  constructor(repository) {
    this.repository = repository;
  }

  /**
   * Get all hacks for the currently active browser tab
   * @returns {Promise<{hostname: string, hacks: Hack[]}>} Current site info and hacks
   */
  async getHacksForCurrentSite() {
    const hostname = await this.getCurrentHostname();
    const hacks = await this.repository.getHacksForSite(hostname);
    return {
      hostname,
      hacks,
    };
  }

  /**
   * Get the hostname of the currently active browser tab
   * @returns {Promise<string>} The hostname or 'unknown' if unable to determine
   */
  async getCurrentHostname() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab?.url) {
        const url = new URL(tab.url);
        return url.hostname;
      }
    } catch (error) {
      console.error("Error getting current hostname:", error);
    }
    return "unknown";
  }

  /**
   * Create a new hack for a specific site
   * @param {string} hostname - The hostname to create hack for
   * @param {Object} hackData - The hack data (name, description, cssCode, jsCode)
   * @returns {Promise<Hack[]>} Updated array of hacks
   */
  async createHack(hostname, hackData) {
    const hackId = this.generateHackId();
    const hack = new Hack(
      hackId,
      hackData.name,
      hackData.description,
      hackData.cssCode || "",
      hackData.jsCode || "",
      hackData.enabled !== undefined ? hackData.enabled : true
    );

    return await this.repository.addHack(hostname, hack);
  }

  /**
   * Create a hack for the current site
   * @param {Object} hackData - The hack data
   * @returns {Promise<Hack[]>} Updated array of hacks
   */
  async createHackForCurrentSite(hackData) {
    const hostname = await this.getCurrentHostname();
    return await this.createHack(hostname, hackData);
  }

  /**
   * Delete a hack from a specific site
   * @param {string} hostname - The hostname to delete hack from
   * @param {string} hackId - The ID of the hack to delete
   * @returns {Promise<Hack[]>} Updated array of hacks
   */
  async deleteHack(hostname, hackId) {
    return await this.repository.deleteHack(hostname, hackId);
  }

  /**
   * Toggle the enabled state of a hack
   * @param {string} hostname - The hostname of the hack
   * @param {string} hackId - The ID of the hack to toggle
   * @returns {Promise<Hack[]>} Updated array of hacks
   */
  async toggleHack(hostname, hackId) {
    const updatedHacks = await this.repository.toggleHack(hostname, hackId);

    // Notify content script to apply/remove the hack
    await this.notifyContentScript(hostname);

    return updatedHacks;
  }

  /**
   * Update an existing hack
   * @param {string} hostname - The hostname of the hack
   * @param {string} hackId - The ID of the hack to update
   * @param {Object} updates - The updates to apply
   * @returns {Promise<Hack[]>} Updated array of hacks
   */
  async updateHack(hostname, hackId, updates) {
    return await this.repository.updateHack(hostname, hackId, updates);
  }

  /**
   * Get all enabled hacks for a specific site
   * @param {string} hostname - The hostname to get enabled hacks for
   * @returns {Promise<Hack[]>} Array of enabled hacks
   */
  async getEnabledHacksForSite(hostname) {
    const allHacks = await this.repository.getHacksForSite(hostname);
    return allHacks.filter((hack) => hack.enabled);
  }

  /**
   * Get all sites that have hacks
   * @returns {Promise<string[]>} Array of hostnames
   */
  async getAllSitesWithHacks() {
    return await this.repository.getAllSites();
  }

  /**
   * Export hacks for a specific site
   * @param {string} hostname - The hostname to export hacks for
   * @returns {Promise<Object>} Export data
   */
  async exportHacksForSite(hostname) {
    const hacks = await this.repository.getHacksForSite(hostname);
    return {
      hostname,
      exportDate: new Date().toISOString(),
      hacks: hacks.map((hack) => hack.toJSON()),
    };
  }

  /**
   * Import hacks for a specific site
   * @param {Object} importData - The import data
   * @returns {Promise<Hack[]>} Updated array of hacks
   */
  async importHacksForSite(importData) {
    if (!importData.hostname || !Array.isArray(importData.hacks)) {
      throw new Error("Invalid import data format");
    }

    const hacks = importData.hacks.map((hackData) => Hack.fromJSON(hackData));
    await this.repository.saveHacksForSite(importData.hostname, hacks);
    return hacks;
  }

  /**
   * Generate a unique ID for a new hack
   * @returns {string} Unique hack ID
   */
  generateHackId() {
    return "hack_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Notify the content script that hacks have been updated
   * @param {string} hostname - The hostname that was updated
   * @returns {Promise<void>}
   */
  async notifyContentScript(hostname) {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab?.id) {
        await chrome.tabs.sendMessage(tab.id, {
          type: MESSAGE_TYPES.HACKS_UPDATED,
          hostname: hostname,
        });
      }
    } catch (error) {
      // Content script might not be loaded yet, or tab might not support injection
      console.log("Could not notify content script:", error.message);
    }
  }

  /**
   * Validate hack data before processing
   * @param {Object} hackData - The hack data to validate
   * @returns {boolean} True if valid
   */
  validateHackData(hackData) {
    return (
      hackData &&
      typeof hackData.name === "string" &&
      hackData.name.trim().length > 0 &&
      (typeof hackData.cssCode === "string" ||
        typeof hackData.jsCode === "string")
    );
  }

  /**
   * Apply all enabled hacks for the current site automatically
   * @returns {Promise<Object>} Result of the application
   */
  async applyHacksForCurrentSite() {
    try {
      const hostname = await this.getCurrentHostname();
      const enabledHacks = await this.getEnabledHacksForSite(hostname);

      if (enabledHacks.length === 0) {
        return {
          success: true,
          applied: 0,
          total: 0,
          message: `No enabled hacks found for ${hostname}`
        };
      }

      // Get the current active tab
      const [activeTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!activeTab) {
        throw new Error("No active tab found");
      }

      // Request the service worker to apply hacks
      const response = await chrome.runtime.sendMessage({
        type: MESSAGE_TYPES.APPLY_HACKS_FOR_SITE,
        tabId: activeTab.id,
        hostname: hostname
      });

      if (response && response.success) {
        return {
          success: true,
          ...response.result,
          message: `Applied ${response.result.applied}/${response.result.total} hacks for ${hostname}`
        };
      } else {
        throw new Error(response?.error || "Failed to apply hacks");
      }
    } catch (error) {
      console.error("Error applying hacks for current site:", error);
      return {
        success: false,
        error: error.message,
        applied: 0,
        total: 0
      };
    }
  }

  /**
   * Get all enabled hacks for the current site
   * @returns {Promise<Hack[]>} Array of enabled hacks
   */
  async getEnabledHacksForCurrentSite() {
    const hostname = await this.getCurrentHostname();
    return await this.getEnabledHacksForSite(hostname);
  }

  /**
   * Check if the current site has any enabled hacks
   * @returns {Promise<boolean>} True if the site has enabled hacks
   */
  async hasEnabledHacksForCurrentSite() {
    const enabledHacks = await this.getEnabledHacksForCurrentSite();
    return enabledHacks.length > 0;
  }

  /**
   * Get a summary of hacks for the current site
   * @returns {Promise<Object>} Summary of hacks
   */
  async getHacksSummaryForCurrentSite() {
    const hostname = await this.getCurrentHostname();
    const allHacks = await this.repository.getHacksForSite(hostname);
    const enabledHacks = allHacks.filter(hack => hack.enabled);

    return {
      hostname,
      total: allHacks.length,
      enabled: enabledHacks.length,
      disabled: allHacks.length - enabledHacks.length,
      hacks: allHacks.map(hack => ({
        id: hack.id,
        name: hack.name,
        enabled: hack.enabled,
        hasCSS: !!(hack.cssCode && hack.cssCode.trim()),
        hasJS: !!(hack.jsCode && hack.jsCode.trim())
      }))
    };
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = HackService;
} else {
  window.HackService = HackService;
}
