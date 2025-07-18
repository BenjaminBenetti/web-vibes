/**
 * AI Chat Manager for the Add New Vibe modal
 * Handles the chat interface and AI interactions for creating and editing vibes using agentic service
 */
class AIChatManager {
  constructor(agenticService, hackService, settingsService) {
    this.agenticService = agenticService;
    this.hackService = hackService;
    this.settingsService = settingsService;
    this.currentHostname = "";
    this.currentHack = null; // Track current hack being edited
    this.isEditingExistingHack = false; // Flag to differentiate between new and existing hacks
    this.originalHackEnabledState = null; // Track original enabled state before editing
    this.vibeSettingsModal = new VibeSettingsModal(); // Modal for editing vibe settings
    this.isAgenticLoopRunning = false; // Track if agentic loop is currently running
    this.initializeElements();
    this.setupEventListeners();
  }

  initializeElements() {
    this.modal = document.getElementById("addVibeModal");
    this.closeButton = document.getElementById("closeModal");
    this.aiStatus = document.getElementById("aiStatus");
    this.aiStatusText = document.getElementById("aiStatusText");
    this.chatContainer = document.getElementById("chatContainer");
    this.chatMessages = document.getElementById("chatMessages");
    this.chatInput = document.getElementById("chatInput");
    this.sendButton = document.getElementById("sendButton");
    this.aiNotConfigured = document.getElementById("aiNotConfigured");
    this.goToSettingsBtn = document.getElementById("goToSettings");
    this.crosshairBtn = document.getElementById("crosshairBtn");
  }

