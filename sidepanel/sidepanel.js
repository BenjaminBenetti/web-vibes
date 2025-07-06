// Side Panel script for Web Vibes Chrome Extension
// UI and event handling classes for the side panel interface
// Data models and services are loaded from separate files

/**
 * UI Manager for rendering and updating the side panel interface
 */
class SidePanelUI {
  constructor(hackService, cspService) {
    this.hackService = hackService;
    this.cspService = cspService;
    this.currentHostname = "";
    this.vibeSettingsModal = new window.VibeSettingsModal();
    this.dragAndDropInitialized = false;
    this.initializeElements();
  }

  initializeElements() {
    this.currentSiteEl = document.getElementById("currentSite");
    this.hacksListEl = document.getElementById("hacksList");
    this.emptyStateEl = document.getElementById("emptyState");
    this.addHackBtn = document.getElementById("addHackBtn");
    this.exportBtn = document.getElementById("exportBtn");
    this.importBtn = document.getElementById("importBtn");
    this.cspToggle = document.getElementById("cspToggle");
    this.serviceWorkerToggle = document.getElementById("serviceWorkerToggle");
    this.exportModal = null;

    if (this.exportBtn) {
      this.exportBtn.addEventListener("click", () => this.openExportModal());
    }
    if (this.importBtn) {
      this.importBtn.addEventListener("click", () => this.openImportModal());
    }
    if (this.cspToggle) {
      this.cspToggle.addEventListener("change", () => this.handleCSPToggle());
    }
    if (this.serviceWorkerToggle) {
      this.serviceWorkerToggle.addEventListener("change", () =>
        this.handleServiceWorkerToggle()
      );
    }
  }

  async render() {
    const { hostname, hacks } = await this.hackService.getHacksForCurrentSite();
    this.currentHostname = hostname;

    this.updateCurrentSite(hostname);
    await this.updateCSPToggle(hostname);
    await this.updateServiceWorkerToggle(hostname);
    this.renderHacksList(hacks);
    this.setupDragAndDrop(); // Set up drag and drop after rendering
  }

