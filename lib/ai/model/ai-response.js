/**
 * Data model for AI responses
 * Represents a response from an AI provider with metadata
 */
class AIResponse {
  /**
   * Create an AI response
   * @param {string} content - The response text content
   * @param {Object} metadata - Response metadata
   * @param {string} metadata.model - The model that generated the response
   * @param {number} metadata.tokensUsed - Number of tokens used
   * @param {number} metadata.processingTimeMs - Processing time in milliseconds
   * @param {string} metadata.provider - The AI provider used
   * @param {string} metadata.requestId - Unique request identifier
   * @param {Date} metadata.createdAt - When the response was generated
   * @param {boolean} success - Whether the request was successful
   * @param {string} error - Error message if request failed
   */
  constructor(
    content,
    {
      model = null,
      tokensUsed = 0,
      processingTimeMs = 0,
      provider = null,
      requestId = null,
      createdAt = new Date(),
    } = {},
    success = true,
    error = null
  ) {
    this.content = content || "";
    this.metadata = {
      model,
      tokensUsed,
      processingTimeMs,
      provider,
      requestId,
      createdAt,
    };
    this.success = success;
    this.error = error;
  }

  /**
   * Create a successful response
   * @param {string} content - The response content
   * @param {Object} metadata - Response metadata
   * @returns {AIResponse} New successful response instance
   */
  static createSuccess(content, metadata = {}) {
    return new AIResponse(content, metadata, true, null);
  }

  /**
   * Create an error response
   * @param {string} error - The error message
   * @param {Object} metadata - Response metadata
   * @returns {AIResponse} New error response instance
   */
  static createError(error, metadata = {}) {
    return new AIResponse("", metadata, false, error);
  }

  /**
   * Check if the response was successful
   * @returns {boolean} True if successful
   */
  isSuccess() {
    return this.success && !this.error;
  }

  /**
   * Check if the response has an error
   * @returns {boolean} True if error occurred
   */
  hasError() {
    return !this.success || !!this.error;
  }

  /**
   * Get the error message if any
   * @returns {string|null} Error message or null if no error
   */
  getError() {
    return this.error;
  }

  /**
   * Get the response content if successful
   * @returns {string} Response content or empty string if error
   */
  getContent() {
    return this.isSuccess() ? this.content : "";
  }

  /**
   * Get processing time in milliseconds
   * @returns {number} Processing time
   */
  getProcessingTime() {
    return this.metadata.processingTimeMs || 0;
  }

  /**
   * Get tokens used for this response
   * @returns {number} Number of tokens used
   */
  getTokensUsed() {
    return this.metadata.tokensUsed || 0;
  }

  /**
   * Get the model that generated this response
   * @returns {string|null} Model name or null if not specified
   */
  getModel() {
    return this.metadata.model;
  }

  /**
   * Get the provider that generated this response
   * @returns {string|null} Provider name or null if not specified
   */
  getProvider() {
    return this.metadata.provider;
  }

  /**
   * Convert the response to a plain object for storage
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      content: this.content,
      metadata: {
        ...this.metadata,
        createdAt: this.metadata.createdAt
          ? this.metadata.createdAt.toISOString()
          : null,
      },
      success: this.success,
      error: this.error,
    };
  }

  /**
   * Create an AIResponse instance from stored data
   * @param {Object} data - The response data
   * @returns {AIResponse} New AIResponse instance
   */
  static fromJSON(data) {
    const metadata = {
      ...data.metadata,
      createdAt: data.metadata?.createdAt
        ? new Date(data.metadata.createdAt)
        : new Date(),
    };

    return new AIResponse(data.content, metadata, data.success, data.error);
  }

  /**
   * Validate response data before creating instance
   * @param {Object} data - The response data to validate
   * @returns {boolean} True if valid
   */
  static isValid(data) {
    return (
      data &&
      (data.content === undefined || typeof data.content === "string") &&
      (data.metadata === undefined || typeof data.metadata === "object") &&
      (data.success === undefined || typeof data.success === "boolean") &&
      (data.error === undefined ||
        typeof data.error === "string" ||
        data.error === null)
    );
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = AIResponse;
} else {
  window.AIResponse = AIResponse;
}
