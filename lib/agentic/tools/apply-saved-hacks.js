/**
 * Tool for applying all saved hacks for the current site automatically
 * This tool will apply all enabled hacks that have been previously saved for the current website
 */
class ApplySavedHacksTool extends AgenticTool {
  /**
   * Create a new ApplySavedHacks tool
   * @param {HackService} hackService - Hack service for managing hacks
   */
  constructor(hackService) {
    const schema = {
      type: "object",
      properties: {
        force: {
          type: "boolean",
          description: "Force application even if hacks are already applied",
          default: false,
        },
      },
      required: [],
    };

    super(
      "apply_saved_hacks",
      "Apply all saved hacks for the current website. This will automatically apply any CSS and JavaScript hacks that have been previously saved and enabled for this site.",
      schema,
      true // This tool writes data by applying changes to the webpage
    );

    this.hackService = hackService;
  }

  /**
   * Execute the tool to apply saved hacks to the current page
   * @param {Object} parameters - Tool parameters
   * @param {boolean} [parameters.force=false] - Force application even if already applied
   * @returns {Promise<Object>} Tool execution result
   */
  async run(parameters) {
    try {
      if (!this.validateParameters(parameters)) {
        return this.formatError("Invalid parameters provided", { parameters });
      }

      const { force = false } = parameters;

      // Get summary of hacks for current site
      const summary = await this.hackService.getHacksSummaryForCurrentSite();

      if (summary.total === 0) {
        return this.formatSuccess(
          {
            message: `No saved hacks found for ${summary.hostname}`,
            hostname: summary.hostname,
            total: 0,
            enabled: 0,
          },
          {
            hostname: summary.hostname,
            action: "no_hacks_found"
          }
        );
      }

      if (summary.enabled === 0) {
        return this.formatSuccess(
          {
            message: `Found ${summary.total} saved hacks for ${summary.hostname}, but none are enabled`,
            hostname: summary.hostname,
            total: summary.total,
            enabled: 0,
            disabled: summary.disabled,
            hacks: summary.hacks,
          },
          {
            hostname: summary.hostname,
            action: "no_enabled_hacks"
          }
        );
      }

      // Apply the hacks
      const result = await this.hackService.applyHacksForCurrentSite();

      if (result.success) {
        return this.formatSuccess(
          {
            message: result.message,
            hostname: summary.hostname,
            applied: result.applied,
            total: result.total,
            hacks: summary.hacks.filter(h => h.enabled),
            results: result.results || [],
          },
          {
            hostname: summary.hostname,
            applied: result.applied,
            total: result.total,
            action: "hacks_applied"
          }
        );
      } else {
        return this.formatError(
          `Failed to apply saved hacks: ${result.error}`,
          {
            hostname: summary.hostname,
            error: result.error,
            applied: result.applied,
            total: result.total
          }
        );
      }
    } catch (error) {
      return this.formatError(`Failed to apply saved hacks: ${error.message}`, {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Get user-friendly action message for applying saved hacks
   * @returns {string} Action message
   */
  getActionMessage() {
    return "Applying saved vibes to webpage";
  }

  /**
   * Get user-friendly completion message for applying saved hacks
   * @returns {string} Completion message
   */
  getCompletionMessage() {
    return "Saved vibes applied to webpage - your customizations are now active!";
  }

  /**
   * Get user-friendly error message for applying saved hacks failures
   * @param {string} error - The actual error
   * @returns {string} Error message
   */
  getErrorMessage(error) {
    return `Failed to apply saved vibes to webpage: ${error}`;
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = ApplySavedHacksTool;
} else {
  window.ApplySavedHacksTool = ApplySavedHacksTool;
} 