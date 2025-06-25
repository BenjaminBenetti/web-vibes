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
    // Close modal
    this.closeButton.addEventListener("click", () => {
      this.closeModal();
    });

    // Close modal when clicking overlay
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });

    // Send message
    this.sendButton.addEventListener("click", () => {
      this.sendMessage();
    });

    // Send message on Enter key
    this.chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Go to settings
    this.goToSettingsBtn.addEventListener("click", () => {
      this.closeModal();
      window.location.href = "settings/settings.html";
    });
  }

  async initializeChat() {
    try {
      // Check if AI is configured and ready
      this.aiStatusText.textContent = "Checking AI configuration...";

      const isReady = await this.aiService.isReady();
      if (!isReady) {
        this.showAINotConfigured();
        return;
      }

      this.aiStatusText.textContent = "AI ready - Start chatting!";
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
      this.aiStatusText.textContent = "Error initializing AI";
      this.showAINotConfigured();
    }
  }

  showAINotConfigured() {
    this.chatContainer.style.display = "none";
    this.aiNotConfigured.style.display = "block";
    this.aiStatus.style.display = "none";
  }

  showChatInterface() {
    this.chatContainer.style.display = "flex";
    this.aiNotConfigured.style.display = "none";
    this.aiStatus.style.display = "flex";
  }

  closeModal() {
    this.modal.classList.remove("visible");
    // Clear chat input
    this.chatInput.value = "";
  }

  async sendMessage() {
    const message = this.chatInput.value.trim();
    if (!message) return;

    // Clear input and disable send button
    this.chatInput.value = "";
    this.sendButton.disabled = true;

    // Add user message to chat
    this.addMessage(message, "user");

    // Show typing indicator
    const typingIndicator = this.showTypingIndicator();

    try {
      // Create context-aware prompt
      const contextPrompt = this.createContextPrompt(message);

      // Send to AI
      const response = await this.aiService.sendPrompt(contextPrompt);

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
      this.removeTypingIndicator(typingIndicator);
      this.addMessage(
        "Sorry, I couldn't process your request. Please try again.",
        "assistant"
      );
    } finally {
      this.sendButton.disabled = false;
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
    const typingDiv = document.createElement("div");
    typingDiv.className = "chat-message assistant typing-indicator";
    typingDiv.innerHTML = `
      <div class="message-content">
        <div class="typing-dots">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>
    `;

    this.chatMessages.appendChild(typingDiv);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

    return typingDiv;
  }

  removeTypingIndicator(indicator) {
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
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

        const lastMessage = this.chatMessages.lastElementChild;
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
}
