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
    applyDelay = 0,
    createdAt = new Date(),
    rank = 0
  ) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.cssCode = cssCode;
    this.jsCode = jsCode;
    this.enabled = enabled;
    this.applyDelay = applyDelay;
    this.createdAt = createdAt;
    this.rank = rank;
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
      applyDelay: this.applyDelay,
      createdAt: this.createdAt.toISOString(),
      rank: this.rank,
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
      data.applyDelay || 0,
      new Date(data.createdAt),
      data.rank || 0
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
