/**
 * Repository for managing hack data storage using Chrome's storage API
 * Handles persistence and retrieval of hack data organized by hostname
 */
class HackRepository {
  constructor() {
    this.storageKey = "webVibesHacks";
  }

  /**
   * Get all hacks for a specific site/hostname
   * @param {string} hostname - The hostname to get hacks for
   * @returns {Promise<Hack[]>} Array of Hack instances
   */
  async getHacksForSite(hostname) {
    try {
      const result = await chrome.storage.local.get([this.storageKey]);
      const allHacks = result[this.storageKey] || {};
      const siteHacks = allHacks[hostname] || [];
      return siteHacks.map((hackData) => Hack.fromJSON(hackData));
    } catch (error) {
      console.error("Error loading hacks:", error);
      return [];
    }
  }

  /**
   * Save hacks for a specific site/hostname
   * @param {string} hostname - The hostname to save hacks for
   * @param {Hack[]} hacks - Array of Hack instances to save
   * @returns {Promise<void>}
   */
  async saveHacksForSite(hostname, hacks) {
    try {
      const result = await chrome.storage.local.get([this.storageKey]);
      const allHacks = result[this.storageKey] || {};
      allHacks[hostname] = hacks.map((hack) => hack.toJSON());
      await chrome.storage.local.set({ [this.storageKey]: allHacks });
    } catch (error) {
      console.error("Error saving hacks:", error);
      throw error;
    }
  }

  /**
   * Add a new hack for a specific site
   * @param {string} hostname - The hostname to add hack for
   * @param {Hack} hack - The hack to add
   * @returns {Promise<Hack[]>} Updated array of hacks
   */
  async addHack(hostname, hack) {
    const hacks = await this.getHacksForSite(hostname);
    hacks.push(hack);
    await this.saveHacksForSite(hostname, hacks);
    return hacks;
  }

  /**
   * Delete a hack from a specific site
   * @param {string} hostname - The hostname to delete hack from
   * @param {string} hackId - The ID of the hack to delete
   * @returns {Promise<Hack[]>} Updated array of hacks
   */
  async deleteHack(hostname, hackId) {
    const hacks = await this.getHacksForSite(hostname);
    const filteredHacks = hacks.filter((hack) => hack.id !== hackId);
    await this.saveHacksForSite(hostname, filteredHacks);
    return filteredHacks;
  }

  /**
   * Toggle the enabled state of a hack
   * @param {string} hostname - The hostname of the hack
   * @param {string} hackId - The ID of the hack to toggle
   * @returns {Promise<Hack[]>} Updated array of hacks
   */
  async toggleHack(hostname, hackId) {
    const hacks = await this.getHacksForSite(hostname);
    const hack = hacks.find((h) => h.id === hackId);
    if (hack) {
      hack.toggle();
      await this.saveHacksForSite(hostname, hacks);
    }
    return hacks;
  }

  /**
   * Update an existing hack
   * @param {string} hostname - The hostname of the hack
   * @param {string} hackId - The ID of the hack to update
   * @param {Object} updates - The updates to apply
   * @returns {Promise<Hack[]>} Updated array of hacks
   */
  async updateHack(hostname, hackId, updates) {
    const hacks = await this.getHacksForSite(hostname);
    const hackIndex = hacks.findIndex((h) => h.id === hackId);

    if (hackIndex !== -1) {
      // Apply updates to the hack
      Object.assign(hacks[hackIndex], updates);
      await this.saveHacksForSite(hostname, hacks);
    }

    return hacks;
  }

  /**
   * Get all hostnames that have hacks
   * @returns {Promise<string[]>} Array of hostnames
   */
  async getAllSites() {
    try {
      const result = await chrome.storage.local.get([this.storageKey]);
      const allHacks = result[this.storageKey] || {};
      return Object.keys(allHacks);
    } catch (error) {
      console.error("Error getting all sites:", error);
      return [];
    }
  }

  /**
   * Clear all hacks for a specific site
   * @param {string} hostname - The hostname to clear hacks for
   * @returns {Promise<void>}
   */
  async clearSiteHacks(hostname) {
    try {
      const result = await chrome.storage.local.get([this.storageKey]);
      const allHacks = result[this.storageKey] || {};
      delete allHacks[hostname];
      await chrome.storage.local.set({ [this.storageKey]: allHacks });
    } catch (error) {
      console.error("Error clearing site hacks:", error);
      throw error;
    }
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = HackRepository;
} else {
  window.HackRepository = HackRepository;
}
