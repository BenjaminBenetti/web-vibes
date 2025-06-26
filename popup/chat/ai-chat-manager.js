/**
 * AI Chat Manager for the Add New Vibe modal
 * Handles the chat interface and AI interactions for creating and editing vibes using agentic service
 */
class AIChatManager {
  constructor(agenticService, hackService) {
    this.agenticService = agenticService;
    this.hackService = hackService;
    this.currentHostname = "";
    this.currentHack = null; // Track current hack being edited
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
  }

  setupEventListeners() {
    // Close modal (only if elements exist - for modal context)
    if (this.closeButton) {
      this.closeButton.addEventListener("click", () => {
        this.closeModal();
      });
    }

    // Close modal when clicking overlay (only if modal exists)
    if (this.modal) {
      this.modal.addEventListener("click", (e) => {
        if (e.target === this.modal) {
          this.closeModal();
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
          this.sendMessage();
        }
      });
    }

    // Go to settings (only if element exists)
    if (this.goToSettingsBtn) {
      this.goToSettingsBtn.addEventListener("click", () => {
        if (this.modal) {
          this.closeModal();
        }
        window.location.href = "settings/settings.html";
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

      // Create a new temporary hack for the AI to work with
      await this.createNewHackForEditing();
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

  closeModal() {
    if (this.modal) {
      this.modal.classList.remove("visible");
    }
    // Clear chat input
    if (this.chatInput) {
      this.chatInput.value = "";
    }
  }

  async sendMessage() {
    if (!this.chatInput) return;

    const message = this.chatInput.value.trim();
    if (!message) return;

    // Store original placeholder
    const originalPlaceholder =
      this.chatInput.placeholder || "Type a message...";

    // Clear input and disable send button
    this.chatInput.value = "";
    this.chatInput.placeholder = "AI is thinking...";
    if (this.sendButton) {
      this.sendButton.disabled = true;
    }

    // Add loading state to input container
    const inputContainer = document.querySelector(".chat-input-container");
    if (inputContainer) {
      inputContainer.classList.add("loading");
    }

    // Add user message to chat
    this.addMessage(message, "user");

    // Show enhanced typing indicator
    const typingIndicator = this.showTypingIndicator();

    // Update spinner text periodically for engaging feedback
    const textUpdateInterval = setInterval(() => {
      this.updateSpinnerText(typingIndicator);
    }, 10000); // Update every 10 seconds

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
      // Clear the text update interval
      clearInterval(textUpdateInterval);

      // Remove typing indicator
      this.removeTypingIndicator(typingIndicator);

      // Remove loading state and re-enable send button
      if (inputContainer) {
        inputContainer.classList.remove("loading");
      }
      this.chatInput.placeholder = originalPlaceholder;
      if (this.sendButton) {
        this.sendButton.disabled = false;
      }
    }
  }

  /**
   * Get a random thinking message for the spinner
   */
  getRandomThinkingMessage() {
    const agenticMessages = [
      "AI is analyzing your request...",
      "Planning the best approach...",
      "Reading existing code...",
      "Crafting your modifications...",
      "Testing code solutions...",
      "Optimizing the implementation...",
      "Preparing code changes...",
      "Building your vibe...",
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

  showTypingIndicator() {
    if (!this.chatMessages) return null;

    const typingDiv = document.createElement("div");
    typingDiv.className = "chat-message assistant";
    typingDiv.innerHTML = `
      <div class="message-content typing-indicator">
        <div class="typing-spinner">
          <div class="gradient-spinner"></div>
          <span class="spinner-text">${this.getRandomThinkingMessage()}</span>
        </div>
      </div>
    `;

    // Add with fade-in animation
    typingDiv.style.opacity = "0";
    typingDiv.style.transform = "translateY(10px)";
    this.chatMessages.appendChild(typingDiv);

    // Trigger animation
    requestAnimationFrame(() => {
      typingDiv.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      typingDiv.style.opacity = "1";
      typingDiv.style.transform = "translateY(0)";
    });

    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

    return typingDiv;
  }

  removeTypingIndicator(indicator) {
    if (indicator && indicator.parentNode) {
      // Smooth fade-out animation
      indicator.style.transition = "opacity 0.3s ease, transform 0.3s ease";
      indicator.style.opacity = "0";
      indicator.style.transform = "translateY(-10px)";

      // Remove after animation completes
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      }, 300);
    }
  }

  /**
   * Update the spinner text periodically during long responses
   */
  updateSpinnerText(indicator) {
    if (!indicator) return;

    const spinnerText = indicator.querySelector(".spinner-text");
    if (spinnerText) {
      const newMessage = this.getRandomThinkingMessage();

      // Fade out, change text, fade in
      spinnerText.style.opacity = "0.5";
      setTimeout(() => {
        spinnerText.textContent = newMessage;
        spinnerText.style.opacity = "1";
      }, 200);
    }
  }

  /**
   * Get a random thinking message for the spinner
   */
  getRandomThinkingMessage() {
    const messages = [
      "AI is thinking...",
      "Crafting your vibe...",
      "Analyzing your request...",
      "Generating ideas...",
      "Working on it...",
      "Brainstorming solutions...",
      "Processing your vision...",
      "Creating something awesome...",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Set the current hack to edit
   * @param {Hack} hack - The hack to edit
   */
  setCurrentHack(hack) {
    this.currentHack = hack;
    if (this.agenticService) {
      this.agenticService.setCurrentHack(hack);

      // Add a system message to indicate which hack is being edited
      this.addMessage(
        `🎯 Now editing "${hack.name}". I can read and modify your CSS/JavaScript code directly.`,
        "system"
      );
    }
  }

  /**
   * Clear the current hack
   */
  clearCurrentHack() {
    this.currentHack = null;
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
      maxIterations: 10,
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
      if (!result.completed) {
        // Loop ended due to max iterations
        this.addMessage(
          "🔄 I've reached the maximum number of iterations. The task may not be fully complete. You can continue by sending another message.",
          "system"
        );
      }

      // Offer to save the hack if it has been modified
      if (this.currentHack && this.hasHackBeenModified()) {
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
    // Remove tool calls (TOOL_CALL: and PARAMETERS: lines)
    let cleaned = content.replace(/TOOL_CALL:\s*\w+/g, "");
    cleaned = cleaned.replace(/PARAMETERS:\s*\{[\s\S]*?\}/g, "");

    // Remove tool result JSON blocks
    cleaned = cleaned.replace(/Tool Result \([^)]+\):\s*\{[\s\S]*?\}/g, "");

    // Clean up extra whitespace and newlines
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, "\n\n"); // Remove triple+ newlines
    cleaned = cleaned.replace(/^\s+|\s+$/g, ""); // Trim start/end whitespace

    return cleaned;
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
        new Date()
      );

      // Set this as the current hack for the agentic service
      this.setCurrentHack(newHack);

      // Add a welcome message
      this.addMessage(
        `🎨 Ready to create a new vibe for ${this.currentHostname}! Tell me what you'd like to customize and I'll help you build it.`,
        "system"
      );
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
        <span class="material-icons">save</span>
        Save this vibe
      `;

      saveButton.addEventListener("click", () => {
        this.saveCurrentHack();
      });

      // Add button after the last system message
      const messages = this.chatMessages?.querySelectorAll(".chat-message");
      if (messages && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        const messageContent = lastMessage.querySelector(".message-content");
        if (messageContent) {
          messageContent.appendChild(saveButton);
        }
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
      // Save the hack using the hack service
      await this.hackService.createHack(this.currentHostname, {
        name: this.currentHack.name,
        description: this.currentHack.description,
        cssCode: this.currentHack.cssCode,
        jsCode: this.currentHack.jsCode,
      });

      this.addMessage(
        `✅ Saved "${this.currentHack.name}" successfully!`,
        "system"
      );

      // Close modal if it exists and refresh popup
      if (this.modal) {
        this.closeModal();
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
}
