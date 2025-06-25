// Popup script for Web Vibes Chrome Extension
// UI and event handling classes for the popup interface
// Data models and services are loaded from separate files

/**
 * UI Manager for rendering and updating the popup interface
 */
class PopupUI {
  constructor(hackService) {
    this.hackService = hackService;
    this.currentHostname = "";
    this.initializeElements();
  }

  initializeElements() {
    this.currentSiteEl = document.getElementById("currentSite");
    this.hacksListEl = document.getElementById("hacksList");
    this.emptyStateEl = document.getElementById("emptyState");
    this.addHackBtn = document.getElementById("addHackBtn");
  }

  async render() {
    const { hostname, hacks } = await this.hackService.getHacksForCurrentSite();
    this.currentHostname = hostname;

    this.updateCurrentSite(hostname);
    this.renderHacksList(hacks);
  }

  updateCurrentSite(hostname) {
    this.currentSiteEl.textContent = hostname;
  }

  renderHacksList(hacks) {
    if (hacks.length === 0) {
      this.showEmptyState();
      return;
    }

    this.hideEmptyState();
    this.hacksListEl.innerHTML = "";

    hacks.forEach((hack) => {
      const hackElement = this.createHackElement(hack);
      this.hacksListEl.appendChild(hackElement);
    });
  }

  createHackElement(hack) {
    const hackItem = document.createElement("div");
    hackItem.className = `hack-item ${hack.enabled ? "" : "disabled"}`;
    hackItem.dataset.hackId = hack.id;

    hackItem.innerHTML = `
      <div class="hack-header">
        <h4 class="hack-name">${this.escapeHtml(hack.name)}</h4>
        <span class="hack-status ${hack.enabled ? "enabled" : "disabled"}">
          ${hack.enabled ? "Enabled" : "Disabled"}
        </span>
      </div>
      <p class="hack-description">${this.escapeHtml(hack.description)}</p>
      <div class="hack-actions">
        <label class="toggle-switch">
          <input type="checkbox" ${
            hack.enabled ? "checked" : ""
          } data-action="toggle">
          <span class="toggle-slider"></span>
        </label>
        <button class="btn btn-small btn-danger" data-action="delete">
          🗑️ Delete
        </button>
      </div>
    `;

    return hackItem;
  }

  showEmptyState() {
    this.emptyStateEl.classList.remove("hidden");
    this.hacksListEl.classList.remove("has-items");
  }

  hideEmptyState() {
    this.emptyStateEl.classList.add("hidden");
    this.hacksListEl.classList.add("has-items");
  }

  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  async handleHackToggle(hackId) {
    const hacks = await this.hackService.toggleHack(
      this.currentHostname,
      hackId
    );
    this.renderHacksList(hacks);
  }

  async handleHackDelete(hackId) {
    if (confirm("Are you sure you want to delete this hack?")) {
      const hacks = await this.hackService.deleteHack(
        this.currentHostname,
        hackId
      );
      this.renderHacksList(hacks);
    }
  }

  handleAddHack() {
    // Open the AI chat modal
    const modal = document.getElementById("addVibeModal");
    if (modal) {
      modal.classList.add("visible");
      // Initialize AI chat when modal opens
      window.aiChatManager.initializeChat();
    }
  }

  handleSettingsNavigation() {
    // Navigate to settings page
    window.location.href = "settings/settings.html";
  }
}

/**
 * Event handler for popup interactions
 */
class PopupEventHandler {
  constructor(ui) {
    this.ui = ui;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Add hack button
    this.ui.addHackBtn.addEventListener("click", () => {
      this.ui.handleAddHack();
    });

    // Settings button
    const settingsBtn = document.getElementById("settingsBtn");
    if (settingsBtn) {
      settingsBtn.addEventListener("click", () => {
        this.ui.handleSettingsNavigation();
      });
    }

    // Hack actions (toggle/delete)
    this.ui.hacksListEl.addEventListener("click", (e) => {
      const hackItem = e.target.closest(".hack-item");
      if (!hackItem) return;

      const hackId = hackItem.dataset.hackId;
      const action = e.target.dataset.action;

      if (action === "delete") {
        this.ui.handleHackDelete(hackId);
      }
    });

    this.ui.hacksListEl.addEventListener("change", (e) => {
      if (e.target.dataset.action === "toggle") {
        const hackItem = e.target.closest(".hack-item");
        const hackId = hackItem.dataset.hackId;
        this.ui.handleHackToggle(hackId);
      }
    });
  }
}

/**
 * Main application controller
 */
class PopupApp {
  constructor() {
    this.hackRepository = new HackRepository();
    this.hackService = new HackService(this.hackRepository);
    this.settingsRepository = new SettingsRepository();
    this.settingsService = new SettingsService(this.settingsRepository);
    this.aiService = new AIService(this.settingsService);
    this.ui = new PopupUI(this.hackService);
    this.eventHandler = new PopupEventHandler(this.ui);
    this.aiChatManager = new AIChatManager(this.aiService, this.hackService);

    // Make available globally for modal access
    window.aiChatManager = this.aiChatManager;
    window.popupUI = this.ui;
  }

  async initialize() {
    await this.loadTheme();
    await this.initializeAI();
    await this.ui.render();
  }

  async initializeAI() {
    try {
      await this.aiService.initialize();
    } catch (error) {
      console.warn("AI service initialization failed:", error);
    }
  }

  async loadTheme() {
    try {
      const settings = await this.settingsService.getAllSettings();
      const themeKey = settings.selectedTheme;

      // Remove all existing theme classes
      document.body.classList.remove(
        ...Object.keys(this.settingsService.getAvailableThemes()).map(
          (key) => `theme-${key}`
        )
      );

      // Add the current theme class
      document.body.classList.add(`theme-${themeKey}`);
    } catch (error) {
      console.error("Error loading theme:", error);
    }
  }
}

// Initialize the popup when DOM is loaded
document.addEventListener("DOMContentLoaded", async function () {
  console.log("Web Vibes popup loaded");

  const app = new PopupApp();
  await app.initialize();
});
