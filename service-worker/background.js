/**
 * Web Vibes Chrome Extension - Service Worker (Background Script)
 * 
 * Handles automatic application of saved hacks when users visit sites
 * that have previously saved hacks. This runs in the background and
 * monitors tab updates to apply hacks automatically.
 */

// Import required classes (these will be available in the service worker context)
// Note: Service workers have limited access to extension files, so we'll use
// chrome.storage directly and minimal dependencies

/**
 * Service worker for automatic hack application
 */
class WebVibesServiceWorker {
  constructor() {
    this.storageKey = "webVibesHacks";
    this.initialized = false;
  }

  /**
   * Initialize the service worker
   */
  async init() {
    if (this.initialized) return;

    console.log("Web Vibes Service Worker initialized");

    // Set up event listeners
    this.setupEventListeners();

    this.initialized = true;
  }

  /**
   * Set up Chrome extension event listeners
   */
  setupEventListeners() {
    // Listen for tab updates to apply hacks automatically
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdate(tabId, changeInfo, tab);
    });

    // Listen for tab activation to apply hacks
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivated(activeInfo);
    });

    // Listen for messages from content scripts or popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
    });
  }

  /**
   * Handle tab updates to apply hacks automatically
   * @param {number} tabId - The tab ID
   * @param {Object} changeInfo - Information about the change
   * @param {chrome.tabs.Tab} tab - The tab object
   */
  async handleTabUpdate(tabId, changeInfo, tab) {
    // Only apply hacks when the page is fully loaded
    if (changeInfo.status === 'complete' && tab.url) {
      try {
        const url = new URL(tab.url);
        const hostname = url.hostname;

        // Skip chrome://, chrome-extension://, and other special URLs
        if (this.isValidUrlForHacks(tab.url)) {
          await this.applyHacksForSite(tabId, hostname);
        }
      } catch (error) {
        console.error("Error handling tab update:", error);
      }
    }
  }

  /**
   * Handle tab activation to apply hacks
   * @param {Object} activeInfo - Information about the activated tab
   */
  async handleTabActivated(activeInfo) {
    try {
      const tab = await chrome.tabs.get(activeInfo.tabId);
      if (tab.url && this.isValidUrlForHacks(tab.url)) {
        const url = new URL(tab.url);
        const hostname = url.hostname;
        await this.applyHacksForSite(activeInfo.tabId, hostname);
      }
    } catch (error) {
      console.error("Error handling tab activation:", error);
    }
  }

  /**
   * Handle messages from content scripts or popup
   * @param {Object} request - The message request
   * @param {Object} sender - The message sender
   * @param {Function} sendResponse - Response callback
   */
  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.type) {
        case 'GET_HACKS_FOR_SITE':
          const hacks = await this.getHacksForSite(request.hostname);
          sendResponse({ success: true, hacks });
          break;

        case 'APPLY_HACKS_FOR_SITE':
          const result = await this.applyHacksForSite(request.tabId, request.hostname);
          sendResponse({ success: true, result });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error("Error handling message:", error);
      sendResponse({ success: false, error: error.message });
    }

    return true; // Keep the message channel open for async response
  }

  /**
   * Check if a URL is valid for applying hacks
   * @param {string} url - The URL to check
   * @returns {boolean} True if valid for hacks
   */
  isValidUrlForHacks(url) {
    try {
      const urlObj = new URL(url);
      // Skip chrome://, chrome-extension://, and other special protocols
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Get hacks for a specific site
   * @param {string} hostname - The hostname to get hacks for
   * @returns {Promise<Array>} Array of hack data
   */
  async getHacksForSite(hostname) {
    try {
      const result = await chrome.storage.local.get([this.storageKey]);
      const allHacks = result[this.storageKey] || {};
      const siteHacks = allHacks[hostname] || [];

      // Return only enabled hacks
      return siteHacks.filter(hack => hack.enabled !== false);
    } catch (error) {
      console.error("Error getting hacks for site:", error);
      return [];
    }
  }

  /**
   * Apply hacks for a specific site to a tab
   * @param {number} tabId - The tab ID to apply hacks to
   * @param {string} hostname - The hostname to get hacks for
   * @returns {Promise<Object>} Result of the application
   */
  async applyHacksForSite(tabId, hostname) {
    try {
      const hacks = await this.getHacksForSite(hostname);

      if (hacks.length === 0) {
        console.log(`No enabled hacks found for ${hostname}`);
        return { applied: 0, hacks: [] };
      }

      console.log(`Applying ${hacks.length} hacks for ${hostname}`);

      // Apply each hack to the tab
      const results = [];
      for (const hack of hacks) {
        try {
          const result = await this.applyHackToTab(tabId, hack);
          results.push(result);
        } catch (error) {
          console.error(`Error applying hack ${hack.id}:`, error);
          results.push({ success: false, hackId: hack.id, error: error.message });
        }
      }

      const successful = results.filter(r => r.success).length;
      console.log(`Successfully applied ${successful}/${hacks.length} hacks for ${hostname}`);

      return {
        applied: successful,
        total: hacks.length,
        results,
        hostname
      };
    } catch (error) {
      console.error("Error applying hacks for site:", error);
      throw error;
    }
  }

  /**
   * Apply a single hack to a tab
   * @param {number} tabId - The tab ID to apply the hack to
   * @param {Object} hack - The hack data to apply
   * @returns {Promise<Object>} Result of the application
   */
  async applyHackToTab(tabId, hack) {
    try {
      // Prepare hack data for content script
      const hackData = {
        id: hack.id,
        name: hack.name,
        description: hack.description,
        cssCode: hack.cssCode || "",
        jsCode: hack.jsCode || "",
        preview: false, // Auto-applied hacks are permanent
        timestamp: new Date().toISOString(),
      };

      let cssResult = null;
      let jsResult = null;

      // Apply CSS via content script message
      if (hackData.cssCode && hackData.cssCode.trim()) {
        try {
          cssResult = await chrome.tabs.sendMessage(tabId, {
            type: 'APPLY_HACK',
            hack: hackData,
          });
        } catch (messageError) {
          // Content script might not be ready yet, try again after a delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            cssResult = await chrome.tabs.sendMessage(tabId, {
              type: 'APPLY_HACK',
              hack: hackData,
            });
          } catch (retryError) {
            console.warn(`Could not apply CSS for hack ${hack.id}:`, retryError.message);
            cssResult = { success: false, error: retryError.message };
          }
        }
      }

      // Apply JavaScript via chrome.scripting.executeScript()
      if (hackData.jsCode && hackData.jsCode.trim()) {
        try {
          const injectionResults = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            world: 'MAIN',
            func: (codeString, hackId, hackName) => {
              try {
                // Keep simple tracking reference
                window.__webVibesRunningHacks = window.__webVibesRunningHacks || {};

                // If this hack was already injected, attempt to clean it first
                if (window.__webVibesRunningHacks[hackId]?.cleanup instanceof Function) {
                  try {
                    window.__webVibesRunningHacks[hackId].cleanup();
                  } catch (cleanupErr) {
                    console.warn('Web Vibes: cleanup of previous hack failed', cleanupErr);
                  }
                }

                // Wrap the supplied code into a function
                const wrappedFn = new Function(`return (function(){\n${codeString}\n})()`);
                const possibleReturn = wrappedFn();

                // If the injected code returns a function, treat it as a cleanup handler
                if (typeof possibleReturn === 'function') {
                  window.__webVibesRunningHacks[hackId] = { cleanup: possibleReturn };
                }

                console.log(`Web Vibes: Auto-applied JavaScript for hack "${hackName}"`);
                return { success: true };
              } catch (err) {
                console.error(`Web Vibes: error auto-applying hack "${hackName}":`, err);
                return { success: false, error: err.message };
              }
            },
            args: [hackData.jsCode, hackData.id, hackData.name]
          });

          jsResult = injectionResults[0]?.result || { success: true };

        } catch (scriptingError) {
          console.error('Error injecting JavaScript via executeScript:', scriptingError);
          jsResult = {
            success: false,
            error: scriptingError.message
          };
        }
      }

      // Determine overall success
      const cssSuccess = !hackData.cssCode || !hackData.cssCode.trim() || (cssResult && cssResult.success);
      const jsSuccess = !hackData.jsCode || !hackData.jsCode.trim() || (jsResult && jsResult.success);
      const overallSuccess = cssSuccess && jsSuccess;

      return {
        success: overallSuccess,
        hackId: hack.id,
        hackName: hack.name,
        cssSuccess,
        jsSuccess,
        cssResult,
        jsResult
      };

    } catch (error) {
      console.error(`Error applying hack ${hack.id}:`, error);
      return {
        success: false,
        hackId: hack.id,
        error: error.message
      };
    }
  }
}

// Initialize the service worker
const serviceWorker = new WebVibesServiceWorker();
serviceWorker.init().catch(error => {
  console.error("Failed to initialize Web Vibes service worker:", error);
}); 