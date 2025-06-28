/**
 * Tool for searching JavaScript content on the current webpage using regex patterns
 * Allows the AI to analyze and understand JavaScript code and functionality
 */
class SearchWebsiteJavaScriptTool extends AgenticTool {
  /**
   * Create a new SearchWebsiteJavaScript tool
   */
  constructor() {
    super(
      "search_website_javascript",
      "Search for JavaScript content on the current webpage using regex patterns",
      {
        type: "object",
        properties: {
          regex: {
            type: "string",
            description:
              "Regular expression pattern to search for in JavaScript content (e.g., 'function\\s+\\w+', 'const\\s+\\w+', 'console\\.log')",
          },
          maxMatches: {
            type: "number",
            description: "Maximum number of matches to return (default: 10)",
          },
          contextLines: {
            type: "number",
            description: "Number of lines around each match to include for context (default: 100)",
          },
        },
        required: ["regex"],
      },
      false // This tool only reads data from the webpage
    );
  }

  /**
   * Execute the search website JavaScript tool
   * @param {Object} params - Tool parameters
   * @returns {Object} Search results
   */
  async run(params) {
    try {
      // Validate required parameters
      if (!params.regex) {
        return this.formatError("Regular expression pattern is required");
      }

      // Validate regex pattern
      try {
        new RegExp(params.regex);
      } catch (error) {
        return this.formatError(`Invalid regular expression: ${error.message}`);
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

      // Send message to content script to search JavaScript
      try {
        const response = await chrome.tabs.sendMessage(activeTab.id, {
          type: MESSAGE_TYPES.SEARCH_WEBSITE_JAVASCRIPT,
          regex: params.regex,
          maxMatches: params.maxMatches || 10,
          contextLines: params.contextLines || 100,
        });

        if (response && response.success) {
          return this.formatSuccess(
            {
              regex: response.regex,
              totalFound: response.totalFound,
              returned: response.returned,
              matches: response.matches,
              pageInfo: response.pageInfo,
            },
            `Found ${response.totalFound} JavaScript matches for pattern "${response.regex}"`
          );
        } else {
          return this.formatError(
            response?.error || "Failed to search JavaScript content"
          );
        }
      } catch (error) {
        console.error("Error communicating with content script:", error);
        return this.formatError(
          "Could not communicate with webpage. Make sure you're on a valid webpage and try refreshing."
        );
      }
    } catch (error) {
      console.error("Error in SearchWebsiteJavaScriptTool:", error);
      return this.formatError(error.message);
    }
  }

  /**
   * Get user-friendly action message
   * @returns {string} Action message
   */
  getActionMessage() {
    return `Searching JavaScript content...`;
  }

  /**
   * Get user-friendly completion message
   * @returns {string} Completion message
   */
  getCompletionMessage(result) {
    return "JavaScript search completed successfully";
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
    } else if (error.includes("regex pattern is required")) {
      return "Please provide a regular expression pattern to search for";
    } else if (error.includes("Invalid regular expression")) {
      return "The provided regex pattern is invalid. Please check your syntax.";
    } else {
      return `JavaScript search failed: ${error}`;
    }
  }
} 