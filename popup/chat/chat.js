// Chat page script for Web Vibes Chrome Extension
// Handles AI chat functionality for creating new vibes

/**
 * Chat page controller
 */
class ChatPage {
  constructor() {
    this.hackRepository = new HackRepository();
    this.hackService = new HackService(this.hackRepository);
    this.settingsRepository = new SettingsRepository();
    this.settingsService = new SettingsService(this.settingsRepository);
    this.aiService = new AIService(this.settingsService);
    this.aiChatManager = new AIChatManager(this.aiService, this.hackService);
    this.currentHostname = "";

    this.initializeElements();
    this.setupEventListeners();
  }

  initializeElements() {
    this.currentSiteEl = document.getElementById("currentSite");
    this.backBtn = document.getElementById("backBtn");
    this.goToSettingsBtn = document.getElementById("goToSettings");
  }

  setupEventListeners() {
    // Back button navigation
    this.backBtn.addEventListener("click", () => {
      this.handleBackNavigation();
    });

    // Settings navigation
    if (this.goToSettingsBtn) {
      this.goToSettingsBtn.addEventListener("click", () => {
        this.handleSettingsNavigation();
      });
    }
  }

  async initialize() {
    await this.loadTheme();
    await this.initializeAI();
    await this.loadCurrentSite();
    this.aiChatManager.initializeChat();
  }

  async initializeAI() {
    try {
      await this.aiService.initialize();
    } catch (error) {
      console.warn("AI service initialization failed:", error);
    }
  }

  async loadCurrentSite() {
    try {
      const { hostname } = await this.hackService.getHacksForCurrentSite();
      this.currentHostname = hostname;
      this.currentSiteEl.textContent = hostname;
    } catch (error) {
      console.error("Error loading current site:", error);
      this.currentSiteEl.textContent = "Unknown site";
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

  handleBackNavigation() {
    // Navigate back to main popup
    window.location.href = "../popup.html";
  }

  handleSettingsNavigation() {
    // Navigate to settings page
    window.location.href = "../settings/settings.html";
  }
}

// Initialize the chat page when DOM is loaded
document.addEventListener("DOMContentLoaded", async function () {
  console.log("Web Vibes chat page loaded");

  const chatPage = new ChatPage();
  await chatPage.initialize();
});
