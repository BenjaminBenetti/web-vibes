/**
 * Handler for searching webpage content by keyword with context
 * Allows finding specific content and understanding its surrounding context
 */

/**
 * Search webpage content by keyword with surrounding context
 * @param {string} keyword - Keyword or phrase to search for
 * @param {number} maxResults - Maximum number of matches to return
 * @param {number} contextLines - Number of lines of context before and after
 * @param {boolean} caseSensitive - Whether search is case sensitive
 * @param {boolean} searchInText - Search in text content
 * @param {boolean} searchInHTML - Search in HTML attributes and tags
 * @returns {Object} Search results
 */
function searchWebsiteByKeyword(keyword, maxResults = 10, contextLines = 3, caseSensitive = false, searchInText = true, searchInHTML = false) {
  try {
    // Validate keyword
    if (!keyword || typeof keyword !== "string") {
      throw new Error("Valid keyword is required");
    }

    const matches = [];
    const searchRegex = new RegExp(escapeRegExp(keyword), caseSensitive ? 'g' : 'gi');

    // Get all text nodes and elements
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: function (node) {
          // Skip script and style elements
          if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            if (tagName === 'script' || tagName === 'style' || tagName === 'noscript') {
              return NodeFilter.FILTER_REJECT;
            }
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const nodes = [];
    let node;
    while (node = walker.nextNode()) {
      nodes.push(node);
    }

    // Search through nodes
    for (let i = 0; i < nodes.length && matches.length < maxResults; i++) {
      const node = nodes[i];

      // Search in text content
      if (searchInText && node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (text && searchRegex.test(text)) {
          const match = createTextMatch(node, keyword, contextLines, caseSensitive);
          if (match) {
            matches.push(match);
          }
        }
      }

      // Search in HTML attributes and tags
      if (searchInHTML && node.nodeType === Node.ELEMENT_NODE) {
        const element = node;

        // Search in attributes
        for (let attr of element.attributes) {
          if (searchRegex.test(attr.value)) {
            const match = createAttributeMatch(element, attr, keyword, contextLines, caseSensitive);
            if (match) {
              matches.push(match);
            }
          }
        }

        // Search in tag name
        if (searchRegex.test(element.tagName)) {
          const match = createTagMatch(element, keyword, contextLines, caseSensitive);
          if (match) {
            matches.push(match);
          }
        }
      }
    }

    return {
      success: true,
      keyword: keyword,
      totalFound: matches.length,
      returned: matches.length,
      matches: matches,
      pageInfo: {
        url: window.location.href,
        title: document.title,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Error searching website by keyword:", error);
    return {
      success: false,
      error: error.message,
      keyword: keyword,
    };
  }
}

/**
 * Create a text content match with context
 * @param {Text} textNode - Text node containing the match
 * @param {string} keyword - The keyword that was found
 * @param {number} contextLines - Number of lines of context
 * @param {boolean} caseSensitive - Whether search was case sensitive
 * @returns {Object} Match object
 */
function createTextMatch(textNode, keyword, contextLines, caseSensitive) {
  try {
    const text = textNode.textContent;
    const searchRegex = new RegExp(escapeRegExp(keyword), caseSensitive ? 'g' : 'gi');
    const matchIndex = text.search(searchRegex);

    if (matchIndex === -1) return null;

    // Get surrounding context
    const start = Math.max(0, matchIndex - 200);
    const end = Math.min(text.length, matchIndex + keyword.length + 200);
    const context = text.substring(start, end);

    // Highlight the keyword in context
    const highlightedContext = context.replace(
      new RegExp(escapeRegExp(keyword), caseSensitive ? 'g' : 'gi'),
      `<mark>${keyword}</mark>`
    );

    return {
      type: 'text',
      match: keyword,
      context: highlightedContext,
      element: generateElementSelector(textNode.parentElement),
      tagName: textNode.parentElement?.tagName?.toLowerCase() || 'unknown',
      textContent: textNode.textContent?.trim() || "",
      outerHTML: textNode.parentElement?.outerHTML || "",
      matchIndex: matchIndex,
      boundingRect: textNode.parentElement?.getBoundingClientRect(),
    };
  } catch (error) {
    console.error("Error creating text match:", error);
    return null;
  }
}

/**
 * Create an attribute match with context
 * @param {Element} element - Element containing the match
 * @param {Attr} attribute - Attribute containing the match
 * @param {string} keyword - The keyword that was found
 * @param {number} contextLines - Number of lines of context
 * @param {boolean} caseSensitive - Whether search was case sensitive
 * @returns {Object} Match object
 */
function createAttributeMatch(element, attribute, keyword, contextLines, caseSensitive) {
  try {
    const searchRegex = new RegExp(escapeRegExp(keyword), caseSensitive ? 'g' : 'gi');
    const matchIndex = attribute.value.search(searchRegex);

    if (matchIndex === -1) return null;

    // Highlight the keyword in attribute value
    const highlightedValue = attribute.value.replace(
      new RegExp(escapeRegExp(keyword), caseSensitive ? 'g' : 'gi'),
      `<mark>${keyword}</mark>`
    );

    return {
      type: 'attribute',
      match: keyword,
      attributeName: attribute.name,
      attributeValue: highlightedValue,
      element: generateElementSelector(element),
      tagName: element.tagName.toLowerCase(),
      textContent: element.textContent?.trim() || "",
      outerHTML: element.outerHTML || "",
      matchIndex: matchIndex,
      boundingRect: element.getBoundingClientRect(),
    };
  } catch (error) {
    console.error("Error creating attribute match:", error);
    return null;
  }
}

/**
 * Create a tag match with context
 * @param {Element} element - Element containing the match
 * @param {string} keyword - The keyword that was found
 * @param {number} contextLines - Number of lines of context
 * @param {boolean} caseSensitive - Whether search was case sensitive
 * @returns {Object} Match object
 */
function createTagMatch(element, keyword, contextLines, caseSensitive) {
  try {
    const searchRegex = new RegExp(escapeRegExp(keyword), caseSensitive ? 'g' : 'gi');
    const matchIndex = element.tagName.search(searchRegex);

    if (matchIndex === -1) return null;

    // Highlight the keyword in tag name
    const highlightedTagName = element.tagName.replace(
      new RegExp(escapeRegExp(keyword), caseSensitive ? 'g' : 'gi'),
      `<mark>${keyword}</mark>`
    );

    return {
      type: 'tag',
      match: keyword,
      tagName: highlightedTagName,
      element: generateElementSelector(element),
      textContent: element.textContent?.trim() || "",
      outerHTML: element.outerHTML || "",
      matchIndex: matchIndex,
      boundingRect: element.getBoundingClientRect(),
    };
  } catch (error) {
    console.error("Error creating tag match:", error);
    return null;
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
 * Escape special regex characters
 * @param {string} string - String to escape
 * @returns {string} Escaped string
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Handle SEARCH_WEBSITE_BY_KEYWORD message
 * @param {Object} request - The message request
 * @param {Object} sender - The message sender
 * @param {Function} sendResponse - Response callback
 */
function handleSearchWebsiteByKeyword(request, sender, sendResponse) {
  console.log("handleSearchWebsiteByKeyword called with:", request);

  try {
    // Validate input
    if (!request || !request.keyword) {
      console.error("Invalid request - missing keyword");
      sendResponse({
        success: false,
        error: "Missing keyword in request",
      });
      return;
    }

    console.log("Searching for keyword:", request.keyword);
    const result = searchWebsiteByKeyword(
      request.keyword,
      request.maxResults || 10,
      request.contextLines || 3,
      request.caseSensitive || false,
      request.searchInText !== false, // Default to true
      request.searchInHTML || false
    );
    console.log("Keyword search result:", result);

    sendResponse(result);
  } catch (error) {
    console.error("Error in handleSearchWebsiteByKeyword:", error);
    console.error("Error stack:", error.stack);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
} 