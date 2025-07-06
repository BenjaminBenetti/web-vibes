/**
 * Model for CSP (Content Security Policy) settings per site
 * Represents whether CSP rule busting is enabled for a specific domain
 */
class CSPSettings {
  constructor(data = {}) {
    this.hostname = data.hostname || "";
    this.enabled = data.enabled || false;
    this.serviceWorkerBlockingEnabled =
      data.serviceWorkerBlockingEnabled || false;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Create a new CSPSettings instance for a hostname
   * @param {string} hostname - The hostname to create settings for
   * @param {boolean} enabled - Whether CSP busting is enabled
   * @param {boolean} serviceWorkerBlockingEnabled - Whether service worker blocking is enabled
   * @returns {CSPSettings} New CSPSettings instance
   */
  static create(
    hostname,
    enabled = false,
    serviceWorkerBlockingEnabled = false
  ) {
    return new CSPSettings({
      hostname,
      enabled,
      serviceWorkerBlockingEnabled,
      createdAt: new Date(),
      updatedAt: new Date(),
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
      serviceWorkerBlockingEnabled: data.serviceWorkerBlockingEnabled,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
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
      serviceWorkerBlockingEnabled: this.serviceWorkerBlockingEnabled,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
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
   * Enable service worker blocking for this hostname
   */
  enableServiceWorkerBlocking() {
    this.serviceWorkerBlockingEnabled = true;
    this.updatedAt = new Date();
  }

  /**
   * Disable service worker blocking for this hostname
   */
  disableServiceWorkerBlocking() {
    this.serviceWorkerBlockingEnabled = false;
    this.updatedAt = new Date();
  }

  /**
   * Toggle service worker blocking state
   * @returns {boolean} New service worker blocking enabled state
   */
  toggleServiceWorkerBlocking() {
    this.serviceWorkerBlockingEnabled = !this.serviceWorkerBlockingEnabled;
    this.updatedAt = new Date();
    return this.serviceWorkerBlockingEnabled;
  }

  /**
   * Check if service worker blocking is enabled
   * @returns {boolean} True if enabled
   */
  isServiceWorkerBlockingEnabled() {
    return this.serviceWorkerBlockingEnabled;
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
    return (
      typeof this.hostname === "string" &&
      this.hostname.length > 0 &&
      typeof this.enabled === "boolean"
    );
  }

  /**
   * Clone this CSP settings instance
   * @returns {CSPSettings} Cloned instance
   */
  clone() {
    return new CSPSettings({
      hostname: this.hostname,
      enabled: this.enabled,
      serviceWorkerBlockingEnabled: this.serviceWorkerBlockingEnabled,
      createdAt: new Date(this.createdAt),
      updatedAt: new Date(this.updatedAt),
    });
  }
}
