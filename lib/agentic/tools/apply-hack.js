/**
 * Tool for applying the current hack/vibe to the active webpage
 * Sends the hack's CSS and JavaScript code to the content script for execution
 */
class ApplyHackTool extends AgenticTool {
  /**
   * Create a new ApplyHack tool
   * @param {HackService} hackService - Hack service for managing hacks
   */
  constructor(hackService) {
    const schema = {
      type: "object",
      properties: {
        preview: {
          type: "boolean",
          description:
            "Whether to apply as a preview (can be easily removed) or permanent",
          default: true,
        },
      },
      required: [],
    };

    super(
      "apply_hack",
      "Apply your edits to the active webpage. This will send the current hack's CSS and JavaScript code to the content script for execution. So the user can preview your changes.",
      schema
    );

    this.hackService = hackService;
    this.currentHack = null;
  }

  /**
   * Set the current hack being edited
   * @param {Hack} hack - The hack instance to apply
   */
  setCurrentHack(hack) {
    this.currentHack = hack;
  }

  /**
   * Execute the tool to apply the hack to the current page
   * @param {Object} parameters - Tool parameters
   * @param {boolean} [parameters.preview=true] - Whether to apply as preview
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

      const { preview = true } = parameters;

      // Get the current active tab
      const [activeTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!activeTab) {
        return this.formatError("No active tab found to apply the hack to.");
      }

      // Prepare the hack data to send to content script
      const hackData = {
        id: this.currentHack.id,
        name: this.currentHack.name,
        description: this.currentHack.description,
        cssCode: this.currentHack.cssCode || "",
        jsCode: this.currentHack.jsCode || "",
        preview: preview,
        timestamp: new Date().toISOString(),
      };

      // Send message to content script to apply the hack
      try {
        const response = await chrome.tabs.sendMessage(activeTab.id, {
          type: MESSAGE_TYPES.APPLY_HACK,
          hack: hackData,
        });

        if (response && response.success) {
          return this.formatSuccess(
            {
              message: preview
                ? "Hack applied as preview - you can see the changes on the webpage!"
                : "Hack applied permanently to the webpage",
              appliedTo: activeTab.url,
              hackName: this.currentHack.name,
              hasCSS: !!(
                this.currentHack.cssCode && this.currentHack.cssCode.trim()
              ),
              hasJS: !!(
                this.currentHack.jsCode && this.currentHack.jsCode.trim()
              ),
              preview: preview,
            },
            {
              hackId: this.currentHack.id,
              tabId: activeTab.id,
              url: activeTab.url,
            }
          );
        } else {
          return this.formatError(
            `Content script responded with error: ${
              response?.error || "Unknown error"
            }`,
            { response }
          );
        }
      } catch (messageError) {
        return this.formatError(
          `Failed to communicate with webpage - the page may not have loaded properly or may not support vibes: ${messageError.message}`,
          {
            error: messageError.message,
            tabUrl: activeTab.url,
          }
        );
      }
    } catch (error) {
      return this.formatError(`Failed to apply hack: ${error.message}`, {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Get user-friendly action message for hack application
   * @returns {string} Action message
   */
  getActionMessage() {
    return "Applying vibe to webpage";
  }

  /**
   * Get user-friendly completion message for hack application
   * @returns {string} Completion message
   */
  getCompletionMessage() {
    return "Vibe applied to webpage - check the page to see your changes!";
  }

  /**
   * Get user-friendly error message for hack application failures
   * @param {string} error - The actual error
   * @returns {string} Error message
   */
  getErrorMessage(error) {
    return `Failed to apply vibe to webpage: ${error}`;
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = ApplyHackTool;
} else {
  window.ApplyHackTool = ApplyHackTool;
}
