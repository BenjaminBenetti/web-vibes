/**
 * Message router for Web Vibes content script
 * Routes incoming messages to appropriate handlers
 */

/**
 * Routes messages to appropriate handlers
 * @param {Object} request - The message request
 * @param {Object} sender - The message sender
 * @param {Function} sendResponse - Response callback
 * @param {Map} appliedHacks - Map of currently applied hacks
 * @returns {boolean} True if response will be sent asynchronously
 */
function routeMessage(request, sender, sendResponse, appliedHacks) {
  console.log("Content script received message:", request);

  try {
    switch (request.type) {
      case MESSAGE_TYPES.APPLY_HACK:
        handleApplyHack(request, sender, sendResponse, appliedHacks);
        break;

      case MESSAGE_TYPES.REMOVE_HACK:
        handleRemoveHack(request, sender, sendResponse, appliedHacks);
        break;

      case MESSAGE_TYPES.GET_APPLIED_HACKS:
        handleGetAppliedHacks(request, sender, sendResponse, appliedHacks);
        break;

      case MESSAGE_TYPES.GET_PAGE_INFO:
        handleGetPageInfo(request, sender, sendResponse);
        break;

      default:
        sendResponse({
          success: false,
          error: `Unknown message type: ${request.type}`,
        });
    }
  } catch (error) {
    console.error("Error routing message:", error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }

  // Return true to indicate we'll send a response asynchronously
  return true;
}
