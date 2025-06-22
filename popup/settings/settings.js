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
    this.themeSelector = document.getElementById("themeSelector");
  }

  async render() {
    // Load and display current settings
    const settings = await this.settingsService.getAllSettings();
    console.log("Current settings:", settings);

    // Render theme selector
    await this.renderThemeSelector();

    // Apply current theme
    await this.applyCurrentTheme();
  }

  async renderThemeSelector() {
    const themes = this.settingsService.getAvailableThemes();
    const currentSettings = await this.settingsService.getAllSettings();
    const selectedTheme = currentSettings.selectedTheme;

    this.themeSelector.innerHTML = "";

    Object.entries(themes).forEach(([themeKey, themeData]) => {
      const themeOption = document.createElement("div");
      themeOption.className = `theme-option ${
        selectedTheme === themeKey ? "selected" : ""
      }`;
      themeOption.dataset.theme = themeKey;

      themeOption.innerHTML = `
        <div class="theme-preview" style="background: ${themeData.gradient}">
          <div class="theme-name">${themeData.name}</div>
          <div class="theme-checkmark">
            <span class="material-icons">check</span>
          </div>
        </div>
      `;

      themeOption.addEventListener("click", () =>
        this.handleThemeSelection(themeKey)
      );
      this.themeSelector.appendChild(themeOption);
    });
  }

  async handleThemeSelection(themeKey) {
    try {
      await this.settingsService.setTheme(themeKey);
      await this.renderThemeSelector(); // Re-render to update selection
      await this.applyCurrentTheme(); // Apply the new theme
      this.showMessage(
        `Theme changed to ${
          this.settingsService.getAvailableThemes()[themeKey].name
        }`
      );
    } catch (error) {
      console.error("Error setting theme:", error);
      this.showMessage("Error changing theme");
    }
  }

  async applyCurrentTheme() {
    const theme = await this.settingsService.getCurrentTheme();
    const themeKey = (await this.settingsService.getAllSettings())
      .selectedTheme;

    // Remove all existing theme classes
    document.body.classList.remove(
      ...Object.keys(this.settingsService.getAvailableThemes()).map(
        (key) => `theme-${key}`
      )
    );

    // Add the current theme class
    document.body.classList.add(`theme-${themeKey}`);
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
    this.settingsRepository = new SettingsRepository();
    this.settingsService = new SettingsService(this.settingsRepository);
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
