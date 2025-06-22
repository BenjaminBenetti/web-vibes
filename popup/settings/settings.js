// Settings page script for Web Vibes Chrome Extension
// Handles settings UI and interactions

/**
 * Settings UI Manager
 */
class SettingsUI {
  constructor(settingsService) {
    this.settingsService = settingsService;
    this.initializeElements();
  }

  initializeElements() {
    this.backBtn = document.getElementById("backBtn");
    this.resetSettingsBtn = document.getElementById("resetSettingsBtn");
  }

  async render() {
    // Load and display current settings
    const settings = await this.settingsService.getAllSettings();
    console.log("Current settings:", settings);

    // TODO: Populate UI with settings values
    // This will be implemented when specific settings are added
  }

  async handleResetSettings() {
    if (
      confirm("Are you sure you want to reset all settings to their defaults?")
    ) {
      await this.settingsService.resetToDefaults();
      await this.render(); // Re-render with defaults

      // Show confirmation
      this.showMessage("Settings have been reset to defaults");
    }
  }

  handleBackNavigation() {
    // Navigate back to the main popup
    window.location.href = "../popup.html";
  }

  showMessage(message) {
    // Simple message display - can be enhanced later
    console.log("Settings message:", message);
    // TODO: Add proper toast/notification UI
  }
}

/**
 * Settings Event Handler
 */
class SettingsEventHandler {
  constructor(ui) {
    this.ui = ui;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Back button
    this.ui.backBtn.addEventListener("click", () => {
      this.ui.handleBackNavigation();
    });

    // Reset settings button
    this.ui.resetSettingsBtn.addEventListener("click", () => {
      this.ui.handleResetSettings();
    });

    // TODO: Add listeners for individual setting changes
    // These will be added when specific settings are implemented
  }
}

/**
 * Settings App Controller
 */
class SettingsApp {
  constructor() {
    this.settingsService = new SettingsService();
    this.ui = new SettingsUI(this.settingsService);
    this.eventHandler = new SettingsEventHandler(this.ui);
  }

  async initialize() {
    await this.ui.render();
  }
}

// Initialize the settings page when DOM is loaded
document.addEventListener("DOMContentLoaded", async function () {
  console.log("Web Vibes settings page loaded");

  const app = new SettingsApp();
  await app.initialize();
});
