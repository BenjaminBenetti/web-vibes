/**
 * Handler for removing hacks from the current webpage
 * Manages removal of CSS and JavaScript elements from the page
 */

/**
 * Handle REMOVE_HACK message
 * @param {Object} request - The message request
 * @param {Object} sender - The message sender
 * @param {Function} sendResponse - Response callback
 * @param {Map} appliedHacks - Map of currently applied hacks
 */
function handleRemoveHack(request, sender, sendResponse, appliedHacks) {
  try {
    const result = removeHackFromPage(request.hackId, appliedHacks);
    sendResponse(result);
  } catch (error) {
    console.error("Error in handleRemoveHack:", error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}
