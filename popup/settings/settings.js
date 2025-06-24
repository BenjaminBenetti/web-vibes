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
    this.themeCurrent = document.getElementById("themeCurrent");
    this.themeCurrentPreview = document.getElementById("themeCurrentPreview");
    this.themeExpandBtn = document.getElementById("themeExpandBtn");
    this.themeSelectorWrapper = this.themeSelector.parentElement;

    // AI Settings elements
    this.aiSelector = document.getElementById("aiSelector");
    this.aiCredentialsSection = document.getElementById("aiCredentialsSection");
    this.aiStatus = document.getElementById("aiStatus");
  }

  async render() {
    // Load and display current settings
    const settings = await this.settingsService.getAllSettings();
    console.log("Current settings:", settings);

    // Render theme selector
    await this.renderThemeSelector();

    // Render current theme preview
    await this.renderCurrentTheme();

    // Render AI settings
    await this.renderAISettings();

    // Apply current theme
    await this.applyCurrentTheme();
  }

  async renderCurrentTheme() {
    const themes = this.settingsService.getAvailableThemes();
    const currentSettings = await this.settingsService.getAllSettings();
    const selectedTheme = currentSettings.selectedTheme;
    const currentThemeData = themes[selectedTheme];

    if (currentThemeData) {
      this.themeCurrentPreview.style.background = currentThemeData.gradient;
      this.themeCurrentPreview.innerHTML = `
        <div class="theme-current-name">${currentThemeData.name}</div>
      `;
    }
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
      await this.renderCurrentTheme(); // Update current theme preview
      await this.applyCurrentTheme(); // Apply the new theme
      this.collapseThemeSelector(); // Collapse after selection
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

  toggleThemeSelector() {
    const isExpanded = this.themeSelectorWrapper.classList.contains("expanded");

    if (isExpanded) {
      this.collapseThemeSelector();
    } else {
      this.expandThemeSelector();
    }
  }

  expandThemeSelector() {
    this.themeSelectorWrapper.classList.add("expanded");
    this.themeSelector.style.display = "grid";
  }

  collapseThemeSelector() {
    this.themeSelectorWrapper.classList.remove("expanded");
    this.themeSelector.style.display = "none";
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

  async renderAISettings() {
    const settings = await this.settingsService.getAllSettings();
    const availableAIs = this.settingsService.getAvailableAIs();

    // Render AI selector dropdown
    this.aiSelector.innerHTML = "";
    Object.entries(availableAIs).forEach(([aiKey, aiData]) => {
      const option = document.createElement("option");
      option.value = aiKey;
      option.textContent = aiData.name;
      option.selected = settings.selectedAI === aiKey;
      this.aiSelector.appendChild(option);
    });

    // Render AI credentials section
    await this.renderAICredentials();

    // Render AI status
    await this.renderAIStatus();
  }

  async renderAICredentials() {
    const settings = await this.settingsService.getAllSettings();
    const selectedAI = settings.selectedAI;
    const availableAIs = this.settingsService.getAvailableAIs();
    const aiData = availableAIs[selectedAI];

    // Clear credentials section
    this.aiCredentialsSection.innerHTML = "";

    if (!aiData || !aiData.requiresApiKey || selectedAI === "Select AI") {
      this.aiCredentialsSection.style.display = "none";
      return;
    }

    this.aiCredentialsSection.style.display = "block";

    // Get current credentials
    const credentials = settings.getAICredentials(selectedAI);

    // Create credentials form
    const credentialsForm = document.createElement("div");
    credentialsForm.className = "credentials-form";

    // Add title
    const title = document.createElement("h3");
    title.textContent = `${aiData.name} Configuration`;
    title.style.margin = "0 0 16px 0";
    title.style.fontSize = "14px";
    title.style.fontWeight = "600";
    title.style.color = "var(--text-color)";
    credentialsForm.appendChild(title);

    // Create input fields based on credential fields definition
    Object.entries(aiData.credentialFields || {}).forEach(
      ([fieldName, fieldConfig]) => {
        const fieldContainer = document.createElement("div");
        fieldContainer.className = "credential-field";

        const label = document.createElement("label");
        label.className = "credential-label";
        label.textContent = fieldConfig.label;
        label.htmlFor = `ai-${fieldName}`;

        const input = document.createElement("input");
        input.type = fieldConfig.type || "text";
        input.id = `ai-${fieldName}`;
        input.className = "credential-input";
        input.placeholder = fieldConfig.placeholder || "";
        input.value = credentials[fieldName] || "";
        input.required = fieldConfig.required || false;

        // Add input event listener to save credentials
        input.addEventListener("input", async () => {
          const newCredentials = { ...credentials };
          newCredentials[fieldName] = input.value.trim();
          await this.settingsService.setAICredentials(
            selectedAI,
            newCredentials
          );
          await this.renderAIStatus();
        });

        fieldContainer.appendChild(label);
        fieldContainer.appendChild(input);
        credentialsForm.appendChild(fieldContainer);
      }
    );

    // Add clear credentials button
    const actions = document.createElement("div");
    actions.className = "credential-actions";

    const clearBtn = document.createElement("button");
    clearBtn.className = "btn-clear";
    clearBtn.textContent = "Clear Credentials";
    clearBtn.addEventListener("click", async () => {
      await this.settingsService.clearAICredentials(selectedAI);
      await this.renderAICredentials();
      await this.renderAIStatus();
    });

    actions.appendChild(clearBtn);
    credentialsForm.appendChild(actions);

    this.aiCredentialsSection.appendChild(credentialsForm);
  }

  async renderAIStatus() {
    const settings = await this.settingsService.getAllSettings();
    const isConfigured = settings.isAIConfigured();

    this.aiStatus.innerHTML = "";

    const statusIcon = document.createElement("span");
    statusIcon.className = "material-icons";

    const statusText = document.createElement("span");

    if (isConfigured) {
      this.aiStatus.className = "ai-status configured";
      statusIcon.textContent = "check_circle";
      statusText.textContent = `${settings.selectedAI} is configured and ready to use`;
    } else {
      this.aiStatus.className = "ai-status not-configured";
      statusIcon.textContent = "warning";
      if (settings.selectedAI === "Select AI") {
        statusText.textContent = "Please select an AI provider to get started";
      } else {
        statusText.textContent = `${settings.selectedAI} requires additional configuration`;
      }
    }

    this.aiStatus.appendChild(statusIcon);
    this.aiStatus.appendChild(statusText);
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

    // Theme expand/collapse button
    this.ui.themeCurrent.addEventListener("click", () => {
      this.ui.toggleThemeSelector();
    });

    // Close theme selector when clicking outside
    document.addEventListener("click", (e) => {
      if (!this.ui.themeSelectorWrapper.contains(e.target)) {
        this.ui.collapseThemeSelector();
      }
    });

    // AI selector change
    this.ui.aiSelector.addEventListener("change", async (e) => {
      const selectedAI = e.target.value;
      await this.ui.settingsService.setAI(selectedAI);
      await this.ui.renderAICredentials();
      await this.ui.renderAIStatus();
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
