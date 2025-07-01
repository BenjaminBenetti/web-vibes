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
      "Apply the current vibe/hack to the active webpage. This will inject the CSS and JavaScript code into the page.",
      schema,
      true // This tool writes data by applying changes to the webpage
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

      let cssResult = null;
      let jsResult = null;

      // Apply CSS via content script
      if (hackData.cssCode && hackData.cssCode.trim()) {
        try {
          cssResult = await chrome.tabs.sendMessage(activeTab.id, {
            type: MESSAGE_TYPES.APPLY_HACK,
            hack: hackData,
          });
        } catch (messageError) {
          return this.formatError(
            `Failed to apply CSS - the page may not have loaded properly: ${messageError.message}`,
            {
              error: messageError.message,
              tabUrl: activeTab.url,
            }
          );
        }
      }

      // Apply JavaScript via chrome.scripting.executeScript() API
      if (hackData.jsCode && hackData.jsCode.trim()) {
        try {
          // Use chrome.scripting.executeScript() to inject JavaScript into the page
          const injectionResults = await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            world: "MAIN", // run in main world so code can interact with page directly
            func: (codeString, hackId, hackName) => {
              try {
                // Keep simple tracking reference
                window.__webVibesRunningHacks =
                  window.__webVibesRunningHacks || {};

                // If this hack was already injected, attempt to clean it first (best-effort)
                if (
                  window.__webVibesRunningHacks[hackId]?.cleanup instanceof
                  Function
                ) {
                  try {
                    window.__webVibesRunningHacks[hackId].cleanup();
                  } catch (cleanupErr) {
                    console.warn(
                      "Web Vibes: cleanup of previous hack failed",
                      cleanupErr
                    );
                  }
                }

                // Wrap the supplied code into a function so it can optionally return a cleanup handler
                const wrappedFn = new Function(
                  `return (function(){\n${codeString}\n})()`
                );
                const possibleReturn = wrappedFn();

                // If the injected code returns a function, treat it as a cleanup handler and save it
                if (typeof possibleReturn === "function") {
                  window.__webVibesRunningHacks[hackId] = {
                    cleanup: possibleReturn,
                  };
                }

                console.log(
                  `Web Vibes: Executed JavaScript for hack "${hackName}"`
                );
                return { success: true };
              } catch (err) {
                console.error(
                  `Web Vibes: error executing hack "${hackName}":`,
                  err
                );
                return { success: false, error: err.message };
              }
            },
            args: [hackData.jsCode, hackData.id, hackData.name],
          });

          jsResult = injectionResults[0]?.result || { success: true };
        } catch (scriptingError) {
          console.error(
            "Error injecting JavaScript via executeScript:",
            scriptingError
          );
          jsResult = {
            success: false,
            error: scriptingError.message,
          };
        }
      }

      // Determine overall success
      const cssSuccess =
        !hackData.cssCode ||
        !hackData.cssCode.trim() ||
        (cssResult && cssResult.success);
      const jsSuccess =
        !hackData.jsCode ||
        !hackData.jsCode.trim() ||
        (jsResult && jsResult.success);
      const overallSuccess = cssSuccess && jsSuccess;

      if (overallSuccess) {
        return this.formatSuccess(
          {
            message: "Hack applied to the webpage",
            appliedTo: activeTab.url,
            hackName: this.currentHack.name,
            cssSuccess: cssSuccess,
            jsSuccess: jsSuccess,
          },
          {
            hackId: this.currentHack.id,
            tabId: activeTab.id,
            url: activeTab.url,
          }
        );
      } else {
        const errors = [];
        if (!cssSuccess)
          errors.push(`CSS: ${cssResult?.error || "Unknown error"}`);
        if (!jsSuccess)
          errors.push(`JavaScript: ${jsResult?.error || "Unknown error"}`);

        return this.formatError(`Failed to apply hack: ${errors.join(", ")}`, {
          cssResult,
          jsResult,
          tabUrl: activeTab.url,
        });
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
