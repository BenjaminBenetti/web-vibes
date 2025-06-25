/**
 * Data model for AI prompts
 * Represents a prompt request with metadata
 */
class AIPrompt {
  /**
   * Create an AI prompt
   * @param {string} content - The prompt text content
   * @param {Object} options - Optional configuration
   * @param {string} options.role - The role of the message (user, system, assistant)
   * @param {number} options.maxTokens - Maximum tokens for the response
   * @param {number} options.temperature - Creativity/randomness (0.0 to 1.0)
   * @param {string} options.model - Specific model to use
   * @param {Date} options.createdAt - When the prompt was created
   */
  constructor(
    content,
    {
      role = "user",
      maxTokens = 100000,
      temperature = 0.7,
      model = null,
      createdAt = new Date(),
    } = {}
  ) {
    if (!content || typeof content !== "string" || content.trim() === "") {
      throw new Error(
        "Prompt content is required and must be a non-empty string"
      );
    }

    this.content = content.trim();
    this.role = role;
    this.maxTokens = maxTokens;
    this.temperature = temperature;
    this.model = model;
    this.createdAt = createdAt;
  }

  /**
   * Convert the prompt to a plain object for API requests
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      content: this.content,
      role: this.role,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      model: this.model,
      createdAt: this.createdAt.toISOString(),
    };
  }

  /**
   * Create an AIPrompt instance from stored data
   * @param {Object} data - The prompt data
   * @returns {AIPrompt} New AIPrompt instance
   */
  static fromJSON(data) {
    return new AIPrompt(data.content, {
      role: data.role,
      maxTokens: data.maxTokens,
      temperature: data.temperature,
      model: data.model,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    });
  }

  /**
   * Validate prompt data before creating instance
   * @param {Object} data - The prompt data to validate
   * @returns {boolean} True if valid
   */
  static isValid(data) {
    return (
      data &&
      typeof data.content === "string" &&
      data.content.trim().length > 0 &&
      (data.role === undefined || typeof data.role === "string") &&
      (data.maxTokens === undefined || typeof data.maxTokens === "number") &&
      (data.temperature === undefined ||
        typeof data.temperature === "number") &&
      (data.model === undefined || typeof data.model === "string")
    );
  }

  /**
   * Get valid role options
   * @returns {Array<string>} Available role types
   */
  static getValidRoles() {
    return ["user", "system", "assistant"];
  }

  /**
   * Check if a role is valid
   * @param {string} role - Role to validate
   * @returns {boolean} True if role is valid
   */
  static isValidRole(role) {
    return AIPrompt.getValidRoles().includes(role);
  }

  /**
   * Create a system prompt (for context/instructions)
   * @param {string} content - The system prompt content
   * @param {Object} options - Optional configuration
   * @returns {AIPrompt} New system prompt instance
   */
  static createSystemPrompt(content, options = {}) {
    return new AIPrompt(content, { ...options, role: "system" });
  }

  /**
   * Create a user prompt (standard user input)
   * @param {string} content - The user prompt content
   * @param {Object} options - Optional configuration
   * @returns {AIPrompt} New user prompt instance
   */
  static createUserPrompt(content, options = {}) {
    return new AIPrompt(content, { ...options, role: "user" });
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = AIPrompt;
} else {
  window.AIPrompt = AIPrompt;
}
