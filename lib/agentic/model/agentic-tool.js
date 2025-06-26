/**
 * Abstract base class for agentic tools
 * Defines the interface that all tools must implement
 */
class AgenticTool {
  /**
   * Create a new agentic tool
   * @param {string} name - Tool name (used by AI to identify the tool)
   * @param {string} description - Description of what the tool does
   * @param {Object} schema - JSON schema defining the tool's parameters
   */
  constructor(name, description, schema) {
    if (new.target === AgenticTool) {
      throw new Error("Cannot instantiate abstract class AgenticTool");
    }

    this.name = name;
    this.description = description;
    this.schema = schema;
  }

  /**
   * Execute the tool with given parameters
   * Must be implemented by subclasses
   * @param {Object} parameters - Tool parameters
   * @returns {Promise<Object>} Tool execution result
   */
  async run(parameters) {
    throw new Error("run() method must be implemented by subclass");
  }

  /**
   * Validate parameters against the tool's schema
   * @param {Object} parameters - Parameters to validate
   * @returns {boolean} True if parameters are valid
   */
  validateParameters(parameters) {
    if (!this.schema || !this.schema.properties) {
      return true; // No schema means no validation required
    }

    // Check required parameters
    if (this.schema.required) {
      for (const required of this.schema.required) {
        if (!(required in parameters)) {
          return false;
        }
      }
    }

    // Basic type checking for each parameter
    for (const [paramName, paramValue] of Object.entries(parameters)) {
      const paramSchema = this.schema.properties[paramName];
      if (paramSchema && !this.validateType(paramValue, paramSchema.type)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validate a value against a JSON schema type
   * @param {*} value - Value to validate
   * @param {string} type - Expected type
   * @returns {boolean} True if value matches type
   */
  validateType(value, type) {
    switch (type) {
      case "string":
        return typeof value === "string";
      case "number":
        return typeof value === "number" && !isNaN(value);
      case "boolean":
        return typeof value === "boolean";
      case "object":
        return typeof value === "object" && value !== null;
      case "array":
        return Array.isArray(value);
      default:
        return true; // Unknown type, assume valid
    }
  }

  /**
   * Get tool metadata for AI to understand how to use it
   * @returns {Object} Tool metadata including name, description, and schema
   */
  getMetadata() {
    return {
      name: this.name,
      description: this.description,
      schema: this.schema,
    };
  }

  /**
   * Format error message for tool execution failures
   * @param {string} message - Error message
   * @param {Object} context - Additional error context
   * @returns {Object} Formatted error result
   */
  formatError(message, context = {}) {
    return {
      success: false,
      error: message,
      tool: this.name,
      timestamp: new Date().toISOString(),
      ...context,
    };
  }

  /**
   * Format success result for tool execution
   * @param {*} data - Result data
   * @param {Object} context - Additional context
   * @returns {Object} Formatted success result
   */
  formatSuccess(data, context = {}) {
    return {
      success: true,
      data,
      tool: this.name,
      timestamp: new Date().toISOString(),
      ...context,
    };
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = AgenticTool;
} else {
  window.AgenticTool = AgenticTool;
}
