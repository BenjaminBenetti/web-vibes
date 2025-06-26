/**
 * Tool for reading    super(
      "read_vibe_js",
      "Read JavaScript code from the current vibe/hack under edit. Returns the current vibe's JavaScript code and optionally metadata about it.",
      schema
    );Script code from the current vibe under edit
 * Allows the AI to read existing JavaScript code in a hack
 */
class ReadJSTool extends AgenticTool {
  /**
   * Create a new ReadJS tool
   * @param {HackService} hackService - Hack service for managing hacks
   */
  constructor(hackService) {
    const schema = {
      type: "object",
      properties: {
        includeMetadata: {
          type: "boolean",
          description:
            "Whether to include metadata about the code (line count, size, etc.)",
          default: false,
        },
      },
      required: [],
    };

    super(
      "read_js",
      "Read the currently applied JavaScript edits. This is the JavaScript you are working on. Returns the current JS code and optionally metadata about it.",
      schema
    );

    this.hackService = hackService;
    this.currentHack = null;
  }

  /**
   * Set the current hack being edited
   * @param {Hack} hack - The hack instance to read from
   */
  setCurrentHack(hack) {
    this.currentHack = hack;
  }

  /**
   * Execute the tool to read JavaScript code
   * @param {Object} parameters - Tool parameters
   * @param {boolean} [parameters.includeMetadata=false] - Whether to include metadata
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

      const { includeMetadata = false } = parameters;
      const jsCode = this.currentHack.jsCode || "";

      const result = {
        code: jsCode,
        isEmpty: jsCode.trim().length === 0,
      };

      if (includeMetadata) {
        result.metadata = {
          length: jsCode.length,
          lineCount: jsCode.split("\n").length,
          nonEmptyLineCount: jsCode
            .split("\n")
            .filter((line) => line.trim().length > 0).length,
          estimatedSize: new Blob([jsCode]).size + " bytes",
          hasComments: /\/\*[\s\S]*?\*\/|\/\/.*$/gm.test(jsCode),
          lastModified: this.currentHack.createdAt?.toISOString() || null,
        };

        // Basic code analysis
        const codeAnalysis = this.analyzeJavaScript(jsCode);
        result.metadata.analysis = codeAnalysis;
      }

      return this.formatSuccess(result, {
        hackId: this.currentHack.id,
        hackName: this.currentHack.name,
      });
    } catch (error) {
      return this.formatError(
        `Failed to read JavaScript code: ${error.message}`,
        {
          error: error.message,
          stack: error.stack,
        }
      );
    }
  }

  /**
   * Get user-friendly action message for vibe JS reading
   * @returns {string} Action message
   */
  getActionMessage() {
    return "Reading vibe JavaScript code";
  }

  /**
   * Get user-friendly completion message for vibe JS reading
   * @returns {string} Completion message
   */
  getCompletionMessage() {
    return "Vibe JavaScript code analyzed";
  }

  /**
   * Get user-friendly error message for vibe JS reading failures
   * @param {string} error - The actual error
   * @returns {string} Error message
   */
  getErrorMessage(error) {
    return `Failed to read vibe JavaScript: ${error}`;
  }

  /**
   * Perform basic analysis of JavaScript code
   * @param {string} code - JavaScript code to analyze
   * @returns {Object} Analysis results
   */
  analyzeJavaScript(code) {
    if (!code || code.trim().length === 0) {
      return {
        isEmpty: true,
        features: [],
      };
    }

    const features = [];

    // Check for common JavaScript features
    if (/\bfunction\s+\w+\s*\(/.test(code))
      features.push("function declarations");
    if (/\b(?:const|let|var)\s+\w+\s*=\s*(?:function|\()/.test(code))
      features.push("function expressions");
    if (/\b(?:async\s+function|\basync\s*\()/.test(code))
      features.push("async functions");
    if (/\bclass\s+\w+/.test(code)) features.push("classes");
    if (/\bimport\s+/.test(code)) features.push("ES6 imports");
    if (/\bexport\s+/.test(code)) features.push("ES6 exports");
    if (/\b(?:addEventListener|removeEventListener)/.test(code))
      features.push("event listeners");
    if (/\bdocument\.(?:querySelector|getElementById|getElementsBy)/.test(code))
      features.push("DOM manipulation");
    if (/\b(?:fetch|XMLHttpRequest)/.test(code)) features.push("HTTP requests");
    if (/\b(?:setTimeout|setInterval)/.test(code)) features.push("timers");
    if (/\btry\s*\{[\s\S]*?\}\s*catch/.test(code))
      features.push("error handling");

    return {
      isEmpty: false,
      features,
      estimatedComplexity: this.estimateComplexity(code),
    };
  }

  /**
   * Estimate code complexity based on simple metrics
   * @param {string} code - JavaScript code to analyze
   * @returns {string} Complexity level (low, medium, high)
   */
  estimateComplexity(code) {
    const lines = code
      .split("\n")
      .filter((line) => line.trim().length > 0).length;
    const functions = (code.match(/\bfunction\b/g) || []).length;
    const conditionals = (code.match(/\b(?:if|switch|while|for)\b/g) || [])
      .length;

    const complexityScore = lines + functions * 2 + conditionals * 1.5;

    if (complexityScore < 20) return "low";
    if (complexityScore < 50) return "medium";
    return "high";
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = ReadJSTool;
} else {
  window.ReadJSTool = ReadJSTool;
}
