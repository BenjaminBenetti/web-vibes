/**
 * Service for managing CSP (Content Security Policy) rule busting
 * Handles business logic for CSP settings and dynamic declarativeNetRequest rules
 */
class CSPService {
  constructor(cspRepository) {
    this.repository = cspRepository;
  }

  /**
   * Get CSP settings for a hostname
   * @param {string} hostname - The hostname to get settings for
   * @returns {Promise<CSPSettings>} CSP settings (creates default if not found)
   */
  async getCSPSettings(hostname) {
    let settings = await this.repository.getCSPSettings(hostname);
    if (!settings) {
      settings = CSPSettings.create(hostname, false);
      await this.repository.saveCSPSettings(settings);
    }
    return settings;
  }

  /**
   * Enable CSP rule busting for a hostname
   * @param {string} hostname - The hostname to enable CSP busting for
   * @returns {Promise<CSPSettings>} Updated CSP settings
   */
  async enableCSPBusting(hostname) {
    const settings = await this.getCSPSettings(hostname);

    if (!settings.isEnabled()) {
      settings.enable();
      await this.repository.saveCSPSettings(settings);
      await this._addCSPRule(hostname);
    }

    return settings;
  }

  /**
   * Disable CSP rule busting for a hostname
   * @param {string} hostname - The hostname to disable CSP busting for
   * @returns {Promise<CSPSettings>} Updated CSP settings
   */
  async disableCSPBusting(hostname) {
    const settings = await this.getCSPSettings(hostname);

    if (settings.isEnabled()) {
      settings.disable();
      await this.repository.saveCSPSettings(settings);
      await this._removeCSPRule(hostname);
    }

    return settings;
  }

  /**
   * Toggle CSP rule busting for a hostname
   * @param {string} hostname - The hostname to toggle CSP busting for
   * @returns {Promise<CSPSettings>} Updated CSP settings
   */
  async toggleCSPBusting(hostname) {
    const settings = await this.getCSPSettings(hostname);

    if (settings.isEnabled()) {
      return await this.disableCSPBusting(hostname);
    } else {
      return await this.enableCSPBusting(hostname);
    }
  }

  /**
   * Check if CSP rule busting is enabled for a hostname
   * @param {string} hostname - The hostname to check
   * @returns {Promise<boolean>} True if CSP busting is enabled
   */
  async isCSPBustingEnabled(hostname) {
    const settings = await this.getCSPSettings(hostname);
    return settings.isEnabled();
  }

  /**
   * Get all hostnames with CSP busting enabled
   * @returns {Promise<string[]>} Array of hostnames with CSP busting enabled
   */
  async getEnabledHostnames() {
    const allSettings = await this.repository.getAllCSPSettings();
    return Object.keys(allSettings).filter((hostname) =>
      allSettings[hostname].isEnabled()
    );
  }

  /**
   * Initialize CSP rules on extension startup
   * Re-adds all CSP rules for enabled hostnames
   * @returns {Promis_removeAllCSPRulese<void>}
   */
  async initializeCSPRules() {
    try {
      const enabledHostnames = await this.getEnabledHostnames();

      // Remove any existing CSP rules first
      await this._removeAllCSPRules();

      // Add rules for all enabled hostnames
      for (const hostname of enabledHostnames) {
        await this._addCSPRule(hostname);
      }

      console.log(
        `Initialized CSP rules for ${enabledHostnames.length} hostnames`
      );
    } catch (error) {
      console.error("Error initializing CSP rules:", error);
    }
  }

  /**
   * Generate a unique rule ID for a hostname
   * @param {string} hostname - The hostname
   * @returns {number} Unique rule ID
   */
  _generateRuleId(hostname) {
    // Simple hash to create a consistent ID for the hostname
    let hash = 0;
    for (let i = 0; i < hostname.length; i++) {
      const char = hostname.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Add a dynamic CSP rule for a hostname
   * @param {string} hostname - The hostname to add CSP rule for
   * @returns {Promise<void>}
   * @private
   */
  async _addCSPRule(hostname) {
    try {
      const ruleId = this._generateRuleId(hostname);

      const rule = {
        id: ruleId,
        priority: 1,
        action: {
          type: "modifyHeaders",
          responseHeaders: [
            {
              header: "content-security-policy",
              operation: "remove",
            },
            {
              header: "content-security-policy-report-only",
              operation: "remove",
            },
            {
              header: "Cache-Control",
              operation: "remove",
            },
          ],
        },
        condition: {
          urlFilter: `||${hostname}`,
          resourceTypes: ["main_frame", "sub_frame"],
        },
      };

      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: [rule],
      });

      console.log(`Added CSP rule for ${hostname} with ID ${ruleId}`);
    } catch (error) {
      console.error(`Error adding CSP rule for ${hostname}:`, error);
      throw error;
    }
  }

  /**
   * Remove a dynamic CSP rule for a hostname
   * @param {string} hostname - The hostname to remove CSP rule for
   * @returns {Promise<void>}
   * @private
   */
  async _removeCSPRule(hostname) {
    try {
      const ruleId = this._generateRuleId(hostname);

      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [ruleId],
      });

      console.log(`Removed CSP rule for ${hostname} with ID ${ruleId}`);
    } catch (error) {
      console.error(`Error removing CSP rule for ${hostname}:`, error);
      throw error;
    }
  }

  /**
   * Remove all CSP rules
   * @returns {Promise<void>}
   * @private
   */
  async _removeAllCSPRules() {
    try {
      // Get all dynamic rules from Chrome
      const existingRules =
        await chrome.declarativeNetRequest.getDynamicRules();

      // Filter for CSP rules (rules that modify CSP headers)
      const cspRuleIds = existingRules
        .filter(
          (rule) =>
            rule.action?.type === "modifyHeaders" &&
            rule.action?.responseHeaders?.some(
              (header) =>
                header.header === "content-security-policy" ||
                header.header === "content-security-policy-report-only"
            )
        )
        .map((rule) => rule.id);

      if (cspRuleIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: cspRuleIds,
        });
        console.log(`Removed ${cspRuleIds.length} existing CSP rules`);
      }
    } catch (error) {
      console.error("Error removing all CSP rules:", error);
      throw error;
    }
  }

  /**
   * Get storage information for CSP settings
   * @returns {Promise<Object>} Storage usage stats
   */
  async getStorageInfo() {
    return await this.repository.getStorageInfo();
  }

  /**
   * Clear all CSP settings and rules
   * @returns {Promise<void>}
   */
  async clearAllCSPSettings() {
    await this._removeAllCSPRules();
    await this.repository.clearAllCSPSettings();
  }
}