  setupDragAndDrop() {
    // Only set up event listeners once
    if (this.dragAndDropInitialized) return;
    this.dragAndDropInitialized = true;

    let draggedElement = null;
    let draggedOverElement = null;
    let orderSaved = false; // track if we already persisted the new order

    this.hacksListEl.addEventListener("dragstart", (e) => {
      const hackItem = e.target.closest(".hack-item");
      if (!hackItem) return;

      draggedElement = hackItem;
      hackItem.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/html", hackItem.innerHTML);

      orderSaved = false; // reset flag on new drag
    });

    this.hacksListEl.addEventListener("dragend", async (e) => {
      const hackItem = e.target.closest(".hack-item");
      if (hackItem) {
        hackItem.classList.remove("dragging");
      }

      // If drop handler didn't save, persist order here
      if (!orderSaved) {
        const newOrder = Array.from(
          this.hacksListEl.querySelectorAll(".hack-item")
        ).map((item) => item.dataset.hackId);

        try {
          const updatedHacks =
            await this.hackService.updateHackRanksForCurrentSite(newOrder);
          // Re-render with updated order to ensure consistency
          this.renderHacksList(updatedHacks);
        } catch (error) {
          console.error("Error updating hack order on dragend:", error);
        }
      }
    });

    this.hacksListEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      const afterElement = this.getDragAfterElement(
        this.hacksListEl,
        e.clientY
      );

      if (afterElement == null) {
        this.hacksListEl.appendChild(draggedElement);
      } else {
        this.hacksListEl.insertBefore(draggedElement, afterElement);
      }
    });

    this.hacksListEl.addEventListener("dragenter", (e) => {
      const hackItem = e.target.closest(".hack-item");
      if (hackItem && hackItem !== draggedElement) {
        hackItem.classList.add("drag-over");
        draggedOverElement = hackItem;
      }
    });

    this.hacksListEl.addEventListener("dragleave", (e) => {
      const hackItem = e.target.closest(".hack-item");
      if (hackItem) {
        hackItem.classList.remove("drag-over");
      }
    });

    this.hacksListEl.addEventListener("drop", async (e) => {
      e.preventDefault();

      // Remove all drag-over classes
      this.hacksListEl.querySelectorAll(".hack-item").forEach((item) => {
        item.classList.remove("drag-over");
      });

      // Get the new order of hack IDs
      const newOrder = Array.from(
        this.hacksListEl.querySelectorAll(".hack-item")
      ).map((item) => item.dataset.hackId);

      // Update the ranks in the backend
      try {
        const updatedHacks =
          await this.hackService.updateHackRanksForCurrentSite(newOrder);
        orderSaved = true;
        // Re-render with the updated hacks
        this.renderHacksList(updatedHacks);
      } catch (error) {
        console.error("Error updating hack order:", error);
        // Re-render to restore original order on error
        const { hacks } = await this.hackService.getHacksForCurrentSite();
        this.renderHacksList(hacks);
      }
    });
  }

  getDragAfterElement(container, y) {
    const draggableElements = [
      ...container.querySelectorAll(".hack-item:not(.dragging)"),
    ];

    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      { offset: Number.NEGATIVE_INFINITY }
    ).element;
  }

  updateCurrentSite(hostname) {
    this.currentSiteEl.textContent = hostname;
  }

  async updateCSPToggle(hostname) {
    if (!this.cspToggle) return;

    try {
      const isEnabled = await this.cspService.isCSPBustingEnabled(hostname);
      this.cspToggle.checked = isEnabled;
    } catch (error) {
      console.error("Error updating CSP toggle:", error);
      this.cspToggle.checked = false;
    }
  }

  async updateServiceWorkerToggle(hostname) {
    if (!this.serviceWorkerToggle) return;

    try {
      const isEnabled = await this.cspService.isServiceWorkerBlockingEnabled(
        hostname
      );
      this.serviceWorkerToggle.checked = isEnabled;
    } catch (error) {
      console.error("Error updating service worker toggle:", error);
      this.serviceWorkerToggle.checked = false;
    }
  }

  async handleCSPToggle() {
    if (!this.currentHostname) return;

    try {
      const isEnabled = this.cspToggle.checked;

      if (isEnabled) {
        await this.cspService.enableCSPBusting(this.currentHostname);
        console.log(`CSP busting enabled for ${this.currentHostname}`);
      } else {
        await this.cspService.disableCSPBusting(this.currentHostname);
        console.log(`CSP busting disabled for ${this.currentHostname}`);
      }

      // Notify content scripts about the change
      await this.notifyContentScriptsOfCSPChange(isEnabled);

      // Reload the current tab to apply CSP changes
      await this.reloadCurrentTab();
    } catch (error) {
      console.error("Error toggling CSP:", error);
      // Revert toggle state on error
      this.cspToggle.checked = !this.cspToggle.checked;
    }
  }

  async handleServiceWorkerToggle() {
    if (!this.currentHostname) return;

    try {
      const isEnabled = this.serviceWorkerToggle.checked;

      if (isEnabled) {
        await this.cspService.enableServiceWorkerBlocking(this.currentHostname);
        console.log(
          `Service worker blocking enabled for ${this.currentHostname}`
        );
      } else {
        await this.cspService.disableServiceWorkerBlocking(
          this.currentHostname
        );
        console.log(
          `Service worker blocking disabled for ${this.currentHostname}`
        );
      }

      // Notify content scripts about the change
      await this.notifyContentScriptsOfServiceWorkerChange(isEnabled);

      // Reload the current tab to apply service worker blocking changes
      await this.reloadCurrentTab();
    } catch (error) {
      console.error("Error toggling service worker blocking:", error);
      // Revert toggle state on error
      this.serviceWorkerToggle.checked = !this.serviceWorkerToggle.checked;
    }
  }

  async notifyContentScriptsOfCSPChange(enabled) {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, {
          type: MESSAGE_TYPES.TOGGLE_CSP_BUSTING,
          enabled: enabled,
        });
      }
    } catch (error) {
      // Content script might not be ready yet, which is fine
      console.log(
        "Content script not ready for CSP notification:",
        error.message
      );
    }
  }

  async notifyContentScriptsOfServiceWorkerChange(enabled) {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab) {
        await chrome.tabs.sendMessage(tab.id, {
          type: MESSAGE_TYPES.TOGGLE_SERVICE_WORKER_BLOCKING,
          enabled: enabled,
        });
      }
    } catch (error) {
      // Content script might not be ready yet, which is fine
      console.log(
        "Content script not ready for service worker notification:",
        error.message
      );
    }
  }

  async reloadCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab) {
        await chrome.tabs.reload(tab.id);
      }
    } catch (error) {
      console.error("Error reloading tab:", error);
    }
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

    // Set up drag and drop after rendering the list
    this.setupDragAndDrop();
  }

  createHackElement(hack) {
    const hackItem = document.createElement("div");
    hackItem.className = `hack-item ${hack.enabled ? "" : "disabled"}`;
    hackItem.dataset.hackId = hack.id;
    hackItem.draggable = true; // Make the item draggable

    // Add drag handle
    const dragHandle = document.createElement("div");
    dragHandle.className = "drag-handle";
    dragHandle.innerHTML = '<span class="material-icons">drag_handle</span>';
    dragHandle.title = "Drag to reorder";
    hackItem.appendChild(dragHandle);

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
          await this.hackService.updateHack(this.currentHostname, hack.id, {
            name: newName,
          });
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

    // Description (only show if not empty)
    if (hack.description && hack.description.trim()) {
      const desc = document.createElement("p");
      desc.className = "hack-description";
      desc.textContent = hack.description.trim();
      hackItem.appendChild(desc);
    }

    // Actions
    const actions = document.createElement("div");
    actions.className = "hack-actions";
    actions.innerHTML = `
      <label class="toggle-switch">
        <input type="checkbox" ${
          hack.enabled ? "checked" : ""
        } data-action="toggle">
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
      ["edit", "settings"].forEach((action) => {
        const btn = actions.querySelector(`[data-action="${action}"]`);
        if (btn) {
          btn.disabled = true;
          btn.tabIndex = -1;
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
          });
        }
      });
      // Do NOT disable the toggle switch or delete button!
    } else {
      // Add event listener for edit button
      actions
        .querySelector('[data-action="edit"]')
        .addEventListener("click", (e) => {
          e.stopPropagation();
          this.handleEditHack(hack);
        });

      // Add event listener for settings button
      actions
        .querySelector('[data-action="settings"]')
        .addEventListener("click", (e) => {
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
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
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
    // Navigate to the AI chat page within the side panel
    window.location.href = "chat/chat.html";
  }

  handleSettingsNavigation() {
    // Navigate to settings page within the side panel
    window.location.href = "settings/settings.html";
  }

  async handleVibeSettings(hack) {
    this.vibeSettingsModal.openModal(
      hack,
      this.currentHostname,
      async (hackId, updateData) => {
        await this.hackService.updateHack(
          this.currentHostname,
          hackId,
          updateData
        );
        const { hacks } = await this.hackService.getHacksForCurrentSite();
        this.renderHacksList(hacks);
        // Reload the current website to apply changes
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
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
    // Navigate to chat page with hackId query parameter within the side panel
    window.location.href = `chat/chat.html?hackId=${encodeURIComponent(
      hack.id
    )}`;
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
            ${hacks
              .map(
                (hack) => `
              <label class="export-vibe-item">
                <input type="checkbox" name="vibe" value="${hack.id}" ${
                  hack.enabled ? "checked" : ""
                }>
                <span>${this.escapeHtml(hack.name)}</span>
              </label>
            `
              )
              .join("")}
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
      const checked = Array.from(
        modal.querySelectorAll('input[name="vibe"]:checked')
      ).map((cb) => cb.value);
      const selected = hacks.filter((h) => checked.includes(h.id));
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

    // Use hostname as filename, sanitized for file system compatibility
    const sanitizedHostname = this.sanitizeFilename(this.currentHostname);
    a.download = `${sanitizedHostname}.groove`;

    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  /**
   * Sanitize hostname for use as filename
   * @param {string} hostname - The hostname to sanitize
   * @returns {string} Sanitized filename
   */
  sanitizeFilename(hostname) {
    if (!hostname || hostname === "unknown") {
      return "web-vibes";
    }

    // Replace invalid filename characters with underscores
    // Invalid characters: \ / : * ? " < > |
    return hostname
      .replace(/[\\/:*?"<>|]/g, "_")
      .replace(/^\.+/, "") // Remove leading dots
      .replace(/\.+$/, "") // Remove trailing dots
      .replace(/\s+/g, "_") // Replace spaces with underscores
      .substring(0, 100); // Limit length to 100 characters
  }

  async openImportModal() {
    // Navigate to import page within the side panel
    // Pass the current hostname as a URL parameter
    window.location.href = `import/import.html?hostname=${encodeURIComponent(
      this.currentHostname
    )}`;
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
 * Event handler for side panel interactions
 */
class SidePanelEventHandler {
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
 * Main application controller for side panel
 */
class SidePanelApp {
  constructor() {
    this.hackRepository = new HackRepository();
    this.hackService = new HackService(this.hackRepository);
    this.settingsRepository = new SettingsRepository();
    this.settingsService = new SettingsService(this.settingsRepository);
    this.cspRepository = new CSPRepository();
    this.cspService = new CSPService(this.cspRepository);
    this.ui = new SidePanelUI(this.hackService, this.cspService);
    this.eventHandler = new SidePanelEventHandler(this.ui);
  }

  async initialize() {
    await this.loadTheme();
    await this.initializeCSPRules();
    await this.ui.render();
    // Set up tab change listener to update content when switching tabs
    this.setupTabChangeListener();
  }

  async initializeCSPRules() {
    try {
      await this.cspService.initializeCSPRules();
    } catch (error) {
      console.error("Error initializing CSP rules:", error);
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

  setupTabChangeListener() {
    // Listen for tab changes and update the side panel content
    chrome.tabs.onActivated.addListener(async () => {
      await this.ui.render();
    });

    // Listen for tab updates (URL changes)
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.url) {
        await this.ui.render();
      }
    });
  }
}

// Initialize the side panel when DOM is loaded
document.addEventListener("DOMContentLoaded", async function () {
  console.log("Web Vibes side panel loaded");

  const app = new SidePanelApp();
  await app.initialize();
});
