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

  // Check if there are any saved hacks for this site and apply them
  await checkAndApplySavedHacks();

  // TODO: Future functionality will include:
  // - MCP-style server communication
  // - DOM modification capabilities
  // - Real-time website modification
}

/**
 * Check for saved hacks for the current site and apply them automatically
 */
async function checkAndApplySavedHacks() {
  try {
    const hostname = window.location.hostname;

    // Request hacks for this site from the service worker
    const response = await chrome.runtime.sendMessage({
      type: MESSAGE_TYPES.GET_HACKS_FOR_SITE,
      hostname: hostname
    });

    if (response && response.success && response.hacks && response.hacks.length > 0) {
      console.log(`Found ${response.hacks.length} saved hacks for ${hostname}, applying automatically`);

      // Apply each hack
      for (const hack of response.hacks) {
        try {
          const result = applyHack({
            id: hack.id,
            name: hack.name,
            description: hack.description,
            cssCode: hack.cssCode || "",
            jsCode: hack.jsCode || "",
            preview: false // Auto-applied hacks are permanent
          }, appliedHacks);

          if (result.success) {
            console.log(`Auto-applied hack: ${hack.name}`);
          } else {
            console.warn(`Failed to auto-apply hack ${hack.name}:`, result.error);
          }
        } catch (error) {
          console.error(`Error auto-applying hack ${hack.name}:`, error);
        }
      }
    } else {
      console.log(`No saved hacks found for ${hostname}`);
    }
  } catch (error) {
    console.error("Error checking for saved hacks:", error);
  }
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
