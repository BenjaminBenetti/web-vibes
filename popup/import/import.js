/**
 * Import Page Controller
 * Handles the import functionality in a separate Chrome extension page
 */
class ImportPage {
  constructor() {
    this.hackRepository = new HackRepository();
    this.hackService = new HackService(this.hackRepository);
    this.settingsRepository = new SettingsRepository();
    this.settingsService = new SettingsService(this.settingsRepository);
    this.currentHostname = "";
    this.vibesData = null;
    this.initializeElements();
    this.setupEventListeners();
  }

  initializeElements() {
    this.currentSiteEl = document.getElementById("currentSite");
    this.fileUploadArea = document.getElementById("fileUploadArea");
    this.fileInput = document.getElementById("importFile");
    this.importPreview = document.getElementById("importPreview");
    this.importVibesList = document.getElementById("importVibesList");
    this.importBtn = document.getElementById("importBtn");
    this.cancelBtn = document.getElementById("cancelBtn");
    this.backBtn = document.getElementById("backBtn");
  }

  setupEventListeners() {
    // Back button
    this.backBtn.addEventListener("click", () => {
      window.close();
    });

    // Cancel button
    this.cancelBtn.addEventListener("click", () => {
      window.close();
    });

    // File upload area click handler
    this.fileUploadArea.addEventListener("click", () => {
      this.fileInput.click();
    });

    // Drag and drop handlers
    this.fileUploadArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      this.fileUploadArea.classList.add("drag-over");
    });

    this.fileUploadArea.addEventListener("dragleave", () => {
      this.fileUploadArea.classList.remove("drag-over");
    });

    this.fileUploadArea.addEventListener("drop", (e) => {
      e.preventDefault();
      this.fileUploadArea.classList.remove("drag-over");
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFileSelect(files[0]);
      }
    });

    // File input change handler
    this.fileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        this.handleFileSelect(e.target.files[0]);
      }
    });

    // Import button
    this.importBtn.addEventListener("click", async () => {
      if (!this.vibesData) return;

      try {
        this.importBtn.disabled = true;
        this.importBtn.innerHTML = `
          <span class="material-icons">hourglass_empty</span>
          Importing...
        `;

        await this.hackService.importVibes(this.currentHostname, this.vibesData);

        this.showNotification("Vibes imported successfully!", "success");

        // Close the window after a short delay
        setTimeout(() => {
          window.close();
        }, 1500);

      } catch (error) {
        console.error("Import failed:", error);
        this.importBtn.disabled = false;
        this.importBtn.innerHTML = `
          <span class="material-icons">file_upload</span>
          Import Vibes
        `;
        this.showNotification("Failed to import vibes: " + error.message, "error");
      }
    });
  }

  async initialize() {
    await this.loadTheme();
    await this.loadCurrentSite();
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

  async loadCurrentSite() {
    try {
      // Get hostname from URL parameters instead of current tab
      const urlParams = new URLSearchParams(window.location.search);
      const hostname = urlParams.get('hostname');

      if (hostname) {
        this.currentHostname = hostname;
        this.currentSiteEl.textContent = hostname;
      } else {
        // Fallback: try to get from current tab if no parameter provided
        const { hostname: currentHostname } = await this.hackService.getHacksForCurrentSite();
        this.currentHostname = currentHostname;
        this.currentSiteEl.textContent = currentHostname;
      }
    } catch (error) {
      console.error("Error loading current site:", error);
      this.currentSiteEl.textContent = "Unknown site";
    }
  }

  async handleFileSelect(file) {
    try {
      const text = await file.text();
      this.vibesData = JSON.parse(text);

      // Extract vibes array
      let vibesArray = [];
      if (Array.isArray(this.vibesData)) {
        vibesArray = this.vibesData;
      } else if (this.vibesData.hacks && Array.isArray(this.vibesData.hacks)) {
        vibesArray = this.vibesData.hacks;
      } else {
        throw new Error("Invalid .grove file format");
      }

      // Validate vibes
      const validVibes = vibesArray.filter(vibe => Hack.isValid(vibe));

      if (validVibes.length === 0) {
        throw new Error("No valid vibes found in the file");
      }

      // Show preview
      this.importVibesList.innerHTML = validVibes.map(vibe => `
        <div class="import-vibe-item">
          <span class="material-icons">style</span>
          <span class="vibe-name">${this.escapeHtml(vibe.name)}</span>
          <span class="vibe-status ${vibe.enabled ? 'enabled' : 'disabled'}">
            ${vibe.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      `).join("");

      this.importPreview.style.display = "block";
      this.importBtn.disabled = false;
      this.fileUploadArea.innerHTML = `
        <span class="material-icons">check_circle</span>
        <p>${file.name}</p>
        <small>${validVibes.length} vibes ready to import</small>
      `;

    } catch (error) {
      console.error("Error reading file:", error);
      this.fileUploadArea.innerHTML = `
        <span class="material-icons" style="color: #ef4444;">error</span>
        <p>Invalid file format</p>
        <small>Please select a valid .grove file</small>
      `;
      this.importBtn.disabled = true;
    }
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show notification message
   * @param {string} message - Message to show
   * @param {string} type - Type of notification (success, error, info)
   */
  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
}

// Initialize the import page when DOM is loaded
document.addEventListener("DOMContentLoaded", async function () {
  console.log("Web Vibes import page loaded");

  const importPage = new ImportPage();
  await importPage.initialize();
}); 