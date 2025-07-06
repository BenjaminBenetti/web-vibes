/**
 * Service Worker Handler for Web Vibes Content Script
 * Handles service worker blocking and CSP-related operations
 */

/**
 * Service Worker Blocker Handler
 * Manages service worker blocking for sites with CSP busting enabled
 */
class ServiceWorkerBlocker {
  constructor() {
    this.hostname = window.location.hostname;
    this.isBlocked = false;
    this.originalRegister = null;
    this.originalGetRegistration = null;
    this.originalGetRegistrations = null;
    this.cleanupInterval = null;
  }

  /**
   * Initialize service worker blocking
   * @returns {Promise<void>}
   */
  async init() {
    try {
      // Check if CSP busting is enabled for this hostname
      const isCSPEnabled = await this.isCSPBustingEnabled();

      if (isCSPEnabled) {
        await this.blockServiceWorkers();
        console.log(
          `[Web Vibes] Service worker blocking enabled for ${this.hostname}`
        );
      }
    } catch (error) {
      console.error(
        "[Web Vibes] Error initializing service worker blocker:",
        error
      );
    }
  }

  /**
   * Check if CSP busting is enabled for the current hostname
   * @returns {Promise<boolean>}
   */
  async isCSPBustingEnabled() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "CHECK_CSP_ENABLED",
          hostname: this.hostname,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("Runtime error:", chrome.runtime.lastError);
            resolve(false);
          } else {
            resolve(response?.enabled || false);
          }
        }
      );
    });
  }

  /**
   * Block service workers by overriding navigator.serviceWorker methods
   * @returns {Promise<void>}
   */
  async blockServiceWorkers() {
    if (this.isBlocked || !("serviceWorker" in navigator)) {
      return;
    }

    this.isBlocked = true;

    // Store original methods
    this.originalRegister = navigator.serviceWorker.register;
    this.originalGetRegistration = navigator.serviceWorker.getRegistration;
    this.originalGetRegistrations = navigator.serviceWorker.getRegistrations;

    // Override register method to prevent new registrations
    navigator.serviceWorker.register = (...args) => {
      console.log(
        "[Web Vibes] Blocked service worker registration attempt:",
        args[0]
      );
      return Promise.reject(
        new Error(
          "Service worker registration blocked by Web Vibes CSP busting"
        )
      );
    };

    // Override getRegistration to return null (no registrations)
    navigator.serviceWorker.getRegistration = () => {
      console.log("[Web Vibes] Blocked service worker getRegistration call");
      return Promise.resolve(undefined);
    };

    // Override getRegistrations to return empty array
    navigator.serviceWorker.getRegistrations = () => {
      console.log("[Web Vibes] Blocked service worker getRegistrations call");
      return Promise.resolve([]);
    };

    // Unregister any existing service workers
    await this.unregisterExistingServiceWorkers();

    // Set up periodic cleanup to catch any service workers that might slip through
    this.setupPeriodicCleanup();
  }

  /**
   * Unregister all existing service workers
   * @returns {Promise<void>}
   */
  async unregisterExistingServiceWorkers() {
    try {
      if (!this.originalGetRegistrations) {
        return;
      }

      const registrations = await this.originalGetRegistrations.call(
        navigator.serviceWorker
      );

      for (const registration of registrations) {
        try {
          await registration.unregister();
          console.log(
            "[Web Vibes] Unregistered existing service worker:",
            registration.scope
          );
        } catch (error) {
          console.warn(
            "[Web Vibes] Failed to unregister service worker:",
            error
          );
        }
      }

      if (registrations.length > 0) {
        console.log(
          `[Web Vibes] Unregistered ${registrations.length} existing service workers`
        );
      }
    } catch (error) {
      console.error(
        "[Web Vibes] Error unregistering existing service workers:",
        error
      );
    }
  }

  /**
   * Set up periodic cleanup to catch any service workers that might slip through
   */
  setupPeriodicCleanup() {
    // Clear any existing interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Check every 1 seconds for new service workers and unregister them
    this.cleanupInterval = setInterval(async () => {
      try {
        if (!this.originalGetRegistrations) {
          return;
        }

        const registrations = await this.originalGetRegistrations.call(
          navigator.serviceWorker
        );

        for (const registration of registrations) {
          try {
            await registration.unregister();
            console.log(
              "[Web Vibes] Cleanup: Unregistered service worker:",
              registration.scope
            );
          } catch (error) {
            console.warn(
              "[Web Vibes] Cleanup: Failed to unregister service worker:",
              error
            );
          }
        }
      } catch (error) {
        // Silently ignore errors during periodic cleanup
      }
    }, 1000);
  }

  /**
   * Restore original service worker functionality
   */
  restoreServiceWorkers() {
    if (!this.isBlocked || !("serviceWorker" in navigator)) {
      return;
    }

    if (this.originalRegister) {
      navigator.serviceWorker.register = this.originalRegister;
    }
    if (this.originalGetRegistration) {
      navigator.serviceWorker.getRegistration = this.originalGetRegistration;
    }
    if (this.originalGetRegistrations) {
      navigator.serviceWorker.getRegistrations = this.originalGetRegistrations;
    }

    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.isBlocked = false;
    console.log(
      `[Web Vibes] Service worker functionality restored for ${this.hostname}`
    );
  }

  /**
   * Toggle service worker blocking on/off
   * @param {boolean} enabled - Whether to enable or disable blocking
   */
  async toggleBlocking(enabled) {
    if (enabled) {
      await this.blockServiceWorkers();
    } else {
      this.restoreServiceWorkers();
    }
  }
}

// Global instance
let serviceWorkerBlocker = null;

/**
 * Handle service worker blocking toggle message
 * @param {Object} request - The message request
 * @param {Object} sender - The message sender
 * @param {Function} sendResponse - Response callback
 */
async function handleToggleServiceWorkerBlocking(
  request,
  sender,
  sendResponse
) {
  try {
    if (!serviceWorkerBlocker) {
      serviceWorkerBlocker = new ServiceWorkerBlocker();
    }

    await serviceWorkerBlocker.toggleBlocking(request.enabled);

    sendResponse({
      success: true,
      message: `Service worker blocking ${
        request.enabled ? "enabled" : "disabled"
      }`,
    });
  } catch (error) {
    console.error("[Web Vibes] Error toggling service worker blocking:", error);
    sendResponse({
      success: false,
      error: error.message,
    });
  }
}

// Also run immediately in case DOMContentLoaded has already fired
if (!serviceWorkerBlocker) {
  serviceWorkerBlocker = new ServiceWorkerBlocker();
  serviceWorkerBlocker.init();
}

// Export for use by message router
window.webVibesServiceWorkerBlocker = serviceWorkerBlocker;
