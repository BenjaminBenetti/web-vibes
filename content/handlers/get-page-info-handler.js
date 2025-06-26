/**
 * Handler for getting page information
 * Provides details about the current webpage
 */

/**
 * Get information about the current page
 * @returns {Object} Page information
 */
function getPageInfo() {
  return {
    url: window.location.href,
    hostname: window.location.hostname,
    title: document.title,
    readyState: document.readyState,
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Handle GET_PAGE_INFO message
 * @param {Object} request - The message request
 * @param {Object} sender - The message sender
 * @param {Function} sendResponse - Response callback
 */
function handleGetPageInfo(request, sender, sendResponse) {
  try {
    const pageInfo = getPageInfo();
    sendResponse({
      success: true,
      data: pageInfo,
    });
  } catch (error) {
    console.error("Error in handleGetPageInfo:", error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}
