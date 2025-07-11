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
    this.cspStorageKey = "csp_settings";
    this.initialized = false;
  }

  /**
   * Initialize the service worker
   */
  async init() {
    if (this.initialized) return;

    console.log("Web Vibes Service Worker initialized");

    // Set up side panel behavior
    await this.setupSidePanel();

    // Set up event listeners
    this.setupEventListeners();

    this.initialized = true;
  }

  /**
   * Set up side panel behavior
   */
  async setupSidePanel() {
    try {
      // Allow users to open the side panel by clicking on the action toolbar icon
      await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
      console.log("Side panel behavior configured");
    } catch (error) {
      console.error("Error setting up side panel:", error);
    }
  }

  /**
   * Set up Chrome extension event listeners
   */
  setupEventListeners() {
    // Listen for messages from content scripts or popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      return this.handleMessage(request, sender, sendResponse);
    });

    // Use webNavigation.onCompleted to apply hacks only on main frame navigations
    chrome.webNavigation.onCompleted.addListener(
      async (details) => {
        if (details.frameId === 0) {
          try {
            const tab = await chrome.tabs.get(details.tabId);
            if (tab.url && this.isValidUrlForHacks(tab.url)) {
              const url = new URL(tab.url);
              const hostname = url.hostname;
              await this.applyHacksForSite(details.tabId, hostname);
            }
          } catch (error) {
            console.error("Error handling webNavigation.onCompleted:", error);
          }
        }
      },
      { url: [{ schemes: ["http", "https"] }] }
    );
  }

  /**
   * Handle messages from content scripts or popup
   * @param {Object} request - The message request
   * @param {Object} sender - The message sender
   * @param {Function} sendResponse - Response callback
   */
  handleMessage(request, sender, sendResponse) {
    try {
      switch (request.type) {
        case "GET_HACKS_FOR_SITE":
          this.getHacksForSite(request.hostname)
            .then((hacks) => {
              sendResponse({ success: true, hacks });
            })
            .catch((error) => {
              sendResponse({ success: false, error: error.message });
            });
          return true;

        case "APPLY_HACKS_FOR_SITE":
          this.applyHacksForSite(request.tabId, request.hostname)
            .then((result) => {
              sendResponse({ success: true, result });
            })
            .catch((error) => {
              sendResponse({ success: false, error: error.message });
            });
          return true;

        case "CHECK_CSP_ENABLED":
          this.isCSPBustingEnabled(request.hostname)
            .then((isEnabled) => {
              sendResponse({ enabled: isEnabled });
            })
            .catch((error) => {
              console.error("Error checking CSP:", error);
              sendResponse({ enabled: false, error: error.message });
            });
          return true;

        case "CHECK_SERVICE_WORKER_BLOCKING_ENABLED":
          this.isServiceWorkerBlockingEnabled(request.hostname)
            .then((isEnabled) => {
              sendResponse({ enabled: isEnabled });
            })
            .catch((error) => {
              console.error("Error checking service worker blocking:", error);
              sendResponse({ enabled: false, error: error.message });
            });
          return true;

        default:
          sendResponse({ success: false, error: "Unknown message type" });
          return false;
      }
    } catch (error) {
      console.error("Error handling message:", error);
      sendResponse({ success: false, error: error.message });
      return false;
    }
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
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
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
      return siteHacks.filter((hack) => hack.enabled !== false);
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

      // Apply each hack to the tab in parallel so delays do not compound
      const rawResults = await Promise.allSettled(
        hacks.map((hack) => this.applyHackToTab(tabId, hack))
      );

      const results = rawResults.map((res, idx) => {
        if (res.status === "fulfilled") {
          return res.value;
        }
        const hack = hacks[idx];
        console.error(`Error applying hack ${hack.id}:`, res.reason);
        return {
          success: false,
          hackId: hack.id,
          error: res.reason?.message || String(res.reason),
        };
      });

      const successful = results.filter((r) => r.success).length;
      console.log(
        `Successfully applied ${successful}/${hacks.length} hacks for ${hostname}`
      );

      return {
        applied: successful,
        total: hacks.length,
        results,
        hostname,
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
      // Respect per-hack apply delay (in milliseconds)
      const delay =
        typeof hack.applyDelay === "number" && hack.applyDelay > 0
          ? hack.applyDelay
          : 0;
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

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
            type: "APPLY_HACK",
            hack: hackData,
          });
        } catch (messageError) {
          // Content script might not be ready yet, try again after a delay
          await new Promise((resolve) => setTimeout(resolve, 1000));
          try {
            cssResult = await chrome.tabs.sendMessage(tabId, {
              type: "APPLY_HACK",
              hack: hackData,
            });
          } catch (retryError) {
            console.warn(
              `Could not apply CSS for hack ${hack.id}:`,
              retryError.message
            );
            cssResult = { success: false, error: retryError.message };
          }
        }
      }

      // Apply JavaScript via chrome.scripting.executeScript()
      if (hackData.jsCode && hackData.jsCode.trim()) {
        try {
          const injectionResults = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            world: "MAIN",
            func: (codeString, hackId, hackName) => {
              try {
                // Keep simple tracking reference
                window.__webVibesRunningHacks =
                  window.__webVibesRunningHacks || {};

                // If this hack was already injected, attempt to clean it first
                if (
                  window.__webVibesRunningHacks[hackId]?.cleanup instanceof
                  Function
                ) {
                  try {
                    window.__webVibesRunningHacks[hackId].cleanup();
                  } catch (cleanupErr) {
                    console.warn(
                      "Web Vibes: cleanup of previous hack failed",
                      cleanupErr
                    );
                  }
                }

                // Wrap the supplied code into a function
                const wrappedFn = new Function(
                  `return (function(){\n${codeString}\n})()`
                );
                const possibleReturn = wrappedFn();

                // If the injected code returns a function, treat it as a cleanup handler
                if (typeof possibleReturn === "function") {
                  window.__webVibesRunningHacks[hackId] = {
                    cleanup: possibleReturn,
                  };
                }

                console.log(
                  `Web Vibes: Auto-applied JavaScript for hack "${hackName}"`
                );
                return { success: true };
              } catch (err) {
                console.error(
                  `Web Vibes: error auto-applying hack "${hackName}":`,
                  err
                );
                return { success: false, error: err.message };
              }
            },
            args: [hackData.jsCode, hackData.id, hackData.name],
          });

          jsResult = injectionResults[0]?.result || { success: true };
        } catch (scriptingError) {
          console.error(
            "Error injecting JavaScript via executeScript:",
            scriptingError
          );
          jsResult = {
            success: false,
            error: scriptingError.message,
          };
        }
      }

      // Determine overall success
      const cssSuccess =
        !hackData.cssCode ||
        !hackData.cssCode.trim() ||
        (cssResult && cssResult.success);
      const jsSuccess =
        !hackData.jsCode ||
        !hackData.jsCode.trim() ||
        (jsResult && jsResult.success);
      const overallSuccess = cssSuccess && jsSuccess;

      return {
        success: overallSuccess,
        hackId: hack.id,
        hackName: hack.name,
        cssSuccess,
        jsSuccess,
        cssResult,
        jsResult,
      };
    } catch (error) {
      console.error(`Error applying hack ${hack.id}:`, error);
      return {
        success: false,
        hackId: hack.id,
        error: error.message,
      };
    }
  }

  /**
   * Check if CSP busting is enabled for a hostname
   * @param {string} hostname - The hostname to check
   * @returns {Promise<boolean>} True if CSP busting is enabled
   */
  async isCSPBustingEnabled(hostname) {
    try {
      const result = await chrome.storage.local.get(this.cspStorageKey);
      const allSettings = result[this.cspStorageKey] || {};

      if (allSettings[hostname]) {
        return allSettings[hostname].enabled || false;
      }

      return false;
    } catch (error) {
      console.error("Error checking CSP settings:", error);
      return false;
    }
  }

  /**
   * Check if service worker blocking is enabled for a hostname
   * @param {string} hostname - The hostname to check
   * @returns {Promise<boolean>} True if service worker blocking is enabled
   */
  async isServiceWorkerBlockingEnabled(hostname) {
    try {
      const result = await chrome.storage.local.get(this.cspStorageKey);
      const allSettings = result[this.cspStorageKey] || {};

      if (allSettings[hostname]) {
        return allSettings[hostname].serviceWorkerBlockingEnabled || false;
      }

      return false;
    } catch (error) {
      console.error("Error checking service worker blocking settings:", error);
      return false;
    }
  }
}

// Initialize the service worker
const serviceWorker = new WebVibesServiceWorker();
serviceWorker.init().catch((error) => {
  console.error("Failed to initialize Web Vibes service worker:", error);
});

chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(async (rule) => {
  console.log("NetRuleMatched ", rule);
  console.log(
    "ActiveRules",
    await chrome.declarativeNetRequest.getDynamicRules()
  );
});
