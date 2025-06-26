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
};

/**
 * All message types combined for easy access
 */
const MESSAGE_TYPES = {
  ...HACK_MESSAGES,
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
    MESSAGE_TYPES,
    isValidMessageType,
    getAllMessageTypes,
  };
}
