/**
 * Tool for inspecting CSS styles applied to HTML elements on the current webpage
 * Allows the AI to analyze styling and understand visual presentation
 */
class InspectHTMLCSSTool extends AgenticTool {
  /**
   * Create a new InspectHTMLCSS tool
   */
  constructor() {
    super(
      "inspect_html_css",
      "Inspect CSS styles applied to HTML elements on the current webpage using CSS selectors",
      {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description:
              "CSS selector to find elements to inspect (e.g., 'h1', '.class', '#id', 'div.content p')",
          },
          maxResults: {
            type: "number",
            description: "Maximum number of elements to inspect (default: 5)",
          },
          includeComputed: {
            type: "boolean",
            description: "Include computed styles in addition to applied styles (default: true)",
          },
          includePseudo: {
            type: "boolean",
            description: "Include pseudo-element styles (default: false)",
          },
        },
        required: ["selector"],
      },
      false // This tool only reads data from the webpage
    );
  }

  /**
   * Execute the inspect HTML CSS tool
   * @param {Object} params - Tool parameters
   * @returns {Object} Inspection results
   */
  async run(params) {
    try {
      // Validate required parameters
      if (!params.selector) {
        return this.formatError("CSS selector is required");
      }

      // Get the active tab
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tabs || tabs.length === 0) {
        return this.formatError("No active tab found");
      }

      const activeTab = tabs[0];
      if (!activeTab.id) {
        return this.formatError("Could not get active tab ID");
      }

      // Send message to content script to inspect CSS
      try {
        const response = await chrome.tabs.sendMessage(activeTab.id, {
          type: MESSAGE_TYPES.INSPECT_HTML_CSS,
          selector: params.selector,
          maxResults: params.maxResults || 5,
          includeComputed: params.includeComputed !== false, // Default to true
          includePseudo: params.includePseudo || false,
        });

        if (response && response.success) {
          return this.formatSuccess(
            {
              selector: response.selector,
              totalFound: response.totalFound,
              returned: response.returned,
              elements: response.elements,
              pageInfo: response.pageInfo,
            },
            `Inspected CSS for ${response.returned} elements matching "${response.selector}"`
          );
        } else {
          return this.formatError(
            response?.error || "Failed to inspect CSS styles"
          );
        }
      } catch (error) {
        console.error("Error communicating with content script:", error);
        return this.formatError(
          "Could not communicate with webpage. Make sure you're on a valid webpage and try refreshing."
        );
      }
    } catch (error) {
      console.error("Error in InspectHTMLCSSTool:", error);
      return this.formatError(error.message);
    }
  }

  /**
   * Get user-friendly action message
   * @returns {string} Action message
   */
  getActionMessage(params) {
    return `Inspecting CSS styles...`;
  }

  /**
   * Get user-friendly completion message
   * @returns {string} Completion message
   */
  getCompletionMessage(result) {
    return "CSS inspection completed successfully";
  }

  /**
   * Get user-friendly error message
   * @param {string} error - Error message
   * @returns {string} User-friendly error message
   */
  getErrorMessage(error) {
    if (error.includes("No active tab")) {
      return "Please open a webpage to inspect CSS";
    } else if (error.includes("Could not communicate")) {
      return "Cannot access webpage content. Try refreshing the page.";
    } else if (error.includes("selector is required")) {
      return "Please provide a CSS selector to inspect";
    } else {
      return `CSS inspection failed: ${error}`;
    }
  }
} 