/**
 * Tool for saving CSS code to the current vibe under edit
 * Allows the AI to add or update CSS code in a hack
 */
class SaveCSSTool extends AgenticTool {
  /**
   * Create a new SaveCSS tool
   * @param {HackService} hackService - Hack service for managing hacks
   */
  constructor(hackService) {
    const schema = {
      type: "object",
      properties: {
        code: {
          type: "string",
          description: "The CSS code to save",
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
      "save_css",
      "Save CSS code to the current vibe under edit. Can either replace existing CSS code or append to it.",
      schema
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
   * Execute the tool to save CSS code
   * @param {Object} parameters - Tool parameters
   * @param {string} parameters.code - CSS code to save
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

      // Basic CSS validation
      const validationResult = this.validateCSS(code);
      if (!validationResult.isValid) {
        return this.formatError(
          `Invalid CSS syntax: ${validationResult.error}`,
          {
            syntaxError: validationResult.error,
          }
        );
      }

      // Update the hack's CSS code
      if (append && this.currentHack.cssCode) {
        this.currentHack.cssCode += "\n\n" + code;
      } else {
        this.currentHack.cssCode = code;
      }

      // Save the updated hack
      const hostname = await this.hackService.getCurrentHostname();
      await this.hackService.updateHack(hostname, this.currentHack.id, {
        cssCode: this.currentHack.cssCode,
      });

      return this.formatSuccess(
        {
          message: append
            ? "CSS code appended successfully"
            : "CSS code saved successfully",
          codeLength: code.length,
          totalCodeLength: this.currentHack.cssCode.length,
          rulesAdded: this.countCSSRules(code),
        },
        {
          hackId: this.currentHack.id,
          operation: append ? "append" : "replace",
        }
      );
    } catch (error) {
      return this.formatError(`Failed to save CSS code: ${error.message}`, {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Validate CSS syntax (basic validation)
   * @param {string} css - CSS code to validate
   * @returns {Object} Validation result with isValid flag and error message
   */
  validateCSS(css) {
    try {
      // Basic CSS syntax checks
      const trimmed = css.trim();

      if (trimmed.length === 0) {
        return { isValid: true }; // Empty CSS is valid
      }

      // Check for balanced braces
      const openBraces = (css.match(/\{/g) || []).length;
      const closeBraces = (css.match(/\}/g) || []).length;

      if (openBraces !== closeBraces) {
        return {
          isValid: false,
          error: `Mismatched braces: ${openBraces} opening, ${closeBraces} closing`,
        };
      }

      // Check for basic CSS structure (selector { property: value; })
      const hasValidStructure =
        /[^{}]+\{[^{}]*\}/.test(css) ||
        /^@[^{}]+;/.test(css.trim()) || // At-rules like @import
        css.trim().length === 0;

      if (!hasValidStructure) {
        return {
          isValid: false,
          error: "CSS does not contain valid rule structure",
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  /**
   * Count the number of CSS rules in the code
   * @param {string} css - CSS code to analyze
   * @returns {number} Number of CSS rules
   */
  countCSSRules(css) {
    // Count opening braces as a rough estimate of rules
    const matches = css.match(/\{/g);
    return matches ? matches.length : 0;
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = SaveCSSTool;
} else {
  window.SaveCSSTool = SaveCSSTool;
}
