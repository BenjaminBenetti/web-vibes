/**
 * Handler for applying hacks to the current webpage
 * Manages CSS injection into the page (JavaScript is handled by ApplyHackTool)
 */

/**
 * Apply a hack to the current webpage
 * @param {Object} hackData - The hack data to apply
 * @param {Map} appliedHacks - Map of currently applied hacks
 * @returns {Object} Result of the application
 */
function applyHack(hackData, appliedHacks) {
  try {
    const { id, name, cssCode, jsCode, preview } = hackData;

    // Remove any existing application of this hack
    removeHackFromPage(id, appliedHacks);

    let appliedElements = [];

    // Apply CSS if present (JavaScript is handled by ApplyHackTool)
    if (cssCode && cssCode.trim()) {
      const styleElement = document.createElement("style");
      styleElement.id = `web-vibes-css-${id}`;
      styleElement.setAttribute("data-web-vibes", "true");
      styleElement.setAttribute("data-hack-id", id);
      styleElement.setAttribute("data-preview", preview.toString());
      styleElement.textContent = cssCode;

      document.head.appendChild(styleElement);
      appliedElements.push(styleElement);

      console.log(`Applied CSS for hack "${name}"`);
    }

    // Note: JavaScript injection is handled by ApplyHackTool using chrome.scripting.executeScript()
    // Content scripts cannot use chrome.scripting API due to CSP restrictions

    // Store the applied hack for management
    appliedHacks.set(id, {
      ...hackData,
      elements: appliedElements,
      appliedAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Successfully applied hack "${name}"`,
      elementsApplied: appliedElements.length,
      hasCSS: !!(cssCode && cssCode.trim()),
      hasJS: !!(jsCode && jsCode.trim()),
      note: "JavaScript will be injected separately by ApplyHackTool"
    };
  } catch (error) {
    console.error("Error applying hack:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Handle APPLY_HACK message
 * @param {Object} request - The message request
 * @param {Object} sender - The message sender
 * @param {Function} sendResponse - Response callback
 * @param {Map} appliedHacks - Map of currently applied hacks
 */
function handleApplyHack(request, sender, sendResponse, appliedHacks) {
  try {
    const result = applyHack(request.hack, appliedHacks);
    sendResponse(result);
  } catch (error) {
    console.error("Error in handleApplyHack:", error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}
