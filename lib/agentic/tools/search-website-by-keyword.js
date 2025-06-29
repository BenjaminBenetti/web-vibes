/**
 * Tool for searching webpage content by keyword with surrounding context
 * Allows the AI to find specific content and understand its context
 */
class SearchWebsiteByKeywordTool extends AgenticTool {
  /**
   * Create a new SearchWebsiteByKeyword tool
   */
  constructor() {
    super(
      "search_website_by_keyword",
      "Search webpage content by keyword and return HTML surrounding matches with configurable context",
      {
        type: "object",
        properties: {
          keyword: {
            type: "string",
            description:
              "Keyword or phrase to search for in the webpage content",
          },
          maxResults: {
            type: "number",
            description: "Maximum number of matches to return (default: 10)",
          },
          contextLines: {
            type: "number",
            description: "Number of lines of HTML context before and after each match (default: 100)",
          },
          caseSensitive: {
            type: "boolean",
            description: "Whether the search should be case sensitive (default: false)",
          },
          searchInText: {
            type: "boolean",
            description: "Search in text content only (default: true)",
          },
          searchInHTML: {
            type: "boolean",
            description: "Search in HTML attributes and tags (default: false)",
          },
        },
        required: ["keyword"],
      },
      false // This tool only reads data from the webpage
    );
  }

  /**
   * Execute the search website by keyword tool
   * @param {Object} params - Tool parameters
   * @returns {Object} Search results
   */
  async run(params) {
    try {
      // Validate required parameters
      if (!params.keyword) {
        return this.formatError("Keyword is required");
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

      // Send message to content script to search by keyword
      try {
        const response = await chrome.tabs.sendMessage(activeTab.id, {
          type: MESSAGE_TYPES.SEARCH_WEBSITE_BY_KEYWORD,
          keyword: params.keyword,
          maxResults: params.maxResults || 10,
          contextLines: params.contextLines || 100,
          caseSensitive: params.caseSensitive || false,
          searchInText: params.searchInText !== false, // Default to true
          searchInHTML: params.searchInHTML || false,
        });

        if (response && response.success) {
          return this.formatSuccess(
            {
              keyword: response.keyword,
              totalFound: response.totalFound,
              returned: response.returned,
              matches: response.matches,
              pageInfo: response.pageInfo,
            },
            `Found ${response.totalFound} matches for "${response.keyword}"`
          );
        } else {
          return this.formatError(
            response?.error || "Failed to search webpage content"
          );
        }
      } catch (error) {
        console.error("Error communicating with content script:", error);
        return this.formatError(
          "Could not communicate with webpage. Make sure you're on a valid webpage and try refreshing."
        );
      }
    } catch (error) {
      console.error("Error in SearchWebsiteByKeywordTool:", error);
      return this.formatError(error.message);
    }
  }

  /**
   * Get user-friendly action message
   * @returns {string} Action message
   */
  getActionMessage() {
    return `Searching html by keyword...`;
  }

  /**
   * Get user-friendly completion message
   * @returns {string} Completion message
   */
  getCompletionMessage(result) {
    return "Keyword search completed successfully";
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
    } else if (error.includes("Keyword is required")) {
      return "Please provide a keyword to search for";
    } else {
      return `Keyword search failed: ${error}`;
    }
  }
} 