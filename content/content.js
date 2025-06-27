// Content script for Web Vibes Chrome Extension
// This script runs on every webpage and will handle:
// - Applying saved vibes to websites
// - Communicating with AI agents (future MCP-style server)
// - DOM manipulation for vibe modifications

console.log("Web Vibes content script loaded");

// Store applied hacks for management
let appliedHacks = new Map();

// Initialize the Web Vibes content script
async function initWebVibes() {
  console.log("Initializing Web Vibes on:", window.location.hostname);

  // TODO: Future functionality will include:
  // - MCP-style server communication
  // - DOM modification capabilities
  // - Real-time website modification
}


// Run initialization when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initWebVibes);
} else {
  initWebVibes();
}

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  return routeMessage(request, sender, sendResponse, appliedHacks);
});
