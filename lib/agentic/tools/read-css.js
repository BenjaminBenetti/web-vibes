/**
 * Tool for reading CSS code from the current vibe under edit
 * Allows the AI to read existing CSS code in a hack
 */
class ReadCSSTool extends AgenticTool {
  /**
   * Create a new ReadCSS tool
   * @param {HackService} hackService - Hack service for managing hacks
   */
  constructor(hackService) {
    const schema = {
      type: "object",
      properties: {
        includeMetadata: {
          type: "boolean",
          description:
            "Whether to include metadata about the code (rules count, size, etc.)",
          default: false,
        },
      },
      required: [],
    };

    super(
      "read_css",
      "Read CSS code from the current vibe under edit. Returns the current CSS code and optionally metadata about it.",
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
   * Execute the tool to read CSS code
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
      const cssCode = this.currentHack.cssCode || "";

      const result = {
        code: cssCode,
        isEmpty: cssCode.trim().length === 0,
      };

      if (includeMetadata) {
        result.metadata = {
          length: cssCode.length,
          lineCount: cssCode.split("\n").length,
          nonEmptyLineCount: cssCode
            .split("\n")
            .filter((line) => line.trim().length > 0).length,
          estimatedSize: new Blob([cssCode]).size + " bytes",
          rulesCount: this.countCSSRules(cssCode),
          hasComments: /\/\*[\s\S]*?\*\//.test(cssCode),
          lastModified: this.currentHack.createdAt?.toISOString() || null,
        };

        // CSS-specific analysis
        const cssAnalysis = this.analyzeCSS(cssCode);
        result.metadata.analysis = cssAnalysis;
      }

      return this.formatSuccess(result, {
        hackId: this.currentHack.id,
        hackName: this.currentHack.name,
      });
    } catch (error) {
      return this.formatError(`Failed to read CSS code: ${error.message}`, {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  /**
   * Count the number of CSS rules in the code
   * @param {string} css - CSS code to analyze
   * @returns {number} Number of CSS rules
   */
  countCSSRules(css) {
    if (!css || css.trim().length === 0) return 0;

    // Count opening braces as a rough estimate of rules
    const matches = css.match(/\{/g);
    return matches ? matches.length : 0;
  }

  /**
   * Perform basic analysis of CSS code
   * @param {string} code - CSS code to analyze
   * @returns {Object} Analysis results
   */
  analyzeCSS(code) {
    if (!code || code.trim().length === 0) {
      return {
        isEmpty: true,
        features: [],
        selectors: [],
      };
    }

    const features = [];
    const selectors = [];

    // Extract selectors (basic extraction)
    const ruleMatches = code.match(/([^{}]+)\{[^{}]*\}/g) || [];
    ruleMatches.forEach((rule) => {
      const selectorMatch = rule.match(/^([^{]+)\{/);
      if (selectorMatch) {
        const selector = selectorMatch[1].trim();
        selectors.push(selector);
      }
    });

    // Check for CSS features
    if (/\@media/.test(code)) features.push("media queries");
    if (/\@keyframes/.test(code)) features.push("animations");
    if (/\@import/.test(code)) features.push("imports");
    if (/\@font-face/.test(code)) features.push("custom fonts");
    if (/var\(--[\w-]+\)/.test(code)) features.push("CSS variables");
    if (/calc\(/.test(code)) features.push("calc() function");
    if (/grid|Grid/.test(code)) features.push("CSS Grid");
    if (/flex|Flex/.test(code)) features.push("Flexbox");
    if (/transform/.test(code)) features.push("transforms");
    if (/transition/.test(code)) features.push("transitions");
    if (/animation/.test(code)) features.push("animations");
    if (/rgba?\(|hsla?\(/.test(code)) features.push("color functions");
    if (/linear-gradient|radial-gradient/.test(code))
      features.push("gradients");
    if (/box-shadow|text-shadow/.test(code)) features.push("shadows");
    if (/border-radius/.test(code)) features.push("rounded corners");

    // Analyze selector types
    const selectorTypes = this.analyzeSelectorTypes(selectors);

    return {
      isEmpty: false,
      features,
      selectors: selectors.slice(0, 10), // Limit to first 10 selectors
      selectorCount: selectors.length,
      selectorTypes,
      estimatedComplexity: this.estimateComplexity(code, selectors.length),
    };
  }

  /**
   * Analyze the types of selectors used
   * @param {Array<string>} selectors - CSS selectors to analyze
   * @returns {Object} Selector type analysis
   */
  analyzeSelectorTypes(selectors) {
    const types = {
      element: 0,
      class: 0,
      id: 0,
      attribute: 0,
      pseudo: 0,
      descendant: 0,
      complex: 0,
    };

    selectors.forEach((selector) => {
      const normalized = selector.trim();

      if (/^[a-zA-Z][a-zA-Z0-9]*$/.test(normalized)) {
        types.element++;
      } else if (/^\.[a-zA-Z_-]/.test(normalized)) {
        types.class++;
      } else if (/^#[a-zA-Z_-]/.test(normalized)) {
        types.id++;
      } else if (/\[[\w-]+/.test(normalized)) {
        types.attribute++;
      } else if (/:[\w-]+/.test(normalized)) {
        types.pseudo++;
      } else if (/\s/.test(normalized)) {
        types.descendant++;
      } else {
        types.complex++;
      }
    });

    return types;
  }

  /**
   * Estimate CSS complexity based on simple metrics
   * @param {string} code - CSS code to analyze
   * @param {number} selectorCount - Number of selectors
   * @returns {string} Complexity level (low, medium, high)
   */
  estimateComplexity(code, selectorCount) {
    const lines = code
      .split("\n")
      .filter((line) => line.trim().length > 0).length;
    const rules = this.countCSSRules(code);
    const mediaQueries = (code.match(/@media/g) || []).length;
    const animations = (code.match(/@keyframes/g) || []).length;

    const complexityScore =
      lines +
      rules * 2 +
      selectorCount * 1.5 +
      mediaQueries * 3 +
      animations * 4;

    if (complexityScore < 30) return "low";
    if (complexityScore < 100) return "medium";
    return "high";
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = ReadCSSTool;
} else {
  window.ReadCSSTool = ReadCSSTool;
}
