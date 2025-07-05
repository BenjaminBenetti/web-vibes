/**
 * Model for CSP (Content Security Policy) settings per site
 * Represents whether CSP rule busting is enabled for a specific domain
 */
class CSPSettings {
  constructor(data = {}) {
    this.hostname = data.hostname || '';
    this.enabled = data.enabled || false;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Create a new CSPSettings instance for a hostname
   * @param {string} hostname - The hostname to create settings for
   * @param {boolean} enabled - Whether CSP busting is enabled
   * @returns {CSPSettings} New CSPSettings instance
   */
  static create(hostname, enabled = false) {
    return new CSPSettings({
      hostname,
      enabled,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Create CSPSettings from stored data
   * @param {Object} data - Raw data from storage
   * @returns {CSPSettings} CSPSettings instance
   */
  static fromStorage(data) {
    return new CSPSettings({
      hostname: data.hostname,
      enabled: data.enabled,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    });
  }

  /**
   * Convert to plain object for storage
   * @returns {Object} Plain object representation
   */
  toStorage() {
    return {
      hostname: this.hostname,
      enabled: this.enabled,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  /**
   * Enable CSP rule busting for this hostname
   */
  enable() {
    this.enabled = true;
    this.updatedAt = new Date();
  }

  /**
   * Disable CSP rule busting for this hostname
   */
  disable() {
    this.enabled = false;
    this.updatedAt = new Date();
  }

  /**
   * Toggle CSP rule busting state
   * @returns {boolean} New enabled state
   */
  toggle() {
    this.enabled = !this.enabled;
    this.updatedAt = new Date();
    return this.enabled;
  }

  /**
   * Check if CSP rule busting is enabled
   * @returns {boolean} True if enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Get the hostname
   * @returns {string} The hostname
   */
  getHostname() {
    return this.hostname;
  }

  /**
   * Validate the CSP settings
   * @returns {boolean} True if valid
   */
  isValid() {
    return typeof this.hostname === 'string' && 
           this.hostname.length > 0 &&
           typeof this.enabled === 'boolean';
  }

  /**
   * Clone this CSP settings instance
   * @returns {CSPSettings} Cloned instance
   */
  clone() {
    return new CSPSettings({
      hostname: this.hostname,
      enabled: this.enabled,
      createdAt: new Date(this.createdAt),
      updatedAt: new Date(this.updatedAt)
    });
  }
}
