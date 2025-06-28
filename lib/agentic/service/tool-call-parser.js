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

        // Look for TOOL_CALL: pattern (either at start of line or anywhere in line)
        const toolCallIndex = line.indexOf('TOOL_CALL:');
        if (toolCallIndex !== -1) {
          const toolName = line.substring(toolCallIndex + 'TOOL_CALL:'.length).trim();

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

      // Look for PARAMETERS: pattern (either at start of line or anywhere in line)
      const parametersIndex = line.indexOf('PARAMETERS:');
      if (parametersIndex !== -1) {
        return this.extractJsonFromLines(lines, i, parametersIndex);
      }

      // Stop if we hit another TOOL_CALL or empty line
      if (line.indexOf('TOOL_CALL:') !== -1 || line === '') {
        break;
      }
    }

    return null;
  }

  /**
   * Extract JSON from lines starting with PARAMETERS:
   * @param {Array<string>} lines - Array of text lines
   * @param {number} startLine - Starting line index (line containing PARAMETERS:)
   * @param {number} parametersIndex - Index of PARAMETERS: in the line (defaults to 0)
   * @returns {Object|null} Parsed JSON object or null if invalid
   */
  static extractJsonFromLines(lines, startLine, parametersIndex = 0) {
    try {
      // Get the first line and remove "PARAMETERS:" prefix
      let firstLine = lines[startLine].substring(parametersIndex + 'PARAMETERS:'.length).trim();

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
        if (line.indexOf('TOOL_CALL:') !== -1 || line === '') {
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
      if (startBrace === -1) {
        return null; // No opening brace found
      }

      // Scan forward to find the matching closing brace while respecting quoted strings
      let depth = 0;
      let inString = false;
      let escaped = false;
      let endBrace = -1;

      for (let i = startBrace; i < jsonText.length; i++) {
        const ch = jsonText[i];

        // Handle string state
        if (inString) {
          if (escaped) {
            escaped = false; // Current char is escaped, skip special handling
          } else if (ch === '\\') {
            escaped = true; // Next char is escaped
          } else if (ch === '"') {
            inString = false; // End of string
          }
          continue;
        }

        // Not currently in string
        if (ch === '"') {
          inString = true;
          continue;
        }

        if (ch === '{') {
          depth++;
        } else if (ch === '}') {
          depth--;
          if (depth === 0) {
            endBrace = i;
            break;
          }
        }
      }

      if (endBrace === -1) {
        return null; // Matching closing brace not found
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

  /**
   * Strip tool call directives (TOOL_CALL/PARAMETERS) and tool result blocks from raw AI content.
   * This provides a single authoritative implementation used by UI components like AIChatManager
   * to clean assistant messages before display.
   * @param {string} content Raw AI assistant response
   * @returns {string} Cleaned content
   */
  static stripToolArtifacts(content) {
    if (typeof content !== "string" || !content) return "";

    const lines = content.split("\n");
    const cleanedLines = [];

    let skipMode = null; // null | "tool" | "result"
    let braceDepth = 0;

    const updateBraceDepth = (text) => {
      for (const ch of text) {
        if (ch === "{") braceDepth++;
        if (ch === "}") braceDepth--;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detect TOOL_CALL line
      if (line.includes("TOOL_CALL:")) {
        skipMode = "tool";
        braceDepth = 0;
        continue;
      }

      if (skipMode === "tool") {
        // Handle PARAMETERS line
        if (line.includes("PARAMETERS:")) {
          const braceIdx = line.indexOf("{");
          if (braceIdx !== -1) {
            updateBraceDepth(line.slice(braceIdx));
            if (braceDepth === 0) {
              skipMode = null; // parameters inline JSON closed same line
            }
          }
          continue;
        }
        // If inside braces, continue skipping until closed
        if (braceDepth > 0) {
          updateBraceDepth(line);
          if (braceDepth === 0) {
            skipMode = null;
          }
          continue;
        }
        // Skip empty or other lines until blank encountered
        if (line.trim() === "") {
          skipMode = null;
        }
        continue;
      }

      // Detect Tool Result block
      if (line.trim().startsWith("Tool Result (")) {
        skipMode = "result";
        braceDepth = 0;
        const braceIdx = line.indexOf("{");
        if (braceIdx !== -1) {
          updateBraceDepth(line.slice(braceIdx));
          if (braceDepth === 0) {
            skipMode = null; // closed on same line
          }
        } else {
          skipMode = null; // no JSON, skip only this line
        }
        continue;
      }

      if (skipMode === "result") {
        if (braceDepth > 0) {
          updateBraceDepth(line);
          if (braceDepth === 0) {
            skipMode = null;
          }
          continue;
        }
        if (line.trim() === "") {
          skipMode = null;
        }
        continue;
      }

      // Not in skip mode, preserve line
      cleanedLines.push(line);
    }

    let cleaned = cleanedLines.join("\n");
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, "\n\n");
    return cleaned.trim();
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = ToolCallParser;
} else {
  window.ToolCallParser = ToolCallParser;
} 