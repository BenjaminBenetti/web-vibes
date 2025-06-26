/**
 * Handler for getting information about applied hacks
 * Provides details about currently applied hacks on the page
 */

/**
 * Get information about currently applied hacks
 * @param {Map} appliedHacks - Map of currently applied hacks
 * @returns {Object} Information about applied hacks
 */
function getAppliedHacks(appliedHacks) {
  return {
    count: appliedHacks.size,
    hacks: Array.from(appliedHacks.values()).map((hack) => ({
      id: hack.id,
      name: hack.name,
      appliedAt: hack.appliedAt,
      preview: hack.preview,
      hasCSS: !!(hack.cssCode && hack.cssCode.trim()),
      hasJS: !!(hack.jsCode && hack.jsCode.trim()),
    })),
  };
}

/**
 * Handle GET_APPLIED_HACKS message
 * @param {Object} request - The message request
 * @param {Object} sender - The message sender
 * @param {Function} sendResponse - Response callback
 * @param {Map} appliedHacks - Map of currently applied hacks
 */
function handleGetAppliedHacks(request, sender, sendResponse, appliedHacks) {
  try {
    const hacksInfo = getAppliedHacks(appliedHacks);
    sendResponse({ success: true, data: hacksInfo });
  } catch (error) {
    console.error("Error in handleGetAppliedHacks:", error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}
