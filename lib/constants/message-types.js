/**
 * Web Vibes Chrome Extension - Message Type Constants
 *
 * Centralized constants for all Chrome extension message types used for
 * communication between popup, content scripts, and background scripts.
 *
 * This ensures consistency and maintainability across the entire extension.
 */

/**
 * Message types for hack operations
 */
const HACK_MESSAGES = {
  /** Apply a hack (CSS/JS) to the current page */
  APPLY_HACK: "APPLY_HACK",

  /** Remove a specific hack from the current page */
  REMOVE_HACK: "REMOVE_HACK",

  /** Notify content script that hacks have been updated */
  HACKS_UPDATED: "HACKS_UPDATED",

  /** Get hacks for a specific site from service worker */
  GET_HACKS_FOR_SITE: "GET_HACKS_FOR_SITE",

  /** Apply all hacks for a specific site */
  APPLY_HACKS_FOR_SITE: "APPLY_HACKS_FOR_SITE",
};

/**
 * Message types for page analysis operations
 */
const PAGE_ANALYSIS_MESSAGES = {
  /** Search for HTML content using CSS selectors */
  SEARCH_WEBSITE_HTML: "SEARCH_WEBSITE_HTML",

  /** Inspect CSS styles applied to HTML elements */
  INSPECT_HTML_CSS: "INSPECT_HTML_CSS",

  /** Search webpage content by keyword with context */
  SEARCH_WEBSITE_BY_KEYWORD: "SEARCH_WEBSITE_BY_KEYWORD",

  /** Search JavaScript content on the webpage */
  SEARCH_WEBSITE_JAVASCRIPT: "SEARCH_WEBSITE_JAVASCRIPT",
};

/**
 * Message types for element targeting operations
 */
const ELEMENT_TARGETING_MESSAGES = {
  /** Start element targeting mode */
  START_ELEMENT_TARGETING: "START_ELEMENT_TARGETING",

  /** Stop element targeting mode */
  STOP_ELEMENT_TARGETING: "STOP_ELEMENT_TARGETING",

  /** Element has been targeted by user */
  ELEMENT_TARGETED: "ELEMENT_TARGETED",

  /** Element targeting was cancelled */
  TARGETING_CANCELLED: "TARGETING_CANCELLED",
};

/**
 * All message types combined for easy access
 */
const MESSAGE_TYPES = {
  ...HACK_MESSAGES,
  ...PAGE_ANALYSIS_MESSAGES,
  ...ELEMENT_TARGETING_MESSAGES,
};

/**
 * Helper function to validate message types
 * @param {string} messageType - The message type to validate
 * @returns {boolean} True if the message type is valid
 */
function isValidMessageType(messageType) {
  return Object.values(MESSAGE_TYPES).includes(messageType);
}

/**
 * Helper function to get all message types as an array
 * @returns {string[]} Array of all message type strings
 */
function getAllMessageTypes() {
  return Object.values(MESSAGE_TYPES);
}

// For content scripts that may use ES6 modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    HACK_MESSAGES,
    PAGE_ANALYSIS_MESSAGES,
    ELEMENT_TARGETING_MESSAGES,
    MESSAGE_TYPES,
    isValidMessageType,
    getAllMessageTypes,
  };
}
