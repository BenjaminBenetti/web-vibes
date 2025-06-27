/**
 * Shared utilities for content script handlers
 * Common functions used across multiple handlers
 */

/**
 * Remove a hack from the current webpage
 * @param {string} hackId - The ID of the hack to remove
 * @param {Map} appliedHacks - Map of currently applied hacks
 * @returns {Object} Result of the removal
 */
function removeHackFromPage(hackId, appliedHacks) {
  try {
    const appliedHack = appliedHacks.get(hackId);

    if (appliedHack) {
      // Remove all elements for this hack (CSS elements)
      appliedHack.elements.forEach((element) => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });

      // Remove from our tracking
      appliedHacks.delete(hackId);

      console.log(`Removed hack "${appliedHack.name}"`);
      return {
        success: true,
        message: `Successfully removed hack "${appliedHack.name}"`,
        note: "JavaScript removal should be handled by the extension context"
      };
    } else {
      // Try to remove by DOM query as fallback (CSS elements only)
      const elements = document.querySelectorAll(`[data-hack-id="${hackId}"]`);
      elements.forEach((element) => element.remove());

      return {
        success: true,
        message: "Hack removed (fallback method)",
        note: "JavaScript removal should be handled by the extension context"
      };
    }
  } catch (error) {
    console.error("Error removing hack:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
