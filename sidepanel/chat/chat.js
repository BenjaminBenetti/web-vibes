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

    // Create agentic service with standard tools
    if (typeof createAgenticService === "function") {
      this.agenticService = createAgenticService(
        this.aiService,
        this.hackService,
        this.settingsService
      );
    } else {
      // Fallback manual creation if utility function not available
      const tools = [
        new SaveJSTool(this.hackService),
        new ReadJSTool(this.hackService),
        new SaveCSSTool(this.hackService),
        new ReadCSSTool(this.hackService),
        new SearchWebsiteHTMLTool(),
        new InspectHTMLCSSTool(),
        new SearchWebsiteByKeywordTool(),
        new SearchWebsiteJavaScriptTool(),
      ];
      this.agenticService = new AgenticService(
        this.aiService,
        tools,
        this.settingsService
      );
    }

    this.aiChatManager = new AIChatManager(
      this.agenticService,
      this.hackService,
      this.settingsService
    );
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
    this.backBtn.addEventListener("click", async () => {
      await this.handleBackNavigation();
    });

    // Settings navigation
    if (this.goToSettingsBtn) {
      this.goToSettingsBtn.addEventListener("click", async () => {
        await this.handleSettingsNavigation();
      });
    }

    // Handle page unload to re-enable hack if user closes extension or navigates away
    window.addEventListener("beforeunload", async () => {
      if (this.aiChatManager && this.aiChatManager.isEditingExistingHack) {
        // Note: In beforeunload, async operations may not complete reliably
        // But we'll attempt to re-enable the hack anyway
        try {
          await this.aiChatManager.clearCurrentHack();
        } catch (error) {
          console.error("Error re-enabling hack during page unload:", error);
        }
      }
    });
  }

  async initialize() {
    await this.loadTheme();
    await this.initializeAI();
    await this.loadCurrentSite();

    // Check for hackId in query parameters to edit existing vibe
    const urlParams = new URLSearchParams(window.location.search);
    const hackId = urlParams.get("hackId");
    if (hackId) {
      await this.setCurrentHack(hackId);
    }

    // Update chat page title based on mode
    const titleEl = document.getElementById("chatPageTitle");
    if (titleEl) {
      if (hackId && this.aiChatManager.isEditingExistingHack) {
        titleEl.textContent = "Edit Vibe with AI";
      } else {
        titleEl.textContent = "Create New Vibe with AI";
      }
    }

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

  async handleBackNavigation() {
    // Clear current hack to re-enable it if needed before leaving
    if (this.aiChatManager && this.aiChatManager.isEditingExistingHack) {
      await this.aiChatManager.clearCurrentHack();
    }
    // Navigate back to main sidepanel
    window.location.href = "../sidepanel.html";
  }

  async handleSettingsNavigation() {
    // Clear current hack to re-enable it if needed before leaving
    if (this.aiChatManager && this.aiChatManager.isEditingExistingHack) {
      await this.aiChatManager.clearCurrentHack();
    }
    // Navigate to settings page
    window.location.href = "../settings/settings.html";
  }

  /**
   * Set the current hack for editing
   * @param {string} hackId - The ID of the hack to edit
   */
  async setCurrentHack(hackId) {
    try {
      // Find the hack
      const { hacks } = await this.hackService.getHacksForCurrentSite();
      const hack = hacks.find((h) => h.id === hackId);

      if (!hack) {
        console.error("Hack not found:", hackId);
        return false;
      }

      // Set current hack in chat manager
      await this.aiChatManager.setCurrentHack(hack);
      return true;
    } catch (error) {
      console.error("Error setting current hack:", error);
      return false;
    }
  }

  /**
   * Clear the current hack
   */
  async clearCurrentHack() {
    await this.aiChatManager.clearCurrentHack();
  }

  /**
   * Check if agentic service is ready
   */
  isReady() {
    return this.aiChatManager.isReady();
  }
}

// Initialize the chat page when DOM is loaded
document.addEventListener("DOMContentLoaded", async function () {
  console.log("Web Vibes chat page loaded");

  const chatPage = new ChatPage();
  await chatPage.initialize();
});
