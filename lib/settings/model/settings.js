/**
 * Data model for extension settings
 * Represents user preferences and configuration options
 */
class Settings {
  constructor(
    selectedTheme = "cosmic-purple",
    selectedAI = "Select AI",
    createdAt = new Date(),
    updatedAt = new Date()
  ) {
    this.selectedTheme = selectedTheme;
    this.selectedAI = selectedAI;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  /**
   * Update the selected theme
   * @param {string} themeKey - The theme identifier
   */
  setTheme(themeKey) {
    this.selectedTheme = themeKey;
    this.updatedAt = new Date();
  }

  /**
   * Update the selected AI provider
   * @param {string} aiProvider - The AI provider identifier
   */
  setAI(aiProvider) {
    if (!Settings.isValidAI(aiProvider)) {
      throw new Error(`AI provider '${aiProvider}' not found`);
    }
    this.selectedAI = aiProvider;
    this.updatedAt = new Date();
  }

  /**
   * Set AI credentials for a specific provider
   * @param {string} aiProvider
   * @param {Object} credentials
   */
  setAICredentials(aiProvider, credentials) {
    if (aiProvider === "Gemini") {
      const geminiService = getGeminiSettingsService();
      if (geminiService && credentials) {
        // Delegate all logic to GeminiSettingsService
        return geminiService.setAll(credentials);
      }
      return Promise.resolve();
    }
    // No-op for other providers
    return Promise.resolve();
  }

  /**
   * Get AI credentials for a specific provider
   * @param {string} aiProvider
   * @returns {Object}
   */
  getAICredentials(aiProvider) {
    if (aiProvider === "Gemini") {
      const geminiService = getGeminiSettingsService();
      if (geminiService) {
        // Return the full GeminiSettings model object
        return geminiService.getAllSettings();
      }
      return Promise.resolve({});
    }
    // No-op for other providers
    return Promise.resolve({});
  }

  /**
   * Clear AI credentials for a specific provider
   * @param {string} aiProvider
   */
  clearAICredentials(aiProvider) {
    if (aiProvider === "Gemini") {
      const geminiService = getGeminiSettingsService();
      if (geminiService) {
        // Reset to defaults (clears all Gemini settings)
        return geminiService.resetToDefaults();
      }
      return Promise.resolve();
    }
    // No-op for other providers
    return Promise.resolve();
  }

  /**
   * Convert the settings to a plain object for storage
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      selectedTheme: this.selectedTheme,
      selectedAI: this.selectedAI,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  /**
   * Create a Settings instance from stored data
   * @param {Object} data - The stored settings data
   * @returns {Settings} New Settings instance
   */
  static fromJSON(data) {
    return new Settings(
      data.selectedTheme,
      data.selectedAI || "Select AI",
      data.createdAt ? new Date(data.createdAt) : new Date(),
      data.updatedAt ? new Date(data.updatedAt) : new Date()
    );
  }

  /**
   * Get default settings instance
   * @returns {Settings} Default settings
   */
  static getDefaults() {
    return new Settings();
  }

  /**
   * Validate settings data before creating instance
   * @param {Object} data - The settings data to validate
   * @returns {boolean} True if valid
   */
  static isValid(data) {
    return (
      data &&
      typeof data.selectedTheme === "string" &&
      data.selectedTheme.length > 0 &&
      (data.selectedAI === undefined || typeof data.selectedAI === "string")
    );
  }

  /**
   * Get available theme configurations
   * @returns {Object} Available themes with their properties
   */
  static getAvailableThemes() {
    return {
      "cosmic-purple": {
        name: "Cosmic Purple",
        gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        description: "The classic cosmic purple",
      },
      "ocean-breeze": {
        name: "Ocean Breeze",
        gradient:
          "linear-gradient(135deg, #667db6 0%, #0082c8 25%, #0052d4 50%, #667db6 100%)",
        description: "Deep ocean blues",
      },
      "sunset-glow": {
        name: "Sunset Glow",
        gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
        description: "Warm sunset colors",
      },
      "aurora-green": {
        name: "Aurora Green",
        gradient:
          "linear-gradient(135deg, #a8edea 0%, #fed6e3 25%, #d299c2 50%, #fef9d7 100%)",
        description: "Northern lights inspiration",
      },
      "midnight-blue": {
        name: "Midnight Blue",
        gradient: "linear-gradient(135deg, #2c3e50 0%, #3498db 100%)",
        description: "Deep midnight blues",
      },
      "tropical-sunset": {
        name: "Tropical Sunset",
        gradient:
          "linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)",
        description: "Tropical paradise vibes",
      },
      "royal-purple": {
        name: "Royal Purple",
        gradient: "linear-gradient(135deg, #8360c3 0%, #2ebf91 100%)",
        description: "Regal purple and teal",
      },
      "fire-blaze": {
        name: "Fire Blaze",
        gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        description: "Fiery pink and red",
      },
      "dark-cosmic": {
        name: "Dark Cosmic",
        gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        description: "Cosmic purple with dark background",
      },
      "dark-ocean": {
        name: "Dark Ocean",
        gradient:
          "linear-gradient(135deg, #667db6 0%, #0082c8 25%, #0052d4 50%, #667db6 100%)",
        description: "Ocean depths with dark background",
      },
      "dark-emerald": {
        name: "Dark Emerald",
        gradient: "linear-gradient(135deg, #059669 0%, #065f46 100%)",
        description: "Emerald forest with dark background",
      },
      "dark-crimson": {
        name: "Dark Crimson",
        gradient: "linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)",
        description: "Deep crimson with dark background",
      },
      "dark-violet": {
        name: "Dark Violet",
        gradient: "linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)",
        description: "Rich violet with dark background",
      },
    };
  }

  /**
   * Get theme data for the current selected theme
   * @returns {Object} Current theme configuration
   */
  getCurrentThemeData() {
    const themes = Settings.getAvailableThemes();
    return themes[this.selectedTheme] || themes["cosmic-purple"];
  }

  /**
   * Check if a theme key is valid
   * @param {string} themeKey - Theme identifier to validate
   * @returns {boolean} True if theme exists
   */
  static isValidTheme(themeKey) {
    return themeKey in Settings.getAvailableThemes();
  }

  /**
   * Get available AI providers
   * @returns {Object} Available AI providers with their properties
   */
  static getAvailableAIs() {
    return {
      "Select AI": {
        name: "Select AI",
        description: "Choose an AI provider to get started",
        requiresApiKey: false,
      },
      Gemini: {
        name: "Gemini",
        description: "Google's advanced AI assistant",
        requiresApiKey: true,
        credentialFields: {
          apiKey: {
            type: "password",
            label: "API Key",
            placeholder: "Enter your Gemini API key",
            required: true,
          },
        },
      },
    };
  }

  /**
   * Get AI provider data for the current selected AI
   * @returns {Object} Current AI provider configuration
   */
  getCurrentAIData() {
    const aiProviders = Settings.getAvailableAIs();
    return aiProviders[this.selectedAI] || aiProviders["Select AI"];
  }

  /**
   * Check if an AI provider key is valid
   * @param {string} aiKey - AI provider identifier to validate
   * @returns {boolean} True if AI provider exists
   */
  static isValidAI(aiKey) {
    return aiKey in Settings.getAvailableAIs();
  }

  /**
   * Check if the current AI configuration is complete
   * For Gemini, this is handled by GeminiSettingsService in the UI/service layer.
   * @returns {boolean|Promise<boolean>} True if AI is properly configured (non-Gemini only)
   */
  isAIConfigured() {
    if (this.selectedAI === "Select AI") {
      return false;
    }
    // For Gemini and other providers, expect the service layer to handle configuration check
    return true;
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = Settings;
} else {
  window.Settings = Settings;
}

// Helper to get GeminiSettingsService singleton from window (browser context)
function getGeminiSettingsService() {
  if (typeof window !== "undefined" && window.GeminiSettingsService && window.GeminiSettingsRepository) {
    if (!window._geminiSettingsServiceInstance) {
      window._geminiSettingsServiceInstance = new window.GeminiSettingsService(new window.GeminiSettingsRepository());
    }
    return window._geminiSettingsServiceInstance;
  }
  return null;
}
