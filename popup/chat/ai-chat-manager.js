/**
 * AI Chat Manager for the Add New Vibe modal
 * Handles the chat interface and AI interactions for creating new vibes
 */
class AIChatManager {
  constructor(aiService, hackService) {
    this.aiService = aiService;
    this.hackService = hackService;
    this.currentHostname = "";
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
      // Check if AI is configured and ready
      if (this.aiStatusText) {
        this.aiStatusText.textContent = "Checking AI configuration...";
      }

      const isReady = await this.aiService.isReady();
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
      // Create context-aware prompt
      const contextPrompt = this.createContextPrompt(message);

      // Send to AI
      const response = await this.aiService.sendPrompt(contextPrompt);

      // Clear the text update interval
      clearInterval(textUpdateInterval);

      // Remove typing indicator
      this.removeTypingIndicator(typingIndicator);

      if (response.success) {
        this.addMessage(response.content, "assistant");

        // Check if the response contains code that could be a vibe
        this.analyzeResponseForCode(response.content);
      } else {
        this.addMessage(
          `Sorry, I encountered an error: ${response.error}`,
          "assistant"
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      clearInterval(textUpdateInterval);
      this.removeTypingIndicator(typingIndicator);
      this.addMessage(
        "Sorry, I couldn't process your request. Please try again.",
        "assistant"
      );
    } finally {
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

  createContextPrompt(userMessage) {
    const contextInfo = `
Current website: ${this.currentHostname}
User request: ${userMessage}

You are helping create a custom CSS/JavaScript "vibe" for this website. 
Please provide helpful suggestions and code snippets when appropriate.
If you generate CSS or JavaScript code, please format it clearly and explain what it does.
Keep responses concise and focused on web customization.`;

    return AIPrompt.createUserPrompt(contextInfo);
  }

  addMessage(content, role) {
    if (!this.chatMessages) return;

    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${role}`;

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";
    contentDiv.textContent = content;

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

  analyzeResponseForCode(content) {
    // Simple regex to detect CSS or JS code blocks
    const codeBlockRegex = /```(?:css|javascript|js)?\s*([\s\S]*?)```/gi;
    const matches = content.match(codeBlockRegex);

    if (matches && matches.length > 0) {
      // Show option to create vibe from the code
      setTimeout(() => {
        const createVibeButton = document.createElement("button");
        createVibeButton.className = "btn btn-primary";
        createVibeButton.innerHTML = `
          <span class="material-icons">add</span>
          Create Vibe from this code
        `;

        createVibeButton.addEventListener("click", () => {
          this.createVibeFromCode(content);
        });

        const lastMessage = this.chatMessages?.lastElementChild;
        if (lastMessage && lastMessage.classList.contains("assistant")) {
          const messageContent = lastMessage.querySelector(".message-content");
          messageContent.appendChild(createVibeButton);
        }
      }, 500);
    }
  }

  async createVibeFromCode(content) {
    try {
      // Extract code from the response
      const codeBlockRegex = /```(?:css|javascript|js)?\s*([\s\S]*?)```/gi;
      const matches = [...content.matchAll(codeBlockRegex)];

      if (matches.length === 0) {
        alert("No code blocks found to create a vibe from.");
        return;
      }

      // Create a simple vibe name based on current timestamp
      const vibeName = `AI Generated Vibe - ${new Date().toLocaleTimeString()}`;

      // Combine all code blocks
      let cssCode = "";
      let jsCode = "";

      matches.forEach((match) => {
        const code = match[1].trim();
        // Simple heuristic: if it contains selectors and properties, it's CSS
        if (code.includes("{") && code.includes(":") && code.includes(";")) {
          cssCode += code + "\n";
        } else {
          jsCode += code + "\n";
        }
      });

      // Create hack object
      const hack = new Hack(
        vibeName,
        "Generated by AI assistant",
        this.currentHostname,
        cssCode.trim(),
        jsCode.trim(),
        true // enabled by default
      );

      // Save the hack
      await this.hackService.addHack(hack);

      // Close modal and refresh the popup
      this.closeModal();

      // Trigger a refresh of the popup UI
      if (window.popupUI) {
        await window.popupUI.render();
      }

      alert("Vibe created successfully!");
    } catch (error) {
      console.error("Error creating vibe from code:", error);
      alert("Error creating vibe. Please try again.");
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
}
