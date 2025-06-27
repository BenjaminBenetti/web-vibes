/**
 * Vibe Settings Modal Manager
 * Handles the inline modal interface for editing individual vibe settings
 */
class VibeSettingsModal {
  constructor() {
    this.modalElement = null;
    this.currentHack = null;
    this.currentHostname = "";
    this.onSaveCallback = null;
    this.onCloseCallback = null;
  }

  /**
   * Initialize the modal by creating and inserting the HTML
   */
  initialize() {
    if (this.modalElement) return; // Already initialized

    // Create modal element from template
    this.modalElement = this.createModalElement();

    // Insert into body
    document.body.appendChild(this.modalElement);

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Create modal element from template
   * @returns {HTMLElement} The modal element
   */
  createModalElement() {
    const template = `
      <div class="modal-overlay" id="vibeSettingsModal">
        <div class="modal-container">
          <div class="modal-header">
            <h3 id="modalTitle">Vibe Settings</h3>
            <button class="modal-close-btn" id="modalCloseBtn" title="Close">
              <span class="material-icons">close</span>
            </button>
          </div>
          
          <div class="modal-content">
            <div class="form-group">
              <label for="vibeName">Vibe Name</label>
              <input type="text" id="vibeName" class="form-input" placeholder="Enter vibe name">
            </div>
            
            <div class="form-group">
              <label for="vibeDescription">Description</label>
              <textarea id="vibeDescription" class="form-textarea" placeholder="Describe what this vibe does"></textarea>
            </div>

            <div class="form-group">
              <label for="cssCode">CSS Code</label>
              <textarea id="cssCode" class="form-textarea code-editor" placeholder="Enter CSS code here"></textarea>
            </div>
            
            <div class="form-group">
              <label for="jsCode">JavaScript Code</label>
              <textarea id="jsCode" class="form-textarea code-editor" placeholder="Enter JavaScript code here"></textarea>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="vibeEnabled">
                <span class="checkbox-custom"></span>
                Enable this vibe
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" id="cancelBtn">Cancel</button>
            <button class="btn btn-primary" id="saveBtn">
              <span class="material-icons">save</span>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    `;

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = template;
    return tempDiv.firstElementChild;
  }

  /**
   * Setup event listeners for the modal
   */
  setupEventListeners() {
    // Close modal events
    const closeBtn = this.modalElement.querySelector('#modalCloseBtn');
    const cancelBtn = this.modalElement.querySelector('#cancelBtn');
    const saveBtn = this.modalElement.querySelector('#saveBtn');

    closeBtn.addEventListener('click', () => this.closeModal());
    cancelBtn.addEventListener('click', () => this.closeModal());
    saveBtn.addEventListener('click', () => this.saveChanges());

    // Close on overlay click
    this.modalElement.addEventListener('click', (e) => {
      if (e.target === this.modalElement) {
        this.closeModal();
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (this.isOpen() && e.key === 'Escape') {
        this.closeModal();
      } else if (this.isOpen() && e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.saveChanges();
      }
    });
  }

  /**
   * Open the modal with hack data
   * @param {Object} hack - The hack object to edit
   * @param {string} hostname - The current hostname
   * @param {Function} onSave - Callback when save is successful
   * @param {Function} onClose - Callback when modal is closed
   */
  openModal(hack, hostname, onSave = null, onClose = null) {
    this.currentHack = hack;
    this.currentHostname = hostname;
    this.onSaveCallback = onSave;
    this.onCloseCallback = onClose;

    // Initialize if needed
    this.initialize();

    // Populate form with hack data
    this.populateForm(hack);

    // Show modal
    this.modalElement.classList.add('show');
    document.body.style.overflow = 'hidden';

    // Focus on first input
    setTimeout(() => {
      const nameInput = this.modalElement.querySelector('#vibeName');
      if (nameInput) nameInput.focus();
    }, 100);
  }

  /**
   * Populate form with hack data
   * @param {Object} hack - The hack object
   */
  populateForm(hack) {
    const title = this.modalElement.querySelector('#modalTitle');
    const nameInput = this.modalElement.querySelector('#vibeName');
    const descInput = this.modalElement.querySelector('#vibeDescription');
    const cssInput = this.modalElement.querySelector('#cssCode');
    const jsInput = this.modalElement.querySelector('#jsCode');
    const enabledCheckbox = this.modalElement.querySelector('#vibeEnabled');

    title.textContent = `Edit: ${hack.name}`;
    nameInput.value = hack.name || '';
    descInput.value = hack.description || '';
    cssInput.value = hack.cssCode || '';
    jsInput.value = hack.jsCode || '';
    enabledCheckbox.checked = hack.enabled !== false;
  }

  /**
   * Save changes to the hack
   */
  async saveChanges() {
    try {
      if (!this.currentHack) {
        throw new Error('No hack selected');
      }

      // Get form values
      const nameInput = this.modalElement.querySelector('#vibeName');
      const descInput = this.modalElement.querySelector('#vibeDescription');
      const cssInput = this.modalElement.querySelector('#cssCode');
      const jsInput = this.modalElement.querySelector('#jsCode');
      const enabledCheckbox = this.modalElement.querySelector('#vibeEnabled');

      // Validate inputs
      const name = nameInput.value.trim();
      if (!name) {
        this.showError('Vibe name is required');
        nameInput.focus();
        return;
      }

      // Show loading state
      this.setLoadingState(true);

      // Prepare update data
      const updateData = {
        name: name,
        description: descInput.value.trim(),
        cssCode: cssInput.value,
        jsCode: jsInput.value,
        enabled: enabledCheckbox.checked
      };

      // Call save callback if provided
      if (this.onSaveCallback) {
        await this.onSaveCallback(this.currentHack.id, updateData);
      }

      // Close modal
      this.closeModal();

    } catch (error) {
      console.error('Error saving changes:', error);
      this.showError('Failed to save changes: ' + error.message);
    } finally {
      this.setLoadingState(false);
    }
  }

  /**
   * Close the modal
   */
  closeModal() {
    if (this.modalElement) {
      this.modalElement.classList.remove('show');
      document.body.style.overflow = '';
    }

    // Call close callback if provided
    if (this.onCloseCallback) {
      this.onCloseCallback();
    }

    this.currentHack = null;
    this.currentHostname = "";
    this.onSaveCallback = null;
    this.onCloseCallback = null;
  }

  /**
   * Check if modal is open
   * @returns {boolean} Whether the modal is currently open
   */
  isOpen() {
    return this.modalElement && this.modalElement.classList.contains('show');
  }

  /**
   * Set loading state
   * @param {boolean} isLoading - Whether to show loading state
   */
  setLoadingState(isLoading) {
    const container = this.modalElement.querySelector('.modal-container');
    const saveBtn = this.modalElement.querySelector('#saveBtn');
    const cancelBtn = this.modalElement.querySelector('#cancelBtn');

    if (isLoading) {
      container.classList.add('loading');
      saveBtn.disabled = true;
      cancelBtn.disabled = true;
    } else {
      container.classList.remove('loading');
      saveBtn.disabled = false;
      cancelBtn.disabled = false;
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message to display
   */
  showError(message) {
    // Remove existing error notifications
    const existingErrors = document.querySelectorAll('.error-notification');
    existingErrors.forEach(el => el.remove());

    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.textContent = message;

    document.body.appendChild(errorDiv);

    // Remove after 3 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 3000);
  }

  /**
   * Clean up the modal
   */
  destroy() {
    if (this.modalElement && this.modalElement.parentNode) {
      this.modalElement.parentNode.removeChild(this.modalElement);
    }
    this.modalElement = null;
  }
}

// Export for use in other contexts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VibeSettingsModal;
}
// Always assign to window for browser usage
window.VibeSettingsModal = VibeSettingsModal; 