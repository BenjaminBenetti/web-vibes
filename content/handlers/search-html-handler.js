/**
 * Handler for searching website HTML content
 * Allows querying the DOM using CSS selectors
 */

/**
 * Search for HTML content using CSS selectors
 * @param {string} selector - CSS selector to search for
 * @param {number} maxResults - Maximum number of results to return
 * @param {number} maxLength - Maximum length of HTML content per element
 * @returns {Object} Search results
 */
function searchWebsiteHTML(selector, maxResults = 10, maxLength = 5000) {
  try {
    // Validate selector
    if (!selector || typeof selector !== "string") {
      throw new Error("Valid CSS selector is required");
    }

    // Find matching elements
    const elements = document.querySelectorAll(selector);

    if (elements.length === 0) {
      return {
        success: true,
        selector: selector,
        count: 0,
        matches: [],
        pageInfo: {
          url: window.location.href,
          title: document.title,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Limit results
    const limitedElements = Array.from(elements).slice(0, maxResults);

    // Extract data from each element
    const matches = limitedElements.map((element, index) => {
      const outerHTML = element.outerHTML || "";

      return {
        index: index,
        tagName: element.tagName.toLowerCase(),
        selector: generateElementSelector(element),
        textContent: element.textContent?.trim() || "",
        outerHTML:
          outerHTML.length > maxLength
            ? outerHTML.substring(0, maxLength) + "..."
            : outerHTML,
      };
    });

    return {
      success: true,
      selector: selector,
      count: elements.length,
      totalFound: elements.length,
      returned: matches.length,
      matches: matches,
      pageInfo: {
        url: window.location.href,
        title: document.title,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Error searching website HTML:", error);
    return {
      success: false,
      error: error.message,
      selector: selector,
    };
  }
}

/**
 * Generate a unique CSS selector for an element
 * @param {Element} element - DOM element
 * @returns {string} CSS selector
 */
function generateElementSelector(element) {
  try {
    // If element has an ID, use that
    if (element.id) {
      return `#${element.id}`;
    }

    // Build a path from the element to the root
    const path = [];
    let current = element;

    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let selector = current.tagName.toLowerCase();

      // Add class if available
      if (current.className && typeof current.className === "string") {
        const classes = current.className.trim().split(/\s+/).slice(0, 2); // Limit to 2 classes
        if (classes.length > 0 && classes[0]) {
          selector += "." + classes.join(".");
        }
      }

      path.unshift(selector);
      current = current.parentElement;

      // Limit path depth to avoid overly long selectors
      if (path.length >= 4) break;
    }

    return path.join(" > ");
  } catch (error) {
    return element.tagName?.toLowerCase() || "unknown";
  }
}

/**
 * Handle SEARCH_WEBSITE_HTML message
 * @param {Object} request - The message request
 * @param {Object} sender - The message sender
 * @param {Function} sendResponse - Response callback
 */
function handleSearchWebsiteHTML(request, sender, sendResponse) {
  console.log("handleSearchWebsiteHTML called with:", request);

  try {
    // Validate input
    if (!request || !request.selector) {
      console.error("Invalid request - missing selector");
      sendResponse({
        success: false,
        error: "Missing CSS selector in request",
      });
      return;
    }

    console.log("Searching for selector:", request.selector);
    const result = searchWebsiteHTML(
      request.selector,
      request.maxResults || 10,
      request.maxLength || 5000
    );
    console.log("Search result:", result);

    sendResponse(result);
  } catch (error) {
    console.error("Error in handleSearchWebsiteHTML:", error);
    console.error("Error stack:", error.stack);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}
