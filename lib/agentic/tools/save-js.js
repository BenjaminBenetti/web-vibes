/**
 * Tool for saving Java    super(
      "save_vibe_js",
      "Save JavaScript code to the current vibe/hack under edit. Can either replace existing vibe JavaScript code or append to it.",
      schema
    );t code to the current vibe under edit
 * Allows the AI to add or update JavaScript code in a hack
 */
class SaveJSTool extends AgenticTool {
  /**
   * Create a new SaveJS tool
   * @param {HackService} hackService - Hack service for managing hacks
   */
  constructor(hackService) {
    const schema = {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "The JavaScript code to save",
        },
        append: {
          type: "boolean",
          description:
            "Whether to append to existing code (true) or replace it (false)",
          default: false,
        },
      },
      required: ["code"],
    };

    super(
      "save_js",
      "Save JavaScript code to the current vibe under edit. Can either replace existing JS code or append to it. You should call apply_hack after this to apply the changes.",
      schema,
      true // This tool writes data
    );

    this.hackService = hackService;
    this.currentHack = null;
  }

  /**
   * Set the current hack being edited
   * @param {Hack} hack - The hack instance to edit
   */
  setCurrentHack(hack) {
    this.currentHack = hack;
  }

  /**
   * Execute the tool to save JavaScript code
   * @param {Object} parameters - Tool parameters
   * @param {string} parameters.code - JavaScript code to save
   * @param {boolean} [parameters.append=false] - Whether to append to existing code
   * @returns {Promise<Object>} Tool execution result
   */
  async run(parameters) {
    try {
      if (!this.validateParameters(parameters)) {
        return this.formatError("Invalid parameters provided", { parameters });
      }

      if (!this.currentHack) {
        return this.formatError(
          "No hack is currently being edited. Please select a hack first."
        );
      }

      const { code, append = false } = parameters;

      // Validate the JavaScript code syntax
      try {
        new Function(code);
      } catch (syntaxError) {
        return this.formatError(
          `Invalid JavaScript syntax: ${syntaxError.message}`,
          {
            syntaxError: syntaxError.message,
          }
        );
      }

      // Update the hack's JavaScript code
      if (append && this.currentHack.jsCode) {
        this.currentHack.jsCode += "\n\n" + code;
      } else {
        this.currentHack.jsCode = code;
      }

      // Save the updated hack
      const hostname = await this.hackService.getCurrentHostname();
      await this.hackService.updateHack(hostname, this.currentHack.id, {
        jsCode: this.currentHack.jsCode,
      });

      return this.formatSuccess(
        {
          message: append
            ? "JavaScript code appended successfully"
            : "JavaScript code saved successfully",
          codeLength: code.length,
          totalCodeLength: this.currentHack.jsCode.length,
        },
        {
          hackId: this.currentHack.id,
          operation: append ? "append" : "replace",
        }
      );
    } catch (error) {
      return this.formatError(
        `Failed to save JavaScript code: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
        }
      );
    }
  }

  /**
   * Get user-friendly action message for vibe JS saving
   * @returns {string} Action message
   */
  getActionMessage() {
    return "Updating vibe JavaScript code";
  }

  /**
   * Get user-friendly completion message for vibe JS saving
   * @returns {string} Completion message
   */
  getCompletionMessage() {
    return "Vibe JavaScript code updated";
  }

  /**
   * Get user-friendly error message for vibe JS saving failures
   * @param {string} error - The actual error
   * @returns {string} Error message
   */
  getErrorMessage(error) {
    return `Failed to update vibe JavaScript: ${error}`;
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = SaveJSTool;
} else {
  window.SaveJSTool = SaveJSTool;
}
