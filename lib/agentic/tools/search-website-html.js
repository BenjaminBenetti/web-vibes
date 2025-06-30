/**
 * Tool for searching HTML content on the current webpage using CSS selectors
 * Allows the AI to analyze and understand page structure and content
 */
class SearchWebsiteHTMLTool extends AgenticTool {
  /**
   * Create a new SearchWebsiteHTML tool
   */
  constructor() {
    super(
      "search_website_html",
      "Search for HTML content on the current webpage using CSS selectors",
      {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description:
              "CSS selector to search for elements (e.g., 'h1', '.class', '#id', 'div.content p')",
          },
          maxResults: {
            type: "number",
            description: "Maximum number of results to return (default: 10)",
          },
          maxLength: {
            type: "number",
            description:
              "Maximum length of HTML content per element (default: 5000)",
          },
        },
        required: ["selector"],
      },
      false // This tool only reads data from the webpage
    );
  }

  /**
   * Execute the search website HTML tool
   * @param {Object} params - Tool parameters
   * @returns {Object} Search results
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

      // Send message to content script to search HTML
      try {
        const response = await chrome.tabs.sendMessage(activeTab.id, {
          type: MESSAGE_TYPES.SEARCH_WEBSITE_HTML,
          selector: params.selector,
          maxResults: params.maxResults || 10,
          maxLength: params.maxLength || 5000,
        });

        if (response && response.success) {
          return this.formatSuccess(
            {
              message: `Found ${response.totalFound} elements matching "${response.selector}"`,
              selector: response.selector,
              totalFound: response.totalFound,
              returned: response.returned,
              matches: response.matches,
              pageInfo: response.pageInfo,
            }
          );
        } else {
          return this.formatError(
            response?.error || "Failed to search HTML content"
          );
        }
      } catch (error) {
        console.error("Error communicating with content script:", error);
        return this.formatError(
          "Could not communicate with webpage. Make sure you're on a valid webpage and try refreshing."
        );
      }
    } catch (error) {
      console.error("Error in SearchWebsiteHTMLTool:", error);
      return this.formatError(error.message);
    }
  }

  /**
   * Get user-friendly action message
   * @returns {string} Action message
   */
  getActionMessage() {
    return `Searching webpage by selector...`;
  }

  /**
   * Get user-friendly completion message
   * @returns {string} Completion message
   */
  getCompletionMessage(result) {
    return "Search completed successfully";
  }

  /**
   * Get user-friendly error message
   * @param {string} error - Error message
   * @returns {string} User-friendly error message
   */
  getErrorMessage(error) {
    if (error.includes("No active tab")) {
      return "Please open a webpage to search";
    } else if (error.includes("Could not communicate")) {
      return "Cannot access webpage content. Try refreshing the page.";
    } else if (error.includes("selector is required")) {
      return "Please provide a CSS selector to search for";
    } else {
      return `Search failed: ${error}`;
    }
  }
}
