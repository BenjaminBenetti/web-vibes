/**
 * Data model for a single hack
 * Represents a user-created modification (CSS/JS) for a specific website
 */
class Hack {
  constructor(
    id,
    name,
    description,
    cssCode,
    jsCode,
    enabled = true,
    createdAt = new Date()
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.cssCode = cssCode;
    this.jsCode = jsCode;
    this.enabled = enabled;
    this.createdAt = createdAt;
  }

  /**
   * Toggle the enabled state of the hack
   */
  toggle() {
    this.enabled = !this.enabled;
  }

  /**
   * Convert the hack to a plain object for storage
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      cssCode: this.cssCode,
      jsCode: this.jsCode,
      enabled: this.enabled,
      createdAt: this.createdAt.toISOString(),
    };
  }

  /**
   * Create a Hack instance from stored data
   * @param {Object} data - The stored hack data
   * @returns {Hack} New Hack instance
   */
  static fromJSON(data) {
    return new Hack(
      data.id,
      data.name,
      data.description,
      data.cssCode,
      data.jsCode,
      data.enabled,
      new Date(data.createdAt)
    );
  }

  /**
   * Validate hack data before creating instance
   * @param {Object} data - The hack data to validate
   * @returns {boolean} True if valid
   */
  static isValid(data) {
    return (
      data &&
      typeof data.id === "string" &&
      typeof data.name === "string" &&
      data.name.trim().length > 0
    );
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = Hack;
} else {
  window.Hack = Hack;
}