  setupEventListeners() {
    // Close modal (only if elements exist - for modal context)
    if (this.closeButton) {
      this.closeButton.addEventListener("click", async () => {
        await this.closeModal();
      });
    }

    // Close modal when clicking overlay (only if modal exists)
    if (this.modal) {
      this.modal.addEventListener("click", async (e) => {
        if (e.target === this.modal) {
          await this.closeModal();
        }
      });
    }

    // Send message (always present)
    if (this.sendButton) {
      this.sendButton.addEventListener("click", () => {
        this.sendMessage();
      });
    }

    // Send message on Enter key (always present)
    if (this.chatInput) {
      this.chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          // If agentic loop is running, Enter key should also stop it
          if (this.isAgenticLoopRunning) {
            this.stopAgenticLoop();
          } else {
            this.sendMessage();
          }
        }
      });
    }

    // Go to settings (only if element exists)
    if (this.goToSettingsBtn) {
      this.goToSettingsBtn.addEventListener("click", async () => {
        if (this.modal) {
          await this.closeModal();
        }
        window.location.href = "settings/settings.html";
      });
    }

    // Crosshair button for element targeting
    if (this.crosshairBtn) {
      this.crosshairBtn.addEventListener("click", () => {
        this.startElementTargeting();
      });
    }
  }

  async initializeChat() {
    try {
      // Check if agentic service is configured and ready
      if (this.aiStatusText) {
        this.aiStatusText.textContent = "Checking AI configuration...";
      }

      const isReady = this.agenticService && this.agenticService.isReady();
      if (!isReady) {
        this.showAINotConfigured();
        return;
      }

      if (this.aiStatusText) {
        this.aiStatusText.textContent = "AI ready - Start chatting!";
      }
      this.showChatInterface();

      // Get current site hostname for context
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        this.currentHostname = new URL(tab.url).hostname;
      } catch (error) {
        console.warn("Could not get current tab hostname:", error);
        this.currentHostname = "unknown";
      }

      // Create a new temporary hack for the AI to work with if none selected
      if (!this.currentHack) {
        await this.createNewHackForEditing();
      }
    } catch (error) {
      console.error("Error initializing AI chat:", error);
      if (this.aiStatusText) {
        this.aiStatusText.textContent = "Error initializing AI";
      }
      this.showAINotConfigured();
    }
  }

  showAINotConfigured() {
    if (this.chatContainer) {
      this.chatContainer.style.display = "none";
    }
    if (this.aiNotConfigured) {
      this.aiNotConfigured.style.display = "block";
    }
    if (this.aiStatus) {
      this.aiStatus.style.display = "none";
    }
  }

  showChatInterface() {
    if (this.chatContainer) {
      this.chatContainer.style.display = "flex";
    }
    if (this.aiNotConfigured) {
      this.aiNotConfigured.style.display = "none";
    }
    if (this.aiStatus) {
      this.aiStatus.style.display = "flex";
    }
  }

  async closeModal() {
    // Re-enable hack if we were editing one
    if (this.isEditingExistingHack) {
      await this.clearCurrentHack();
    }

    if (this.modal) {
      this.modal.classList.remove("visible");
    }
    // Clear chat input
    if (this.chatInput) {
      this.chatInput.value = "";
    }
    // Stop targeting mode if active
    this.stopElementTargeting();
  }

  async sendMessage() {
    if (!this.chatInput) return;

    // If agentic loop is running, this is a stop request
    if (this.isAgenticLoopRunning) {
      this.stopAgenticLoop();
      return;
    }

    const message = this.chatInput.value.trim();
    if (!message) return;

    // Always clear the input immediately after sending
    this.chatInput.value = "";

    const inputContainer = document.querySelector(".chat-input-container");
    const inputWrapper = document.querySelector(".input-wrapper");
    const loadingOverlay = document.getElementById("chatLoadingOverlay");
    const overlaySpinnerText = loadingOverlay?.querySelector(".spinner-text");
    let overlayTextInterval;
    // Store and clear input value/placeholder
    let originalInputValue = this.chatInput.value;
    let originalPlaceholder = this.chatInput.placeholder || "Type a message...";
    if (inputWrapper && loadingOverlay) {
      inputWrapper.classList.add("loading");
      loadingOverlay.style.display = "flex";
      // Set initial random message
      if (overlaySpinnerText) {
        overlaySpinnerText.textContent = this.getRandomThinkingMessage();
      }
      // Hide input value and placeholder
      this.chatInput.placeholder = "";
      // Start interval to update spinner text
      overlayTextInterval = setInterval(() => {
        if (overlaySpinnerText) {
          overlaySpinnerText.style.opacity = "0.5";
          setTimeout(() => {
            overlaySpinnerText.textContent = this.getRandomThinkingMessage();
            overlaySpinnerText.style.opacity = "1";
          }, 200);
        }
      }, 10000);
    }

    // Add user message to chat
    this.addMessage(message, "user");

    // Set running state and change button to stop button
    this.isAgenticLoopRunning = true;
    this.updateSendButtonToStop();

    try {
      // Use agentic service for all AI interactions
      await this.handleAgenticMessage(message);
    } catch (error) {
      console.error("Error sending message:", error);
      this.addMessage(
        "Sorry, I couldn't process your request. Please try again.",
        "assistant"
      );
    } finally {
      // Reset running state and restore send button
      this.isAgenticLoopRunning = false;
      this.updateSendButtonToSend();

      // Remove loading state and re-enable send button
      if (inputWrapper && loadingOverlay) {
        inputWrapper.classList.remove("loading");
        loadingOverlay.style.display = "none";
      }
      // Also clear input again for robustness
      if (this.chatInput) this.chatInput.value = "";
      if (this.chatInput) this.chatInput.placeholder = originalPlaceholder;
      if (overlayTextInterval) clearInterval(overlayTextInterval);
    }
  }

  /**
   * Get a random thinking message for the spinner
   */
  getRandomThinkingMessage() {
    const agenticMessages = [
      "Compiling your vibe... 🛠️",
      "Refactoring ideas... 🔄",
      "Squashing bugs... 🐞",
      "Optimizing code... ⚡",
      "Linting scripts... 🧹",
      "Pushing changes... 🚀",
      "Reviewing pull requests... 👀",
      "Merging branches... 🌳",
      "Running tests... 🧪",
      "Formatting styles... 🎨",
      "Deploying tweaks... 📦",
      "Debugging logic... 🐛",
      "Syncing with repo... 🔄",
      "Writing functions... ✍️",
      "Loading snippets... 📋",
      "Auto-saving progress... 💾",
      "Analyzing DOM... 🕸️",
      "Building components... 🧩",
      "Checking dependencies... 📦",
      "Rendering preview... 🖼️",
      "Resolving merge conflicts... 🤝",
      "Fetching latest updates... ⬇️",
      "Minifying code... 🗜️",
      "Reviewing diffs... 📝",
      "Spinning up servers... 🖥️",
      "Mapping user flows... 🗺️",
      "Chasing memory leaks... 🕵️",
      "Configuring settings... ⚙️",
      "Parsing data... 📊",
      "Encrypting secrets... 🔐",
      "Watching file changes... 👓",
      "Connecting APIs... 🔌",
      "Caching assets... 🗂️",
      "Resolving dependencies... 🧩",
      "Committing changes... 📝",
      "Generating docs... 📚",
      "Polling endpoints... 📡",
      "Rendering UI... 🖌️",
      "Syncing state... 🔄",
      "Profiling performance... 📈",
      "Reviewing logs... 📜",
    ];
    return agenticMessages[Math.floor(Math.random() * agenticMessages.length)];
  }

  addMessage(content, role) {
    if (!this.chatMessages) return;

    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${role}`;

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";

    // Handle system messages with special styling
    if (role === "system") {
      contentDiv.innerHTML = `<em>${content}</em>`;
      messageDiv.classList.add("system-message");
    } else {
      contentDiv.textContent = content;
    }

    messageDiv.appendChild(contentDiv);
    this.chatMessages.appendChild(messageDiv);

    // Scroll to bottom
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  /**
   * Set the current hack to edit
   * @param {Hack} hack - The hack to edit
   */
  async setCurrentHack(hack) {
    this.currentHack = hack;
    // Store the original enabled state before editing
    this.originalHackEnabledState = hack.enabled;
    // Mark that we are editing an existing stored hack
    this.isEditingExistingHack = true;

    // Get current hostname for disabling the hack
    const { hostname } = await this.hackService.getHacksForCurrentSite();

    // Disable the hack to prevent conflicts during editing
    if (hack.enabled) {
      await this.hackService.updateHack(hostname, hack.id, { enabled: false });
      console.log(
        `Disabled hack "${hack.name}" during editing to prevent conflicts`
      );
    }

    if (this.agenticService) {
      this.agenticService.setCurrentHack(hack);
      this.agenticService.clearConversationHistory();

      if (this.chatMessages) {
        this.chatMessages.innerHTML = ""; // Clear UI messages
      }

      // Add a system message to indicate which hack is being edited
      this.addMessage(
        `🎯 Now editing "${hack.name}". I can read and modify your CSS/JavaScript code directly.`,
        "system"
      );

      // Pre-load context
      await this.preloadHackContext(hack);
    }
  }

  /**
   * Pre-loads the conversation history with the current hack's content.
   * This gives the AI initial context for editing.
   * @param {Hack} hack - The hack to load context from.
   */
  async preloadHackContext(hack) {
    if (!hack) return;

    // We need to create a system prompt first, because `startAgenticLoop` will not do it if history is not empty.
    const systemPrompt = this.agenticService.createSystemPrompt();
    this.agenticService.addMessageToHistory({
      role: "system",
      content: systemPrompt,
    });

    const hasCss = hack.cssCode && hack.cssCode.trim() !== "";
    const hasJs = hack.jsCode && hack.jsCode.trim() !== "";

    if (!hasCss && !hasJs) {
      this.addMessage(
        "This vibe is empty. Tell me what you'd like to create!",
        "system"
      );
      return;
    }

    this.addMessage("Loading existing code into context...", "system");

    let toolResultMessages = [];

    // add the existing code to the context
    if (hasCss) {
      const cssResult = {
        success: true,
        content: hack.cssCode,
      };
      toolResultMessages.push(
        `Tool Result (read_css): ${JSON.stringify(cssResult, null, 2)}`
      );
    }
    if (hasJs) {
      const jsResult = {
        success: true,
        content: hack.jsCode,
      };
      toolResultMessages.push(
        `Tool Result (read_js): ${JSON.stringify(jsResult, null, 2)}`
      );
    }

    const toolResultsContent = toolResultMessages.join("\n\n");
    this.agenticService.addMessageToHistory({
      role: "tool", // Tool results are fed back as a 'user' message
      content: toolResultsContent,
    });

    // Add a summary to the UI
    let summary = `I have loaded the existing code for this vibe.`;
    if (hasCss && hasJs) {
      summary += ` Both CSS and JavaScript are available.`;
    } else if (hasCss) {
      summary += ` CSS is available.`;
    } else if (hasJs) {
      summary += ` JavaScript is available.`;
    }
    summary += ` What would you like to change?`;
    this.addMessage(summary, "system");
  }

  /**
   * Clear the current hack
   */
  async clearCurrentHack() {
    // Re-enable the hack if it was originally enabled before editing and we're in editing mode
    if (
      this.currentHack &&
      this.isEditingExistingHack &&
      this.originalHackEnabledState === true
    ) {
      try {
        const { hostname } = await this.hackService.getHacksForCurrentSite();
        await this.hackService.updateHack(hostname, this.currentHack.id, {
          enabled: true,
        });
        console.log(
          `Re-enabled hack "${this.currentHack.name}" after editing session ended`
        );
      } catch (error) {
        console.error("Error re-enabling hack after editing:", error);
      }
    }

    // Reset tracking variables
    this.currentHack = null;
    this.isEditingExistingHack = false;
    this.originalHackEnabledState = null;

    this.addMessage(
      "💬 No specific hack selected. I can help you create new code or discuss web development.",
      "system"
    );
  }

  /**
   * Check if agentic service is available and ready
   */
  isReady() {
    return this.agenticService && this.agenticService.isReady();
  }

  /**
   * Handle message using agentic service with iterative tool execution
   * @param {string} message - User message
   */
  async handleAgenticMessage(message) {
    // Since we always create a hack on initialization, we can always use the agentic service
    const result = await this.agenticService.startAgenticLoop(message, {
      maxIterations: 50,
      verbose: false,
      onMessage: (messageData) => {
        this.handleAgenticMessage_Callback(messageData);
      },
    });

    // Handle result
    await this.handleAgenticResult(result, message);
  }

  /**
   * Handle the result of an agentic loop execution
   * @param {Object} result - Result from agentic service
   * @param {string} originalMessage - Original user message
   */
  async handleAgenticResult(result, originalMessage) {
    if (result.success) {
      if (result.aborted) {
        // Loop was aborted by user - offer to save if modified
        if (this.currentHack && this.hasHackBeenModified()) {
          this.offerToSaveHack();
        }
      } else if (!result.completed) {
        // Loop ended due to max iterations
        this.addMessage(
          "🔄 I've reached the maximum number of iterations. The task may not be fully complete. You can continue by sending another message.",
          "system"
        );
      }

      // Offer to save the hack if it has been modified (for completed tasks)
      if (!result.aborted && this.currentHack && this.hasHackBeenModified()) {
        this.offerToSaveHack();
      }
    } else {
      this.addMessage(`❌ Task failed: ${result.error}`, "system");
    }
  }

  /**
   * Handle real-time messages from the agentic loop
   * @param {Object} messageData - Message data from agentic service
   */
  handleAgenticMessage_Callback(messageData) {
    const { type, content, toolName, result, iteration, timestamp } =
      messageData;

    switch (type) {
      case "user_request":
        // User request is already shown, no need to duplicate
        break;

      case "ai_response":
        // Clean the AI response to remove tool calls and internal details
        const cleanedContent = this.cleanAIResponse(content);
        if (cleanedContent.trim()) {
          this.addMessage(cleanedContent, "assistant");
        }
        break;

      case "tool_execution":
        // Show a subtle indication that the AI is working
        const tool = this.agenticService.tools.get(toolName);
        const actionMessage = tool
          ? tool.getActionMessage()
          : `Executing ${toolName}`;
        this.addMessage(`🔧 ${actionMessage}...`, "system");
        break;

      case "tool_result":
        const toolForResult = this.agenticService.tools.get(toolName);
        if (result.success) {
          // Show a completion message for successful tool execution
          const completionMessage = toolForResult
            ? toolForResult.getCompletionMessage()
            : `${toolName} completed`;
          this.addMessage(`✅ ${completionMessage}`, "system");
        } else {
          // Show error for failed tool execution
          const errorMessage = toolForResult
            ? toolForResult.getErrorMessage(result.error)
            : `${toolName} failed: ${result.error}`;
          this.addMessage(`❌ ${errorMessage}`, "system");
        }
        break;

      case "completion":
        this.addMessage("✨ Task completed successfully!", "system");
        break;

      case "aborted":
        // Don't add another message here since stopAgenticLoop already adds one
        break;

      default:
        console.log("Unknown agentic message type:", type, messageData);
    }
  }

  /**
   * Clean AI response by removing tool calls and internal details
   * @param {string} content - Raw AI response content
   * @returns {string} Cleaned content for display to user
   */
  cleanAIResponse(content) {
    // Prefer using unified parser from ToolCallParser to avoid duplication
    if (
      typeof window !== "undefined" &&
      window.ToolCallParser &&
      typeof window.ToolCallParser.stripToolArtifacts === "function"
    ) {
      return window.ToolCallParser.stripToolArtifacts(content);
    }

    // Fallback – basic regex cleaning if ToolCallParser is unavailable
    let cleaned = content.replace(/TOOL_CALL:\s*\w+/g, "");
    cleaned = cleaned.replace(/PARAMETERS:\s*\{[\s\S]*?\}/g, "");
    cleaned = cleaned.replace(/Tool Result \([^)]*\):\s*\{[\s\S]*?\}/g, "");
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, "\n\n");
    return cleaned.trim();
  }

  /**
   * Check if the AI response suggests creating a new hack
   * @param {string} response - AI response text
   * @returns {boolean} True if should offer to create hack
   */
  shouldOfferToCreateHack(response) {
    // The agentic service handles code creation through its tools
    // We don't need to parse code blocks here anymore
    return false;
  }

  /**
   * Create a new vibe from AI response containing code
   * Note: This method is deprecated as the agentic service handles hack creation
   * @param {string} response - AI response with code
   * @param {string} originalMessage - Original user request
   */
  async createVibeFromAIResponse(response, originalMessage) {
    // The agentic service handles hack creation through its tools
    // This method is no longer needed but kept for backward compatibility
    this.addMessage(
      "Hack creation is now handled automatically by the AI assistant.",
      "system"
    );
  }

  /**
   * Extract code blocks from AI response
   * Note: This method is deprecated as the agentic service handles code extraction
   * @param {string} response - AI response text
   * @returns {Object} Object with css and js arrays
   */
  extractCodeBlocks(response) {
    // The agentic service handles code extraction through its tools
    // Return empty object since this logic is no longer needed
    return { css: [], js: [] };
  }

  /**
   * Generate a vibe name from user message
   * Note: This method is deprecated as the agentic service handles naming
   * @param {string} message - User message
   * @returns {string} Generated vibe name
   */
  generateVibeName(message) {
    // The agentic service handles naming through its tools
    return "Custom Vibe";
  }

  /**
   * Create a new temporary hack for the AI to work with
   */
  async createNewHackForEditing() {
    try {
      // Generate a temporary name for the new vibe
      const timestamp = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const tempName = `New Vibe (${timestamp})`;

      // Create a new hack object with empty CSS and JS
      const hackId = "temp-vibe-" + Date.now();
      const newHack = new Hack(
        hackId,
        tempName,
        `New vibe for ${this.currentHostname}`,
        "", // Empty CSS to start
        "", // Empty JS to start
        true, // Enabled by default
        0, // applyDelay in milliseconds
        new Date() // createdAt timestamp
      );

      // Set this as the current hack for the agentic service
      this.setCurrentHack(newHack);

      // Reset any previous conversation so we start fresh for this vibe
      if (this.agenticService) {
        this.agenticService.clearConversationHistory();
      }

      // Add a welcome message
      this.addMessage(
        `🎨 Ready to create a new vibe for ${this.currentHostname}! Tell me what you'd like to customize and I'll help you build it.`,
        "system"
      );

      // Override the flag because this is a brand-new (unsaved) vibe
      this.isEditingExistingHack = false;
    } catch (error) {
      console.error("Error creating new hack for editing:", error);
      this.addMessage(
        "⚠️ Could not create a new vibe workspace. You can still chat with me for help and suggestions.",
        "system"
      );
    }
  }

  /**
   * Check if the current hack has been modified (has any CSS or JS code)
   * @returns {boolean} True if hack has been modified
   */
  hasHackBeenModified() {
    if (!this.currentHack) return false;
    return (
      this.currentHack.cssCode.trim() !== "" ||
      this.currentHack.jsCode.trim() !== ""
    );
  }

  /**
   * Offer to save the current hack
   */
  offerToSaveHack() {
    setTimeout(() => {
      const saveButton = document.createElement("button");
      saveButton.className = "btn btn-primary";
      saveButton.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; justify-content: center;">
          <span class="material-icons">save</span>
          <span>Save this vibe</span>
        </div>
      `;

      saveButton.addEventListener("click", () => {
        this.saveCurrentHack();
      });

      // Create edit button
      const editButton = document.createElement("button");
      editButton.className = "btn btn-primary icon-only";
      editButton.title = "Edit vibe settings";
      editButton.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; justify-content: center;">
          <span class="material-icons">edit</span>
        </div>
      `;
      editButton.addEventListener("click", () => {
        this.openVibeSettingsModal();
      });

      // NEW: Create refresh button
      const refreshButton = document.createElement("button");
      refreshButton.className = "btn btn-primary icon-only";
      refreshButton.title =
        "reload page. Can help if the vibe is not applying properly."; // Tooltip text
      refreshButton.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px; justify-content: center;">
          <span class="material-icons">refresh</span>
        </div>
      `;
      refreshButton.addEventListener("click", async () => {
        try {
          // Get the currently active tab in this window
          const [activeTab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          if (!activeTab) return;

          // Wait for the tab to finish reloading, then re-apply the current vibe
          const tabId = activeTab.id;

          const onUpdatedListener = async (updatedTabId, changeInfo) => {
            if (updatedTabId === tabId && changeInfo.status === "complete") {
              chrome.tabs.onUpdated.removeListener(onUpdatedListener);
              // Re-apply current hack as a preview using the ApplyHack tool (if available)
              const applyHackTool =
                this.agenticService?.tools?.get("apply_hack");
              if (applyHackTool && this.currentHack) {
                if (typeof applyHackTool.setCurrentHack === "function") {
                  applyHackTool.setCurrentHack(this.currentHack);
                }
                await applyHackTool.run({ preview: true });
              }
            }
          };

          chrome.tabs.onUpdated.addListener(onUpdatedListener);
          // Trigger the reload
          await chrome.tabs.reload(tabId);
        } catch (error) {
          console.error("Error refreshing page and re-applying vibe:", error);
          this.addMessage(
            "❌ Failed to refresh the page and re-apply the vibe.",
            "system"
          );
        }
      });

      // Create a new message element specifically for the buttons
      const buttonMessageDiv = document.createElement("div");
      buttonMessageDiv.className = "chat-message system";

      const buttonContentDiv = document.createElement("div");
      buttonContentDiv.className = "message-content";
      buttonContentDiv.style.padding = "12px 16px";
      buttonContentDiv.style.display = "flex";
      buttonContentDiv.style.gap = "4px";
      buttonContentDiv.style.justifyContent = "flex-start";

      buttonContentDiv.appendChild(saveButton);
      buttonContentDiv.appendChild(editButton);
      buttonContentDiv.appendChild(refreshButton);

      buttonMessageDiv.appendChild(buttonContentDiv);

      // Add the button message to the chat
      if (this.chatMessages) {
        this.chatMessages.appendChild(buttonMessageDiv);
        // Scroll to bottom so the buttons are visible
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
      }
    }, 500);
  }

  /**
   * Save the current hack to storage
   */
  async saveCurrentHack() {
    if (!this.currentHack) {
      this.addMessage("❌ No hack to save.", "system");
      return;
    }

    try {
      if (this.isEditingExistingHack) {
        // Update existing hack
        const updateData = {
          name: this.currentHack.name,
          description: this.currentHack.description,
          cssCode: this.currentHack.cssCode,
          jsCode: this.currentHack.jsCode,
          applyDelay: this.currentHack.applyDelay,
        };

        // Restore original enabled state when saving
        if (this.originalHackEnabledState !== null) {
          updateData.enabled = this.originalHackEnabledState;
        }

        await this.hackService.updateHack(
          this.currentHostname,
          this.currentHack.id,
          updateData
        );
      } else {
        // Create a new hack and switch to editing mode for subsequent saves
        const updatedHacks = await this.hackService.createHack(
          this.currentHostname,
          {
            name: this.currentHack.name,
            description: this.currentHack.description,
            cssCode: this.currentHack.cssCode,
            jsCode: this.currentHack.jsCode,
            applyDelay: this.currentHack.applyDelay,
          }
        );

        // Attempt to locate the newly created hack to sync its generated ID
        const savedHack = updatedHacks.find(
          (h) =>
            h.name === this.currentHack.name &&
            h.description === this.currentHack.description
        );
        if (savedHack) {
          this.currentHack.id = savedHack.id;
        }

        // Enter editing mode for subsequent saves to prevent duplicates
        this.isEditingExistingHack = true;
      }

      const actionMsg = this.isEditingExistingHack ? "updated" : "saved";
      this.addMessage(
        `✅ ${this.currentHack.name} ${actionMsg} successfully!`,
        "system"
      );

      // Clear the stored original enabled state after the first successful save
      if (this.isEditingExistingHack) {
        this.originalHackEnabledState = null;
      }

      // Close modal if it exists and refresh popup
      if (this.modal) {
        await this.closeModal();
      }

      // Trigger a refresh of the popup UI if available
      if (window.popupUI) {
        await window.popupUI.render();
      }
    } catch (error) {
      console.error("Error saving hack:", error);
      this.addMessage("❌ Error saving vibe. Please try again.", "system");
    }
  }

  /**
   * Start element targeting mode
   */
  async startElementTargeting() {
    this.addMessage(
      "Click on any element on the webpage to add it to the chat context.",
      "assistant",
      ["web-vibes-targeting-prompt"]
    );

    // Disable send button while targeting
    if (this.sendButton) this.sendButton.disabled = true;
    if (this.chatInput) this.chatInput.disabled = true;

    try {
      // Get the current active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab || !tab.id) {
        throw new Error("Could not get active tab.");
      }

      // Get current theme gradient
      const theme = await this.settingsService.getCurrentTheme();
      const themeGradient = theme ? theme.gradient : null;

      // Send a message to the content script to start targeting
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: MESSAGE_TYPES.START_ELEMENT_TARGETING,
        source: "sidepanel-chat",
        themeGradient: themeGradient,
      });

      if (!response || !response.success) {
        throw new Error(response.error || "Failed to start targeting.");
      }

      // Listen for when an element is targeted
      this.setupTargetingMessageListener();
      this.setupTargetingKeyListener();
    } catch (error) {
      console.error("Error starting element targeting:", error);
      this.addMessage(
        `Error starting targeting: ${error.message}`,
        "assistant"
      );
    } finally {
      // Re-enable send buttons
      if (this.sendButton) this.sendButton.disabled = false;
      if (this.chatInput) this.chatInput.disabled = false;
    }
  }

  /**
   * Sets up a listener for messages from the content script during targeting.
   */
  setupTargetingMessageListener() {
    // Remove any existing listener first
    if (this.targetingMessageListener) {
      chrome.runtime.onMessage.removeListener(this.targetingMessageListener);
    }

    this.targetingMessageListener = (message, sender, sendResponse) => {
      if (
        message.type === MESSAGE_TYPES.ELEMENT_TARGETED &&
        message.source === "content"
      ) {
        this.handleElementTargeted(message.elementData);
        sendResponse({ success: true });
        return true;
      } else if (
        message.type === MESSAGE_TYPES.TARGETING_CANCELLED &&
        message.source === "content"
      ) {
        this.stopElementTargeting();
        sendResponse({ success: true });
        return true;
      }
    };

    chrome.runtime.onMessage.addListener(this.targetingMessageListener);
  }

  /**
   * Setup ESC key listener for element targeting cancellation
   */
  setupTargetingKeyListener() {
    // Remove any existing listener first
    if (this.targetingKeyListener) {
      document.removeEventListener("keydown", this.targetingKeyListener);
    }

    this.targetingKeyListener = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        this.stopElementTargeting();
        this.addMessage("❌ Element targeting cancelled.", "system");
      }
    };

    // Add listener to document to catch ESC key in side panel
    document.addEventListener("keydown", this.targetingKeyListener);
  }

  /**
   * Handle when an element is targeted
   * @param {Object} elementData - Data about the targeted element
   */
  async handleElementTargeted(elementData) {
    try {
      // Stop targeting mode
      this.stopElementTargeting();

      // Add the element data to the conversation history
      const elementHtml = elementData.outerHTML || elementData.innerHTML || "";
      const elementSelector = elementData.selector || "unknown";
      const elementText = elementData.textContent || "";

      // Create a contextual message about the targeted element
      const contextMessage = `User has targeted an element on the page:

**Element Selector:** ${elementSelector}
**Element Text:** ${elementText.slice(0, 200)}${elementText.length > 200 ? "..." : ""
        }

**Full HTML:**
\`\`\`html
${elementHtml}
\`\`\``;

      // Add the element context to the AI conversation history
      if (this.agenticService) {
        this.agenticService.addMessageToHistory({
          role: "user",
          content: contextMessage,
        });
      }

      // Show confirmation message in chat UI
      this.addMessage(
        `✅ Element targeted! I can now see the "${elementSelector}" element and its content. Ask me anything about it or how to modify it.`,
        "system"
      );
    } catch (error) {
      console.error("Error handling targeted element:", error);
      this.addMessage("❌ Error processing targeted element.", "system");
    }
  }

  /**
   * Stop element targeting mode
   */
  async stopElementTargeting() {
    try {
      // Remove visual feedback from crosshair button
      if (this.crosshairBtn) {
        this.crosshairBtn.classList.remove("active");
      }

      // Get the current active tab
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (tab && tab.id) {
        // Send message to content script to stop targeting mode
        await chrome.tabs.sendMessage(tab.id, {
          type: MESSAGE_TYPES.STOP_ELEMENT_TARGETING,
          source: "sidepanel",
        });
      }

      // Remove message listener
      if (this.targetingMessageListener) {
        chrome.runtime.onMessage.removeListener(this.targetingMessageListener);
        this.targetingMessageListener = null;
      }

      // Remove ESC key listener
      if (this.targetingKeyListener) {
        document.removeEventListener("keydown", this.targetingKeyListener);
        this.targetingKeyListener = null;
      }
    } catch (error) {
      console.error("Error stopping element targeting:", error);
    }
  }

  /**
   * Open the vibe settings modal to edit the current hack
   */
  openVibeSettingsModal() {
    if (!this.currentHack) {
      this.addMessage("❌ No vibe to edit.", "system");
      return;
    }

    // Initialize the modal if needed
    if (!this.vibeSettingsModal) {
      this.vibeSettingsModal = new VibeSettingsModal();
    }

    // Open the modal with the current hack
    this.vibeSettingsModal.openModal(
      this.currentHack,
      this.currentHostname,
      async (hackId, updateData) => {
        // On save callback - update the hack in memory and storage
        try {
          // Update the current hack object
          if (updateData.name !== undefined) this.currentHack.name = updateData.name;
          if (updateData.cssCode !== undefined) this.currentHack.cssCode = updateData.cssCode;
          if (updateData.jsCode !== undefined) this.currentHack.jsCode = updateData.jsCode;
          if (updateData.enabled !== undefined) this.currentHack.enabled = updateData.enabled;
          if (updateData.applyDelay !== undefined) this.currentHack.applyDelay = updateData.applyDelay;

          // Update the agentic service's current hack
          if (this.agenticService) {
            this.agenticService.setCurrentHack(this.currentHack);
          }

          if (this.isEditingExistingHack) {
            await this.hackService.updateHack(
              this.currentHostname,
              this.currentHack.id,
              updateData
            )
          }

          // Re-apply the hack to show changes immediately
          const applyHackTool = this.agenticService?.tools?.get("apply_hack");
          if (applyHackTool && this.currentHack) {
            if (typeof applyHackTool.setCurrentHack === "function") {
              applyHackTool.setCurrentHack(this.currentHack);
            }
            await applyHackTool.run({ preview: true });
          }
        } catch (error) {
          console.error("Error updating hack from modal:", error);
          this.addMessage("❌ Failed to update vibe settings.", "system");
        }
      },
      () => {
        // On close callback
        console.log("Vibe settings modal closed");
      }
    );
  }

  /**
 * Update the send button to show as a stop button
 */
  updateSendButtonToStop() {
    if (!this.sendButton) return;

    this.sendButton.innerHTML = `<span class="material-icons">stop</span>`;
    this.sendButton.title = "Stop";
    this.sendButton.classList.add("stop-button");

    // Update input placeholder to indicate stop functionality
    if (this.chatInput) {
      this.chatInput.placeholder = "Press Enter or click Stop to cancel...";
      this.chatInput.classList.add("stop-mode");
    }

    // Disable crosshair button during agentic loop
    if (this.crosshairBtn) {
      this.crosshairBtn.disabled = true;
    }
  }

  /**
 * Update the send button back to send mode
 */
  updateSendButtonToSend() {
    if (!this.sendButton) return;

    this.sendButton.innerHTML = `<span class="material-icons">send</span>`;
    this.sendButton.title = "Send";
    this.sendButton.classList.remove("stop-button");

    // Restore original input placeholder and remove stop mode
    if (this.chatInput) {
      this.chatInput.placeholder = "Type a message...";
      this.chatInput.classList.remove("stop-mode");
    }

    // Re-enable crosshair button
    if (this.crosshairBtn) {
      this.crosshairBtn.disabled = false;
    }
  }

  /**
   * Stop the currently running agentic loop
   */
  stopAgenticLoop() {
    if (this.agenticService && this.isAgenticLoopRunning) {
      this.agenticService.abort();
      this.addMessage("🛑 Task stopped by user", "system");
    }
  }
}
