/**
 * Handler for inspecting CSS styles applied to HTML elements
 * Allows detailed analysis of styling and visual presentation
 */

/**
 * Inspect CSS styles for elements matching a selector
 * @param {string} selector - CSS selector to find elements
 * @param {number} maxResults - Maximum number of elements to inspect
 * @param {boolean} includeComputed - Include computed styles
 * @param {boolean} includePseudo - Include pseudo-element styles
 * @returns {Object} Inspection results
 */
function inspectHTMLCSS(selector, maxResults = 5, includeComputed = true, includePseudo = false) {
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
        totalFound: 0,
        returned: 0,
        elements: [],
        pageInfo: {
          url: window.location.href,
          title: document.title,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Limit results
    const limitedElements = Array.from(elements).slice(0, maxResults);

    // Extract CSS data from each element
    const elementsData = limitedElements.map((element, index) => {
      const styles = getElementStyles(element, includeComputed, includePseudo);
      const cssRules = getMatchedCSSRules(element);

      return {
        index: index,
        tagName: element.tagName.toLowerCase(),
        selector: generateElementSelector(element),
        textContent: element.textContent?.trim() || "",
        outerHTML: element.outerHTML || "",
        styles: styles,
        cssRules: cssRules,
        boundingRect: element.getBoundingClientRect(),
        isVisible: isElementVisible(element),
      };
    });

    return {
      success: true,
      selector: selector,
      totalFound: elements.length,
      returned: elementsData.length,
      elements: elementsData,
      pageInfo: {
        url: window.location.href,
        title: document.title,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("Error inspecting HTML CSS:", error);
    return {
      success: false,
      error: error.message,
      selector: selector,
    };
  }
}

/**
 * Get matched CSS rules for an element
 * @param {Element} element - DOM element
 * @returns {Array} Array of matched CSS rules
 */
function getMatchedCSSRules(element) {
  const rules = [];

  try {
    // Get all stylesheets (including external and internal)
    const styleSheets = Array.from(document.styleSheets);

    styleSheets.forEach((sheet, sheetIndex) => {
      try {
        // Skip cross-origin stylesheets that we can't access
        if (sheet.href && new URL(sheet.href).origin !== window.location.origin) {
          return;
        }

        const cssRules = Array.from(sheet.cssRules || []);

        cssRules.forEach((rule, ruleIndex) => {
          try {
            // Handle different types of rules
            if (rule instanceof CSSStyleRule) {
              // Regular CSS rule
              if (element.matches(rule.selectorText)) {
                rules.push({
                  type: 'style',
                  selector: rule.selectorText,
                  cssText: rule.cssText,
                  style: extractRuleProperties(rule.style),
                  source: getStylesheetSource(sheet, sheetIndex),
                  specificity: calculateSpecificity(rule.selectorText),
                  ruleIndex: ruleIndex,
                  sheetIndex: sheetIndex
                });
              }
            } else if (rule instanceof CSSMediaRule) {
              // Media query rule
              if (window.matchMedia(rule.conditionText).matches) {
                const mediaRules = Array.from(rule.cssRules || []);
                mediaRules.forEach((mediaRule, mediaRuleIndex) => {
                  if (mediaRule instanceof CSSStyleRule && element.matches(mediaRule.selectorText)) {
                    rules.push({
                      type: 'media',
                      selector: mediaRule.selectorText,
                      mediaQuery: rule.conditionText,
                      cssText: mediaRule.cssText,
                      style: extractRuleProperties(mediaRule.style),
                      source: getStylesheetSource(sheet, sheetIndex),
                      specificity: calculateSpecificity(mediaRule.selectorText),
                      ruleIndex: mediaRuleIndex,
                      sheetIndex: sheetIndex
                    });
                  }
                });
              }
            } else if (rule instanceof CSSSupportsRule) {
              // @supports rule
              if (CSS.supports(rule.conditionText)) {
                const supportRules = Array.from(rule.cssRules || []);
                supportRules.forEach((supportRule, supportRuleIndex) => {
                  if (supportRule instanceof CSSStyleRule && element.matches(supportRule.selectorText)) {
                    rules.push({
                      type: 'supports',
                      selector: supportRule.selectorText,
                      supportsCondition: rule.conditionText,
                      cssText: supportRule.cssText,
                      style: extractRuleProperties(supportRule.style),
                      source: getStylesheetSource(sheet, sheetIndex),
                      specificity: calculateSpecificity(supportRule.selectorText),
                      ruleIndex: supportRuleIndex,
                      sheetIndex: sheetIndex
                    });
                  }
                });
              }
            }
          } catch (ruleError) {
            console.warn("Error processing CSS rule:", ruleError);
          }
        });
      } catch (sheetError) {
        console.warn("Error processing stylesheet:", sheetError);
      }
    });

    // Sort rules by specificity (most specific first)
    rules.sort((a, b) => b.specificity - a.specificity);

  } catch (error) {
    console.error("Error getting matched CSS rules:", error);
  }

  return rules;
}

/**
 * Extract properties from a CSSStyleDeclaration
 * @param {CSSStyleDeclaration} style - CSS style declaration
 * @returns {Object} Object with property-value pairs
 */
function extractRuleProperties(style) {
  const properties = {};

  try {
    for (let i = 0; i < style.length; i++) {
      const property = style[i];
      const value = style.getPropertyValue(property);
      const priority = style.getPropertyPriority(property);

      properties[property] = {
        value: value,
        important: priority === 'important'
      };
    }
  } catch (error) {
    console.error("Error extracting rule properties:", error);
  }

  return properties;
}

/**
 * Get stylesheet source information
 * @param {CSSStyleSheet} sheet - Stylesheet
 * @param {number} index - Stylesheet index
 * @returns {Object} Source information
 */
function getStylesheetSource(sheet, index) {
  return {
    href: sheet.href || null,
    title: sheet.title || null,
    disabled: sheet.disabled || false,
    index: index,
    type: sheet.href ? 'external' : 'internal'
  };
}

/**
 * Calculate CSS selector specificity
 * @param {string} selector - CSS selector
 * @returns {number} Specificity score
 */
function calculateSpecificity(selector) {
  let specificity = 0;

  try {
    // Count ID selectors
    const idMatches = selector.match(/#[a-zA-Z0-9_-]+/g);
    if (idMatches) {
      specificity += idMatches.length * 100;
    }

    // Count class selectors, attribute selectors, and pseudo-classes
    const classMatches = selector.match(/\.[a-zA-Z0-9_-]+|\[[^\]]+\]|:[a-zA-Z0-9_-]+(?!\()/g);
    if (classMatches) {
      specificity += classMatches.length * 10;
    }

    // Count element selectors and pseudo-elements
    const elementMatches = selector.match(/[a-zA-Z0-9_-]+|::[a-zA-Z0-9_-]+/g);
    if (elementMatches) {
      specificity += elementMatches.length;
    }
  } catch (error) {
    console.error("Error calculating specificity:", error);
  }

  return specificity;
}

/**
 * Get comprehensive styles for an element
 * @param {Element} element - DOM element
 * @param {boolean} includeComputed - Include computed styles
 * @param {boolean} includePseudo - Include pseudo-element styles
 * @returns {Object} Styles object
 */
function getElementStyles(element, includeComputed = true, includePseudo = false) {
  const styles = {
    inline: {},
    computed: {},
    pseudo: {},
  };

  try {
    // Get inline styles
    const inlineStyle = element.style;
    for (let i = 0; i < inlineStyle.length; i++) {
      const property = inlineStyle[i];
      styles.inline[property] = inlineStyle.getPropertyValue(property);
    }

    // Get computed styles if requested
    if (includeComputed) {
      const computedStyle = window.getComputedStyle(element);
      const importantProperties = [
        'display', 'position', 'width', 'height', 'margin', 'padding',
        'background', 'color', 'font-family', 'font-size', 'font-weight',
        'border', 'border-radius', 'box-shadow', 'opacity', 'visibility',
        'z-index', 'float', 'clear', 'overflow', 'text-align', 'line-height'
      ];

      importantProperties.forEach(property => {
        const value = computedStyle.getPropertyValue(property);
        if (value && value !== 'initial' && value !== 'normal') {
          styles.computed[property] = value;
        }
      });
    }

    // Get pseudo-element styles if requested
    if (includePseudo) {
      const pseudoElements = ['::before', '::after', ':hover', ':focus', ':active'];
      pseudoElements.forEach(pseudo => {
        try {
          const pseudoStyle = window.getComputedStyle(element, pseudo);
          const pseudoStyles = {};

          ['content', 'display', 'position', 'width', 'height', 'background', 'color'].forEach(property => {
            const value = pseudoStyle.getPropertyValue(property);
            if (value && value !== 'initial' && value !== 'normal') {
              pseudoStyles[property] = value;
            }
          });

          if (Object.keys(pseudoStyles).length > 0) {
            styles.pseudo[pseudo] = pseudoStyles;
          }
        } catch (e) {
          // Pseudo-element might not exist, ignore
        }
      });
    }

  } catch (error) {
    console.error("Error getting element styles:", error);
  }

  return styles;
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
 * Check if an element is visible
 * @param {Element} element - DOM element
 * @returns {boolean} True if element is visible
 */
function isElementVisible(element) {
  try {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      element.offsetWidth > 0 &&
      element.offsetHeight > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Handle INSPECT_HTML_CSS message
 * @param {Object} request - The message request
 * @param {Object} sender - The message sender
 * @param {Function} sendResponse - Response callback
 */
function handleInspectHTMLCSS(request, sender, sendResponse) {
  console.log("handleInspectHTMLCSS called with:", request);

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

    console.log("Inspecting CSS for selector:", request.selector);
    const result = inspectHTMLCSS(
      request.selector,
      request.maxResults || 5,
      request.includeComputed !== false, // Default to true
      request.includePseudo || false
    );
    console.log("CSS inspection result:", result);

    sendResponse(result);
  } catch (error) {
    console.error("Error in handleInspectHTMLCSS:", error);
    console.error("Error stack:", error.stack);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
} 