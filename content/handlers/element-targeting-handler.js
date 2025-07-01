/**
 * Element targeting handler for Web Vibes content script
 * Handles element targeting functionality allowing users to click on webpage elements
 * to add them to the AI chat context
 */

// State variables for targeting mode
let isTargetingActive = false;
let targetingOverlay = null;
let targetingStyles = null;
let lastHighlightedElement = null;

/**
 * Handle start element targeting message
 * @param {Object} request - The message request
 * @param {Object} sender - The message sender
 * @param {Function} sendResponse - Response callback
 */
function handleStartElementTargeting(request, sender, sendResponse) {
  try {
    if (isTargetingActive) {
      sendResponse({
        success: false,
        error: "Element targeting is already active",
      });
      return;
    }

    startElementTargeting(request.themeGradient);

    sendResponse({
      success: true,
      message: "Element targeting started",
    });
  } catch (error) {
    console.error("Error starting element targeting:", error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Handle stop element targeting message
 * @param {Object} request - The message request
 * @param {Object} sender - The message sender
 * @param {Function} sendResponse - Response callback
 */
function handleStopElementTargeting(request, sender, sendResponse) {
  try {
    stopElementTargeting();

    sendResponse({
      success: true,
      message: "Element targeting stopped",
    });
  } catch (error) {
    console.error("Error stopping element targeting:", error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Start element targeting mode
 */
function startElementTargeting(themeGradient) {
  if (isTargetingActive) return;

  isTargetingActive = true;

  // Create targeting overlay
  createTargetingOverlay();

  // Add targeting styles
  addTargetingStyles(themeGradient);

  // Add event listeners
  document.addEventListener("mouseover", handleMouseOver, true);
  document.addEventListener("mouseout", handleMouseOut, true);
  document.addEventListener("click", handleClick, true);
}

/**
 * Stop element targeting mode
 */
function stopElementTargeting() {
  if (!isTargetingActive) return;

  isTargetingActive = false;

  // Remove event listeners
  document.removeEventListener("mouseover", handleMouseOver, true);
  document.removeEventListener("mouseout", handleMouseOut, true);
  document.removeEventListener("click", handleClick, true);

  // Clean up overlay and styles
  removeTargetingOverlay();
  removeTargetingStyles();
  clearHighlight();
}

/**
 * Create targeting overlay with instructions
 */
function createTargetingOverlay() {
  // Remove existing overlay if any
  removeTargetingOverlay();

  targetingOverlay = document.createElement("div");
  targetingOverlay.id = "web-vibes-targeting-overlay";
  targetingOverlay.innerHTML = `
    <div class="web-vibes-targeting-instructions">
      <span class="web-vibes-crosshair">🎯</span>
      <span class="web-vibes-text">Click on any element to target (Esc to cancel)</span>
    </div>
  `;

  document.body.appendChild(targetingOverlay);
}

/**
 * Remove targeting overlay
 */
function removeTargetingOverlay() {
  if (targetingOverlay) {
    targetingOverlay.remove();
    targetingOverlay = null;
  }
}

/**
 * Add targeting styles to the page
 */
function addTargetingStyles(themeGradient) {
  if (targetingStyles) return;

  const backgroundStyle =
    themeGradient || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";

  targetingStyles = document.createElement("style");
  targetingStyles.id = "web-vibes-targeting-styles";
  targetingStyles.textContent = `
    #web-vibes-targeting-overlay {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 999999;
      background: ${backgroundStyle};
      color: white;
      padding: 12px 20px;
      border-radius: 25px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      animation: web-vibes-fade-in 0.3s ease-out;
      pointer-events: none;
    }
    
    .web-vibes-targeting-instructions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .web-vibes-crosshair {
      font-size: 16px;
    }
    
    .web-vibes-text {
      font-weight: 600;
    }
    
    @keyframes web-vibes-fade-in {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }
    
    .web-vibes-highlighted {
      outline: 3px solid #667eea !important;
      outline-offset: 2px !important;
      background-color: rgba(102, 126, 234, 0.1) !important;
      cursor: crosshair !important;
      position: relative !important;
    }
    
    .web-vibes-highlighted::before {
      content: "";
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      background: linear-gradient(45deg, #667eea, #764ba2);
      z-index: -1;
      border-radius: 4px;
      opacity: 0.3;
      pointer-events: none;
    }
    
    * {
      cursor: crosshair !important;
    }
  `;

  document.head.appendChild(targetingStyles);
}

/**
 * Remove targeting styles from the page
 */
function removeTargetingStyles() {
  if (targetingStyles) {
    targetingStyles.remove();
    targetingStyles = null;
  }
}

/**
 * Handle mouse over events during targeting
 * @param {MouseEvent} event - Mouse event
 */
function handleMouseOver(event) {
  if (!isTargetingActive) return;

  event.preventDefault();
  event.stopPropagation();

  // Don't highlight the targeting overlay or its children
  if (event.target.closest("#web-vibes-targeting-overlay")) {
    return;
  }

  clearHighlight();
  highlightElement(event.target);
}

/**
 * Handle mouse out events during targeting
 * @param {MouseEvent} event - Mouse event
 */
function handleMouseOut(event) {
  if (!isTargetingActive) return;

  event.preventDefault();
  event.stopPropagation();
}

/**
 * Handle click events during targeting
 * @param {MouseEvent} event - Mouse event
 */
function handleClick(event) {
  if (!isTargetingActive) return;

  event.preventDefault();
  event.stopPropagation();

  // Don't target the overlay
  if (event.target.closest("#web-vibes-targeting-overlay")) {
    return;
  }

  const targetElement = event.target;

  // Extract element data
  const elementData = extractElementData(targetElement);

  // Stop targeting mode
  stopElementTargeting();

  // Send element data back to sidepanel
  chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.ELEMENT_TARGETED,
    source: "content",
    elementData: elementData,
  });
}

/**
 * Highlight an element
 * @param {Element} element - Element to highlight
 */
function highlightElement(element) {
  if (
    !element ||
    element === document.body ||
    element === document.documentElement
  ) {
    return;
  }

  lastHighlightedElement = element;
  element.classList.add("web-vibes-highlighted");
}

/**
 * Clear element highlighting
 */
function clearHighlight() {
  if (lastHighlightedElement) {
    lastHighlightedElement.classList.remove("web-vibes-highlighted");
    lastHighlightedElement = null;
  }
}

/**
 * Extract data from a targeted element
 * @param {Element} element - The targeted element
 * @returns {Object} Element data
 */
function extractElementData(element) {
  try {
    // Generate a unique selector for the element
    const selector = generateSelector(element);

    // Define reasonable limits for data extraction
    const TEXT_LIMIT = 1000;  // Increased for better context
    const HTML_LIMIT = 10000; // Increased for complex elements

    // Get text content (truncated if too long)
    const textContent = element.textContent || "";
    const truncatedText =
      textContent.length > TEXT_LIMIT
        ? textContent.substring(0, TEXT_LIMIT) + "..."
        : textContent;

    // Get outer HTML (truncated if too long)
    const outerHTML = element.outerHTML || "";
    const truncatedHTML =
      outerHTML.length > HTML_LIMIT
        ? outerHTML.substring(0, HTML_LIMIT) + "..."
        : outerHTML;

    return {
      tagName: element.tagName.toLowerCase(),
      selector: selector,
      textContent: truncatedText,
      outerHTML: truncatedHTML,
      innerHTML: element.innerHTML || "",
      attributes: getElementAttributes(element),
      boundingRect: element.getBoundingClientRect(),
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error extracting element data:", error);
    return {
      tagName: element.tagName?.toLowerCase() || "unknown",
      selector: "unknown",
      textContent: "",
      outerHTML: "",
      innerHTML: "",
      attributes: {},
      boundingRect: {},
      url: window.location.href,
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
}

/**
 * Generate a CSS selector for an element
 * @param {Element} element - The element
 * @returns {string} CSS selector
 */
function generateSelector(element) {
  try {
    // If element has an ID, use it
    if (element.id) {
      return `#${element.id}`;
    }

    // Build selector path
    const path = [];
    let current = element;

    while (
      current &&
      current !== document.body &&
      current !== document.documentElement
    ) {
      let selector = current.tagName.toLowerCase();

      // Add class names if available
      if (current.className && typeof current.className === "string") {
        const classes = current.className
          .trim()
          .split(/\s+/)
          .filter((cls) => cls && !cls.startsWith("web-vibes-"))
          .slice(0, 3); // Limit to 3 classes to keep selector manageable
        if (classes.length > 0) {
          selector += "." + classes.join(".");
        }
      }

      // Add nth-child if needed to make selector unique
      const siblings = Array.from(current.parentElement?.children || []).filter(
        (el) => el.tagName === current.tagName
      );
      if (siblings.length > 1) {
        const index = siblings.indexOf(current) + 1;
        selector += `:nth-child(${index})`;
      }

      path.unshift(selector);
      current = current.parentElement;

      // Limit path depth to avoid overly long selectors
      if (path.length >= 5) break;
    }

    return path.join(" > ");
  } catch (error) {
    console.error("Error generating selector:", error);
    return element.tagName?.toLowerCase() || "unknown";
  }
}

/**
 * Get element attributes as an object
 * @param {Element} element - The element
 * @returns {Object} Attributes object
 */
function getElementAttributes(element) {
  try {
    const attributes = {};
    for (const attr of element.attributes) {
      // Skip very long attribute values and our own classes
      if (attr.value.length > 200 || attr.name.startsWith("web-vibes-")) {
        continue;
      }
      attributes[attr.name] = attr.value;
    }
    return attributes;
  } catch (error) {
    console.error("Error getting element attributes:", error);
    return {};
  }
}
