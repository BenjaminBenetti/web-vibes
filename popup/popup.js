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
    this.vibeSettingsModal = new window.VibeSettingsModal();
    this.initializeElements();
  }

  initializeElements() {
    this.currentSiteEl = document.getElementById("currentSite");
    this.hacksListEl = document.getElementById("hacksList");
    this.emptyStateEl = document.getElementById("emptyState");
    this.addHackBtn = document.getElementById("addHackBtn");
    this.exportBtn = document.getElementById("exportBtn");
    this.importBtn = document.getElementById("importBtn");
    this.exportModal = null;

    if (this.exportBtn) {
      this.exportBtn.addEventListener("click", () => this.openExportModal());
    }
    if (this.importBtn) {
      this.importBtn.addEventListener("click", () => this.openImportModal());
    }
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

    // Create the hack header
    const hackHeader = document.createElement("div");
    hackHeader.className = "hack-header";

    // Hack name (inline editable)
    const hackName = document.createElement("h4");
    hackName.className = "hack-name";
    hackName.textContent = this.escapeHtml(hack.name);
    hackName.tabIndex = 0;
    hackName.style.cursor = "pointer";
    hackName.title = "Click to edit name";

    // Inline edit handler
    hackName.addEventListener("click", (e) => {
      e.stopPropagation();
      // Prevent multiple inputs
      if (hackHeader.querySelector(".hack-name-edit")) return;
      const input = document.createElement("input");
      input.type = "text";
      input.value = hack.name;
      input.className = "hack-name hack-name-edit";
      input.style.width = Math.max(120, hackName.offsetWidth) + "px";
      hackName.replaceWith(input);
      input.focus();
      input.select();

      // Save on blur or Enter
      const save = async () => {
        const newName = input.value.trim();
        if (newName && newName !== hack.name) {
          await this.hackService.updateHack(this.currentHostname, hack.id, { name: newName });
        }
        // Re-render the list
        const { hacks } = await this.hackService.getHacksForCurrentSite();
        this.renderHacksList(hacks);
      };
      input.addEventListener("blur", save);
      input.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
          input.blur();
        } else if (ev.key === "Escape") {
          // Cancel edit
          const { hacks } = this.hackService.getHacksForCurrentSite();
          this.renderHacksList(hacks);
        }
      });
    });

    hackHeader.appendChild(hackName);

    // Status container (right side)
    const statusContainer = document.createElement("div");
    statusContainer.className = "hack-status-container";

    // Status
    const status = document.createElement("span");
    status.className = `hack-status ${hack.enabled ? "enabled" : "disabled"}`;
    status.textContent = hack.enabled ? "Enabled" : "Disabled";
    statusContainer.appendChild(status);

    // Add clock icon next to status if applyDelay is set
    if (hack.applyDelay && hack.applyDelay > 0) {
      const clockIcon = document.createElement("span");
      clockIcon.className = "material-icons delay-icon";
      clockIcon.textContent = "schedule";
      clockIcon.title = `Apply delay: ${hack.applyDelay}ms`;
      statusContainer.appendChild(clockIcon);
    }

    hackHeader.appendChild(statusContainer);

    hackItem.appendChild(hackHeader);

    // Description
    const desc = document.createElement("p");
    desc.className = "hack-description";
    desc.textContent = hack.description;
    hackItem.appendChild(desc);

    // Actions
    const actions = document.createElement("div");
    actions.className = "hack-actions";
    actions.innerHTML = `
      <label class="toggle-switch">
        <input type="checkbox" ${hack.enabled ? "checked" : ""} data-action="toggle">
        <span class="toggle-slider"></span>
      </label>
      <button class="btn btn-small btn-secondary" data-action="edit" title="Edit in Chat">
        <span class="material-icons">edit</span>
      </button>
      <button class="btn btn-small btn-secondary" data-action="settings" title="Vibe Settings">
        <span class="material-icons">settings</span>
      </button>
      <button class="btn btn-small btn-danger" data-action="delete">
        🗑️ Delete
      </button>
    `;
    hackItem.appendChild(actions);

    // Disable only edit and settings buttons if hack is disabled
    if (!hack.enabled) {
      // Disable only edit and settings buttons
      ['edit', 'settings'].forEach(action => {
        const btn = actions.querySelector(`[data-action="${action}"]`);
        if (btn) {
          btn.disabled = true;
          btn.tabIndex = -1;
          btn.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          });
        }
      });
      // Do NOT disable the toggle switch or delete button!
    } else {
      // Add event listener for edit button
      actions.querySelector('[data-action="edit"]').addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleEditHack(hack);
      });

      // Add event listener for settings button
      actions.querySelector('[data-action="settings"]').addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleVibeSettings(hack);
      });
    }

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
    // Reload the current website
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.tabs.reload(tab.id);
    }
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
    // Navigate to the AI chat page
    window.location.href = "chat/chat.html";
  }

  handleSettingsNavigation() {
    // Navigate to settings page
    window.location.href = "settings/settings.html";
  }

  async handleVibeSettings(hack) {
    this.vibeSettingsModal.openModal(
      hack,
      this.currentHostname,
      async (hackId, updateData) => {
        await this.hackService.updateHack(this.currentHostname, hackId, updateData);
        const { hacks } = await this.hackService.getHacksForCurrentSite();
        this.renderHacksList(hacks);
        // Reload the current website to apply changes
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id) {
          chrome.tabs.reload(tab.id);
        }
      }
    );
  }

  /**
   * Navigate to chat page for editing the selected vibe
   * @param {Hack} hack - Hack object to edit
   */
  handleEditHack(hack) {
    // Navigate to chat page with hackId query parameter
    window.location.href = `chat/chat.html?hackId=${encodeURIComponent(hack.id)}`;
  }

  async openExportModal() {
    // Remove existing modal if present
    if (this.exportModal) this.exportModal.remove();
    const { hacks } = await this.hackService.getHacksForCurrentSite();
    // Create modal
    const modal = document.createElement("div");
    modal.className = "export-modal-overlay";
    modal.innerHTML = `
      <div class="export-modal">
        <h3>Export Vibes</h3>
        <form id="exportVibesForm">
          <div class="export-vibes-list">
            ${hacks.map(hack => `
              <label class="export-vibe-item">
                <input type="checkbox" name="vibe" value="${hack.id}" ${hack.enabled ? 'checked' : ''}>
                <span>${this.escapeHtml(hack.name)}</span>
              </label>
            `).join("")}
          </div>
          <div class="export-modal-actions">
            <button type="button" class="btn btn-secondary" id="cancelExportBtn">Cancel</button>
            <button type="submit" class="btn btn-primary" id="finalizeExportBtn">Export</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    this.exportModal = modal;
    // Cancel button
    modal.querySelector("#cancelExportBtn").onclick = () => modal.remove();
    // Form submit
    modal.querySelector("#exportVibesForm").onsubmit = async (e) => {
      e.preventDefault();
      const checked = Array.from(modal.querySelectorAll('input[name="vibe"]:checked')).map(cb => cb.value);
      const selected = hacks.filter(h => checked.includes(h.id));
      this.downloadVibes(selected);
      modal.remove();
    };
  }

  downloadVibes(vibes) {
    const data = JSON.stringify(vibes, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "web-vibes.grove";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  async openImportModal() {
    // Open import page in a new Chrome extension tab instead of modal
    // This prevents the popup from closing when file picker is used
    // Pass the current hostname as a URL parameter
    const importUrl = chrome.runtime.getURL('popup/import/import.html') +
      `?hostname=${encodeURIComponent(this.currentHostname)}`;
    chrome.tabs.create({
      url: importUrl
    });
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
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
    this.ui = new PopupUI(this.hackService);
    this.eventHandler = new PopupEventHandler(this.ui);
  }

  async initialize() {
    await this.loadTheme();
    await this.ui.render();
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
