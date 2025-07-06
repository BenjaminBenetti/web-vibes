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

      case MESSAGE_TYPES.SEARCH_WEBSITE_HTML:
        handleSearchWebsiteHTML(request, sender, sendResponse);
        break;

      case MESSAGE_TYPES.INSPECT_HTML_CSS:
        handleInspectHTMLCSS(request, sender, sendResponse);
        break;

      case MESSAGE_TYPES.SEARCH_WEBSITE_BY_KEYWORD:
        handleSearchWebsiteByKeyword(request, sender, sendResponse);
        break;

      case MESSAGE_TYPES.SEARCH_WEBSITE_JAVASCRIPT:
        handleSearchWebsiteJavaScript(request, sender, sendResponse);
        break;

      case MESSAGE_TYPES.START_ELEMENT_TARGETING:
        handleStartElementTargeting(request, sender, sendResponse);
        break;

      case MESSAGE_TYPES.STOP_ELEMENT_TARGETING:
        handleStopElementTargeting(request, sender, sendResponse);
        break;

      case MESSAGE_TYPES.TOGGLE_SERVICE_WORKER_BLOCKING:
        handleToggleServiceWorkerBlocking(request, sender, sendResponse);
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
