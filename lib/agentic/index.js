/**
 * Agentic Module Index
 * Exports all agentic-related classes and utilities
 */

// Base classes
if (typeof AgenticTool === "undefined" && typeof require !== "undefined") {
  const AgenticTool = require("./model/agentic-tool");
  const AgenticService = require("./service/agentic-service");

  // Tools
  const SaveJSTool = require("./tools/save-js");
  const ReadJSTool = require("./tools/read-js");
  const SaveCSSTool = require("./tools/save-css");
  const ReadCSSTool = require("./tools/read-css");

  module.exports = {
    AgenticTool,
    AgenticService,
    SaveJSTool,
    ReadJSTool,
    SaveCSSTool,
    ReadCSSTool,
  };
}

/**
 * Create a fully configured agentic service with all standard tools
 * @param {AIService} aiService - AI service instance
 * @param {HackService} hackService - Hack service instance
 * @returns {AgenticService} Configured agentic service
 */
function createAgenticService(aiService, hackService) {
  if (!aiService || !hackService) {
    throw new Error("Both AIService and HackService are required");
  }

  // Create all available tools
  const tools = [
    new SaveJSTool(hackService),
    new ReadJSTool(hackService),
    new SaveCSSTool(hackService),
    new ReadCSSTool(hackService),
  ];

  // Create and return the agentic service
  const agenticService = new AgenticService(aiService, tools);

  return agenticService;
}

/**
 * Create tools array for manual service configuration
 * @param {HackService} hackService - Hack service instance
 * @returns {Array<AgenticTool>} Array of configured tools
 */
function createStandardTools(hackService) {
  if (!hackService) {
    throw new Error("HackService is required to create tools");
  }

  return [
    new SaveJSTool(hackService),
    new ReadJSTool(hackService),
    new SaveCSSTool(hackService),
    new ReadCSSTool(hackService),
  ];
}

// Export utility functions for browser usage
if (typeof window !== "undefined") {
  window.createAgenticService = createAgenticService;
  window.createStandardTools = createStandardTools;
}

// Export for Node.js
if (typeof module !== "undefined" && module.exports) {
  module.exports.createAgenticService = createAgenticService;
  module.exports.createStandardTools = createStandardTools;
}
