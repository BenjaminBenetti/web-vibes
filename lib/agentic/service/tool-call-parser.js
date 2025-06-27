/**
 * Tool Call Parser - Handles parsing of AI responses to extract tool calls
 * Supports multiple tool calls in a single response with proper parameter extraction
 */
class ToolCallParser {
  /**
   * Parse a single tool call from AI response
   * @param {string} responseText - AI response text
   * @returns {Object|null} Parsed tool call or null if none found
   * @deprecated Use parseToolCalls for multiple tool support
   */
  static parseToolCall(responseText) {
    const toolCalls = this.parseToolCalls(responseText);
    return toolCalls.length > 0 ? toolCalls[0] : null;
  }

  /**
   * Parse multiple tool calls from AI response
   * @param {string} responseText - AI response text
   * @returns {Array<Object>} Array of parsed tool calls
   */
  static parseToolCalls(responseText) {
    try {
      const toolCalls = [];
      const lines = responseText.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Look for TOOL_CALL: pattern
        if (line.startsWith('TOOL_CALL:')) {
          const toolName = line.replace('TOOL_CALL:', '').trim();

          // Look for PARAMETERS: in the next few lines
          const parameters = this.findParameters(lines, i + 1);

          toolCalls.push({
            name: toolName,
            parameters: parameters || {}
          });
        }
      }

      return toolCalls;
    } catch (error) {
      console.warn("Error parsing tool calls:", error);
      return [];
    }
  }

  /**
   * Find parameters for a tool call starting from a given line
   * @param {Array<string>} lines - Array of text lines
   * @param {number} startLine - Starting line index
   * @returns {Object|null} Extracted parameters or null if not found
   */
  static findParameters(lines, startLine) {
    for (let i = startLine; i < Math.min(startLine + 20, lines.length); i++) {
      const line = lines[i].trim();

      if (line.startsWith('PARAMETERS:')) {
        return this.extractJsonFromLines(lines, i);
      }

      // Stop if we hit another TOOL_CALL or empty line
      if (line.startsWith('TOOL_CALL:') || line === '') {
        break;
      }
    }

    return null;
  }

  /**
   * Extract JSON from lines starting with PARAMETERS:
   * @param {Array<string>} lines - Array of text lines
   * @param {number} startLine - Starting line index (line containing PARAMETERS:)
   * @returns {Object|null} Parsed JSON object or null if invalid
   */
  static extractJsonFromLines(lines, startLine) {
    try {
      // Get the first line and remove "PARAMETERS:" prefix
      let firstLine = lines[startLine].replace('PARAMETERS:', '').trim();

      // If the first line contains complete JSON, parse it directly
      if (firstLine.startsWith('{') && firstLine.endsWith('}')) {
        return JSON.parse(firstLine);
      }

      // Otherwise, collect lines until we have complete JSON
      let jsonText = firstLine;
      let braceCount = this.countBraces(firstLine);

      // Continue collecting lines until braces are balanced
      for (let i = startLine + 1; i < lines.length; i++) {
        const line = lines[i].trim();

        // Stop if we hit another TOOL_CALL or empty line
        if (line.startsWith('TOOL_CALL:') || line === '') {
          break;
        }

        jsonText += '\n' + line;
        braceCount += this.countBraces(line);

        // If braces are balanced, we have complete JSON
        if (braceCount === 0) {
          break;
        }
      }

      // Find the JSON object boundaries
      const startBrace = jsonText.indexOf('{');
      const endBrace = jsonText.lastIndexOf('}');

      if (startBrace === -1 || endBrace === -1 || startBrace >= endBrace) {
        return null;
      }

      const jsonString = jsonText.substring(startBrace, endBrace + 1);
      return JSON.parse(jsonString);

    } catch (error) {
      console.warn("Failed to parse parameters JSON:", error);
      return null;
    }
  }

  /**
   * Count opening and closing braces in a string
   * @param {string} text - Text to count braces in
   * @returns {number} Net brace count (positive for more opening braces)
   */
  static countBraces(text) {
    let count = 0;
    for (const char of text) {
      if (char === '{') count++;
      if (char === '}') count--;
    }
    return count;
  }

  /**
   * Validate a tool call object
   * @param {Object} toolCall - Tool call object to validate
   * @returns {Object} Validation result with success and error properties
   */
  static validateToolCall(toolCall) {
    if (!toolCall) {
      return { success: false, error: "Tool call is null or undefined" };
    }

    if (!toolCall.name || typeof toolCall.name !== "string") {
      return { success: false, error: "Tool call must have a valid name" };
    }

    if (!toolCall.parameters || typeof toolCall.parameters !== "object") {
      return { success: false, error: "Tool call must have valid parameters" };
    }

    return { success: true };
  }

  /**
   * Format tool calls for logging or debugging
   * @param {Array<Object>} toolCalls - Array of tool calls to format
   * @returns {string} Formatted string representation
   */
  static formatToolCalls(toolCalls) {
    if (!Array.isArray(toolCalls)) {
      return "Invalid tool calls array";
    }

    if (toolCalls.length === 0) {
      return "No tool calls found";
    }

    return toolCalls
      .map((call, index) => {
        const validation = this.validateToolCall(call);
        const status = validation.success ? "✓" : "✗";
        return `${index + 1}. ${status} ${call.name}: ${JSON.stringify(call.parameters)}`;
      })
      .join("\n");
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = ToolCallParser;
} else {
  window.ToolCallParser = ToolCallParser;
} 