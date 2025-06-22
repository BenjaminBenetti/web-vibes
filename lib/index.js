/**
 * Web Vibes Library Index
 * Centralized exports for all library modules
 */

// This file provides a centralized way to import all library modules
// Usage: Include this file to get access to all core classes

// Note: Since Chrome extensions don't support ES6 modules,
// we're using global variables. In a future version, we could
// convert to use ES6 modules with a build process.

/**
 * Check if all required classes are loaded
 * @returns {boolean} True if all classes are available
 */
function checkLibraryLoaded() {
  const requiredClasses = ["Hack", "HackRepository", "HackService"];
  const missing = requiredClasses.filter(
    (className) => typeof window[className] === "undefined"
  );

  if (missing.length > 0) {
    console.error("Missing required classes:", missing);
    return false;
  }

  return true;
}

/**
 * Initialize the library and return factory functions
 * @returns {Object} Factory functions for creating service instances
 */
function createWebVibesLibrary() {
  if (!checkLibraryLoaded()) {
    throw new Error("Web Vibes library not fully loaded");
  }

  return {
    createHackService: () => {
      const repository = new HackRepository();
      return new HackService(repository);
    },

    createHack: (
      id,
      name,
      description,
      cssCode,
      jsCode,
      enabled,
      createdAt
    ) => {
      return new Hack(
        id,
        name,
        description,
        cssCode,
        jsCode,
        enabled,
        createdAt
      );
    },

    createHackRepository: () => {
      return new HackRepository();
    },

    // Utility functions
    validateHackData: (hackData) => {
      return (
        hackData &&
        typeof hackData.name === "string" &&
        hackData.name.trim().length > 0 &&
        (typeof hackData.cssCode === "string" ||
          typeof hackData.jsCode === "string")
      );
    },
  };
}

// Make the library available globally
if (typeof window !== "undefined") {
  window.WebVibesLib = {
    create: createWebVibesLibrary,
    checkLoaded: checkLibraryLoaded,
  };
}
