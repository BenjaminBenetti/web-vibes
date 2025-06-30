/**
 * Agentic Module Index
 * Exports all agentic-related classes and utilities
 */

/**
 * Create a fully configured agentic service with all standard tools
 * @param {AIService} aiService - AI service instance
 * @param {HackService} hackService - Hack service instance
 * @param {SettingsService} settingsService - Settings service instance
 * @returns {AgenticService} Configured agentic service
 */
function createAgenticService(aiService, hackService, settingsService) {
  if (!aiService || !hackService || !settingsService) {
    throw new Error(
      "AIService, HackService, and SettingsService are required"
    );
  }

  // Create all available tools
  const tools = [
    new SearchWebsiteHTMLTool(),
    new InspectHTMLCSSTool(),
    new SearchWebsiteByKeywordTool(),
    new SearchWebsiteJavaScriptTool(),
    new SaveJSTool(hackService),
    new ReadJSTool(hackService),
    new SaveCSSTool(hackService),
    new ReadCSSTool(hackService),
    new ApplyHackTool(hackService),
  ];

  // Create and return the agentic service
  const agenticService = new AgenticService(aiService, tools, settingsService);

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
    new ApplyHackTool(hackService),
    new SearchWebsiteHTMLTool(),
    new InspectHTMLCSSTool(),
    new SearchWebsiteByKeywordTool(),
    new SearchWebsiteJavaScriptTool(),
  ];
}

// Export utility functions for browser usage
if (typeof window !== "undefined") {
  window.createAgenticService = createAgenticService;
  window.createStandardTools = createStandardTools;
}
