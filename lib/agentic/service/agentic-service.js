/**
 * Agentic Service - Manages the agentic loop for AI-driven webpage editing
 * Provides tools to the AI and handles tool execution with conversation flow
 */

class AgenticService {
  /**
   * Create an agentic service instance
   * @param {AIService} aiService - AI service for communication with AI providers
   * @param {Array<AgenticTool>} tools - Array of tools available to the AI
   * @param {SettingsService} settingsService - Service for managing extension settings
   */
  constructor(aiService, tools = [], settingsService) {
    if (!aiService) {
      throw new Error("AIService is required for AgenticService");
    }
    if (!settingsService) {
      throw new Error("SettingsService is required for AgenticService");
    }

    this.aiService = aiService;
    this.settingsService = settingsService;
    this.tools = new Map();
    this.conversationHistory = [];
    this.currentHack = null;
    this.maxIterations = 10; // Prevent infinite loops
    this.currentIteration = 0;
    this.aborted = false; // Flag to track if the loop has been aborted

    /**
     * Maximum size allowed for any single chat message (in bytes).
     * This prevents extremely large messages/tool results from stalling the AI provider.
     * Fetched from SettingsService.
     * @type {number}
     */
    this.MAX_MESSAGE_SIZE = 10 * 1024; // Default, will be updated

    /**
     * Maximum size allowed for the entire conversation history (in bytes).
     * This prevents the conversation from growing too large and consuming excessive memory.
     * Fetched from SettingsService.
     * @type {number}
     */
    this.MAX_HISTORY_SIZE = 100 * 1024; // Default, will be updated

    // Register provided tools
    this.registerTools(tools);
    this._initializeSettings();
  }

  /**
   * Asynchronously initialize settings
   * @private
   */
  async _initializeSettings() {
    try {
      const settings = await this.settingsService.getAllSettings();
      // The settings are in tokens, but we need bytes. Let's assume a rough 4 bytes/token ratio for now.
      // This is a simplification and might need refinement.
      this.MAX_MESSAGE_SIZE = settings.maxIndividualMessageSize * 4;
      this.MAX_HISTORY_SIZE = settings.maxConversationSize * 4;
    } catch (error) {
      console.error("Failed to initialize AgenticService settings:", error);
      // Keep defaults if settings fail to load
    }
  }

  /**
   * Register tools for use by the AI
   * @param {Array<AgenticTool>} tools - Tools to register
   */
  registerTools(tools) {
    tools.forEach((tool) => {
      if (!(tool instanceof AgenticTool)) {
        throw new Error("All tools must extend AgenticTool");
      }
      this.tools.set(tool.name, tool);
    });
  }

  /**
   * Register a single tool
   * @param {AgenticTool} tool - Tool to register
   */
  registerTool(tool) {
    if (!(tool instanceof AgenticTool)) {
      throw new Error("Tool must extend AgenticTool");
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Set the current hack being edited (for tools that need it)
   * @param {Hack} hack - The hack instance to edit
   */
  setCurrentHack(hack) {
    this.currentHack = hack;

    // Update tools that need the current hack
    this.tools.forEach((tool) => {
      if (typeof tool.setCurrentHack === "function") {
        tool.setCurrentHack(hack);
      }
    });
  }

  /**
   * Start the agentic loop with an initial user request
   * @param {string} userRequest - The user's request for webpage modification
   * @param {Object} options - Optional configuration
   * @param {number} [options.maxIterations] - Maximum number of iterations
   * @param {boolean} [options.verbose] - Whether to include detailed logs
   * @param {boolean} [options.resetHistory] - Whether to reset the conversation history (defaults to false)
   * @param {Function} [options.onMessage] - Callback for real-time message updates
   * @returns {Promise<Object>} The final result of the agentic loop
   */
  async startAgenticLoop(userRequest, options = {}) {

    try {
      this.maxIterations = options.maxIterations || 10;
      this.currentIteration = 0;
      this.aborted = false; // Reset abort flag at start of new loop
      const shouldResetHistory =
        options.resetHistory || this.conversationHistory.length === 0;

      if (shouldResetHistory) {
        // Start a brand-new conversation
        this.conversationHistory = [];
      }

      this.onMessage = options.onMessage; // Store callback for real-time updates

      if (!this.aiService.isReady()) {
        throw new Error(
          "AI service is not ready. Please configure AI provider first."
        );
      }

      if (!this.currentHack) {
        throw new Error(
          "No hack is currently set for editing. Please select a hack first."
        );
      }

      // ALWAYS ensure system prompt is the first message
      if (
        this.conversationHistory.length === 0 ||
        this.conversationHistory[0].role !== "system"
      ) {
        const systemPrompt = this.createSystemPrompt();
        // If there's no system message at the start, add it at the beginning
        if (this.conversationHistory.length === 0) {
          this.conversationHistory.push({
            role: "system",
            content: systemPrompt,
          });
        } else if (this.conversationHistory[0].role !== "system") {
          this.conversationHistory.unshift({
            role: "system",
            content: systemPrompt,
          });
        }
      }

      // If this is a fresh conversation, bootstrap with detailed initial instructions
      if (shouldResetHistory) {
        const initialPrompt = `User Request: ${userRequest}

Please analyze this request and use the available tools to help modify the current webpage vibe (hack). You can read existing CSS/JS code, make modifications, and save updated code.

Start by reading the existing website code, using tools that include the word "website" to understand the current state, then proceed with the requested modifications.`;

        this.addMessageToHistory({
          role: "user",
          content: this._truncateContent(initialPrompt),
        });
      } else {
        // Continue existing conversation – simply append the new user request
        this.addMessageToHistory({
          role: "user",
          content: this._truncateContent(userRequest),
        });
      }

      // Send user request (initial or follow-up) to callback if provided
      if (this.onMessage) {
        this.onMessage({
          type: "user_request",
          content: userRequest,
          timestamp: new Date().toISOString(),
        });
      }

      // Start the agentic loop
      return await this.runAgenticLoop(options.verbose || false);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        conversationHistory: this.conversationHistory,
        iterations: this.currentIteration,
      };
    }
  }

  /**
   * Run the main agentic loop
   * @param {boolean} verbose - Whether to include detailed logs
   * @returns {Promise<Object>} The result of the agentic loop
   */
  async runAgenticLoop(verbose = false) {
    while (this.currentIteration < this.maxIterations && !this.aborted) {
      this.currentIteration++;

      if (verbose) {
        console.log(
          `\n=== Agentic Loop Iteration ${this.currentIteration} ===`
        );
      }

      try {
        console.log("Conversation Is");
        console.log(this.conversationHistory);

        // Send conversation to AI
        const aiResponse = await this.aiService.sendConversation(
          this.conversationHistory.map((msg) => msg.content)
        );

        if (!aiResponse.success) {
          throw new Error(`AI response error: ${aiResponse.error}`);
        }

        const responseText = aiResponse.content;
        console.log("AI Says", responseText);

        // Add AI response to conversation
        this.addMessageToHistory({
          role: "assistant",
          content: this._truncateContent(responseText),
        });

        // Send AI response to callback if provided
        if (this.onMessage) {
          this.onMessage({
            type: "ai_response",
            content: responseText,
            iteration: this.currentIteration,
            timestamp: new Date().toISOString(),
          });
        }

        if (verbose) {
          console.log("AI Response:", responseText);
        }

        // Check if AI wants to use tools
        const toolCalls = ToolCallParser.parseToolCalls(responseText);

        if (toolCalls.length === 0) {
          // No tool calls found, AI is done
          if (verbose) {
            console.log("No tool calls detected. AI has completed the task.");
          }

          // Send completion notification to callback if provided
          if (this.onMessage) {
            this.onMessage({
              type: "completion",
              content: responseText,
              iterations: this.currentIteration,
              timestamp: new Date().toISOString(),
            });
          }

          return {
            success: true,
            finalResponse: responseText,
            conversationHistory: this.conversationHistory,
            iterations: this.currentIteration,
            completed: true,
          };
        }

        // Check for mixed read/write tool usage
        const { readTools, writeTools, mixedUsageMessage } =
          this.separateReadWriteTools(toolCalls);

        // If mixed usage detected, only execute read tools
        const toolsToExecute = mixedUsageMessage ? readTools : toolCalls;
        const executionMessage = mixedUsageMessage || "";

        // Execute all tool calls in sequence
        const toolResults = [];
        let hasCriticalFailure = false;

        for (let i = 0; i < toolsToExecute.length && !this.aborted; i++) {
          const toolCall = toolsToExecute[i];

          if (verbose) {
            console.log(
              `Executing tool ${i + 1}/${toolsToExecute.length}: ${toolCall.name
              }`
            );
            console.log("Parameters:", toolCall.parameters);
          }

          // Send tool execution notification to callback if provided
          if (this.onMessage) {
            this.onMessage({
              type: "tool_execution",
              toolName: toolCall.name,
              parameters: toolCall.parameters,
              iteration: this.currentIteration,
              toolIndex: i + 1,
              totalTools: toolsToExecute.length,
              timestamp: new Date().toISOString(),
            });
          }

          const toolResult = await this.executeTool(
            toolCall.name,
            toolCall.parameters
          );

          if (verbose) {
            console.log(`Tool ${i + 1} result:`, toolResult);
          }

          // Send tool result to callback if provided
          if (this.onMessage) {
            this.onMessage({
              type: "tool_result",
              toolName: toolCall.name,
              result: toolResult,
              iteration: this.currentIteration,
              toolIndex: i + 1,
              totalTools: toolsToExecute.length,
              timestamp: new Date().toISOString(),
            });
          }

          toolResults.push({
            toolName: toolCall.name,
            result: toolResult,
          });

          // Check for critical tool failure
          if (!toolResult.success && this.isCriticalTool(toolCall.name)) {
            hasCriticalFailure = true;
            if (verbose) {
              console.error(
                `Critical tool '${toolCall.name}' failed, stopping execution`
              );
            }
            break;
          }
        }

        // Create comprehensive tool results message
        let toolResultMessages = toolResults
          .map(
            ({ toolName, result }) =>
              `Tool Result (${toolName}): ${JSON.stringify(result, null, 2)}`
          )
          .join("\n\n");

        // Add mixed usage message if applicable
        if (executionMessage) {
          toolResultMessages = executionMessage + "\n\n" + toolResultMessages;
        }

        // Only add a message to history if we actually have content.
        if (toolResultMessages.trim().length > 0) {
          this.addMessageToHistory({
            role: "user",
            content: this._truncateContent(toolResultMessages),
          });
        }

        // If any critical tool failed, stop the loop
        if (hasCriticalFailure) {
          const failedCriticalTools = toolResults
            .filter(({ result }) => !result.success)
            .filter(({ toolName }) => this.isCriticalTool(toolName))
            .map(({ toolName }) => toolName);

          return {
            success: false,
            error: `Critical tool(s) failed: ${failedCriticalTools.join(", ")}`,
            conversationHistory: this.conversationHistory,
            iterations: this.currentIteration,
            toolResults,
          };
        }
      } catch (error) {
        console.error(
          `Error in agentic loop iteration ${this.currentIteration}:`,
          error
        );

        return {
          success: false,
          error: `Agentic loop failed at iteration ${this.currentIteration}: ${error.message}`,
          conversationHistory: this.conversationHistory,
          iterations: this.currentIteration,
        };
      }
    }

    // Check if loop was aborted
    if (this.aborted) {
      return {
        success: true,
        aborted: true,
        finalResponse: "Task was stopped by user",
        conversationHistory: this.conversationHistory,
        iterations: this.currentIteration,
      };
    }

    // Max iterations reached
    return {
      success: false,
      error: `Maximum iterations (${this.maxIterations}) reached without completion`,
      conversationHistory: this.conversationHistory,
      iterations: this.currentIteration,
      maxIterationsReached: true,
    };
  }

  /**
   * Create the system prompt with available tools
   * @returns {string} System prompt text
   */
  createSystemPrompt() {
    const toolDescriptions = Array.from(this.tools.values())
      .map((tool) => {
        const metadata = tool.getMetadata();
        return `- ${metadata.name}: ${metadata.description}
  Parameters: ${JSON.stringify(metadata.schema, null, 2)}`;
      })
      .join("\n\n");

    return `You are an AI assistant that helps users modify webpages through code editing. You have access to tools that allow you to read and write CSS and JavaScript code for the current webpage vibe (hack).

Available Tools:
${toolDescriptions}

IMPORTANT INSTRUCTIONS:
1. To use a tool, respond with exactly this format:
   TOOL_CALL: tool_name
   PARAMETERS: {"param1": "value1", "param2": "value2"}
2. CRITICAL: You cannot use read and write tools in the same request. This ensures you can see the results of read operations before making write operations.
3. When writing JavaScript code. Never use Dom loaded event listeners. Your script will already run after the DOM is loaded.
4. Workflow:
   - First, use read tools to understand the current state
   - Then, in a separate request, use write tools to make modifications
   - Always read existing code before making modifications to understand the current state

5. When modifying code:
   - For CSS: Focus on visual improvements, responsive design, and user experience
   - For JavaScript: Ensure functionality is preserved and enhanced
   - Test your understanding by reading code before and after changes

6. Be concise but thorough in your explanations.

7. If you complete the user's request successfully, provide a clear summary of what was accomplished.

8. If you encounter errors, try to fix them or suggest alternatives.

9. Always call apply_hack after saving changes so the user can see the results.

Current Context:
- You are editing a webpage vibe (hack) that contains CSS and/or JavaScript code
- The user wants you to help modify this code based on their request
- Always start by understanding the current state before making changes
- Always read the content of the website first to understand how you should modify it`;
  }

  /**
   * Execute a tool with given parameters
   * @param {string} toolName - Name of the tool to execute
   * @param {Object} parameters - Parameters for the tool
   * @returns {Promise<Object>} Tool execution result
   */
  async executeTool(toolName, parameters) {
    try {
      const tool = this.tools.get(toolName);

      if (!tool) {
        return {
          success: false,
          error: `Tool '${toolName}' not found`,
          availableTools: Array.from(this.tools.keys()),
        };
      }

      // Add debugging for parameter validation
      console.log(`Executing tool '${toolName}' with parameters:`, parameters);

      const result = await tool.run(parameters);
      console.log(`Tool '${toolName}' execution result:`, result);

      return result;
    } catch (error) {
      console.error(`Tool execution error for '${toolName}':`, error);
      return {
        success: false,
        error: `Tool execution failed: ${error.message}`,
        tool: toolName,
        stack: error.stack,
      };
    }
  }

  /**
   * Check if a tool is considered critical for the operation
   * @param {string} toolName - Name of the tool
   * @returns {boolean} True if tool is critical
   */
  isCriticalTool(toolName) {
    // Tools that are critical for basic functionality
    const criticalTools = ["save_css", "save_js"];
    return criticalTools.includes(toolName);
  }

  /**
   * Get available tools metadata
   * @returns {Array<Object>} Array of tool metadata
   */
  getAvailableTools() {
    return Array.from(this.tools.values()).map((tool) => tool.getMetadata());
  }

  /**
   * Clear conversation history
   */
  clearConversationHistory() {
    this.conversationHistory = [];
    this.currentIteration = 0;
  }

  /**
   * Get current conversation history
   * @returns {Array<Object>} Conversation history
   */
  getConversationHistory() {
    return [...this.conversationHistory];
  }

  /**
   * Check if the agentic service is ready to use
   * @returns {boolean} True if ready
   */
  isReady() {
    return this.aiService.isReady() && this.tools.size > 0;
  }

  /**
   * Abort the currently running agentic loop
   */
  abort() {
    this.aborted = true;
    if (this.onMessage) {
      this.onMessage({
        type: "aborted",
        message: "Task was stopped by user",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Separate read and write tools from a list of tool calls
   * @param {Array<ToolCall>} toolCalls - List of tool calls
   * @returns {Object} Object containing readTools, writeTools, and mixedUsageMessage
   */
  separateReadWriteTools(toolCalls) {
    const readTools = [];
    const writeTools = [];
    let mixedUsageMessage = null;

    for (const toolCall of toolCalls) {
      const tool = this.tools.get(toolCall.name);
      if (!tool) {
        // Skip unknown tools
        continue;
      }

      if (tool.write) {
        writeTools.push(toolCall);
      } else {
        readTools.push(toolCall);
      }
    }

    // Check if both read and write tools are present
    if (readTools.length > 0 && writeTools.length > 0) {
      const readToolNames = readTools.map((t) => t.name).join(", ");
      const writeToolNames = writeTools.map((t) => t.name).join(", ");

      mixedUsageMessage = `⚠️ MIXED TOOL USAGE DETECTED ⚠️

You cannot use read and write tools in the same request. This prevents the AI from seeing the results of read operations before making write operations.

Read tools requested: ${readToolNames}
Write tools requested: ${writeToolNames}

Only the read operations have been executed. Please make your write operations in a separate request after reviewing the read results.

This ensures you can see the current state before making modifications.`;
    }

    return {
      readTools,
      writeTools,
      mixedUsageMessage,
    };
  }

  /**
   * Truncate a message/content so that its UTF-8 byte length does not exceed MAX_MESSAGE_SIZE.
   * If truncation occurs, a warning notice is appended to inform the AI.
   * @param {string} content - The original content to potentially truncate.
   * @returns {string} The content, truncated if necessary.
   */
  _truncateContent(content) {
    try {
      const encoder =
        typeof TextEncoder !== "undefined" ? new TextEncoder() : null;
      const maxBytes = this.MAX_MESSAGE_SIZE;
      const truncationNotice = `\n\n[⚠️ Content truncated due to exceeding ${maxBytes} bytes limit. Try using a more specific tool or parameter]`;

      if (!encoder) {
        // Fallback using Buffer if TextEncoder is not available (e.g., older Node.js)
        const byteLength = Buffer.byteLength(content, "utf8");
        if (byteLength <= maxBytes) {
          return content;
        }

        const allowedBytes =
          maxBytes - Buffer.byteLength(truncationNotice, "utf8");
        let truncated = content;
        // Reduce until within limit
        while (Buffer.byteLength(truncated, "utf8") > allowedBytes) {
          truncated = truncated.slice(0, -1);
        }
        return truncated + truncationNotice;
      }

      const bytes = encoder.encode(content);
      if (bytes.length <= maxBytes) {
        return content;
      }

      const noticeBytes = encoder.encode(truncationNotice);
      const allowedBytes = maxBytes - noticeBytes.length;
      const truncatedBytes = bytes.slice(0, allowedBytes);
      const decoder = new TextDecoder();
      return decoder.decode(truncatedBytes) + truncationNotice;
    } catch (error) {
      // As a last resort, truncate by character length approximation
      const approxLimit = 25000; // Slightly less than 25KB to account for multi-byte chars and notice
      if (content.length <= approxLimit) {
        return content;
      }
      return (
        content.slice(0, approxLimit) +
        "\n\n[⚠️ Content truncated due to large output]"
      );
    }
  }

  /**
   * Calculate the total size of the conversation history in bytes
   * @returns {number} Total size in bytes
   */
  _calculateHistorySize() {
    try {
      const encoder =
        typeof TextEncoder !== "undefined" ? new TextEncoder() : null;

      if (!encoder) {
        // Fallback using Buffer if TextEncoder is not available
        return Buffer.byteLength(
          JSON.stringify(this.conversationHistory),
          "utf8"
        );
      }

      return encoder.encode(JSON.stringify(this.conversationHistory)).length;
    } catch (error) {
      console.error("Error calculating history size:", error);
      // Fallback to character count approximation
      return JSON.stringify(this.conversationHistory).length * 2; // Rough approximation
    }
  }

  /**
   * Check if the conversation history exceeds the maximum size limit
   * @returns {boolean} True if history size exceeds limit
   */
  _isHistorySizeExceeded() {
    return this._calculateHistorySize() > this.MAX_HISTORY_SIZE;
  }

  /**
   * Trim the conversation history by removing oldest messages until it fits under the size limit
   * Preserves system messages and ensures at least one user message remains
   * @returns {Object} Information about the trimming operation
   */
  _trimHistory() {
    const initialSize = this._calculateHistorySize();
    const initialCount = this.conversationHistory.length;
    let trimmedCount = 0;
    let trimmingMessage = null;

    // Don't trim if already under limit
    if (!this._isHistorySizeExceeded()) {
      return {
        trimmed: false,
        initialSize,
        finalSize: initialSize,
        trimmedCount: 0,
        message: null,
      };
    }

    // Separate system messages from other messages
    const systemMessages = this.conversationHistory.filter(
      (msg) => msg.role === "system"
    );
    const otherMessages = this.conversationHistory.filter(
      (msg) => msg.role !== "system"
    );

    // Start trimming from the oldest non-system messages
    while (this._isHistorySizeExceeded() && otherMessages.length > 1) {
      // Remove the oldest message (first in array)
      otherMessages.shift();
      trimmedCount++;

      // Reconstruct conversation history with system messages first, then remaining messages
      this.conversationHistory = [...systemMessages, ...otherMessages];
    }

    const finalSize = this._calculateHistorySize();
    const finalCount = this.conversationHistory.length;

    // Create trimming message for user notification
    if (trimmedCount > 0) {
      trimmingMessage = `🗂️ Conversation history trimmed: Removed ${trimmedCount} oldest messages to stay under token limit. History reduced from ${initialCount} to ${finalCount} messages (${Math.round(
        initialSize / 1024
      )}KB → ${Math.round(finalSize / 1024)}KB).`;
    }

    return {
      trimmed: trimmedCount > 0,
      initialSize,
      finalSize,
      trimmedCount,
      message: trimmingMessage,
    };
  }

  /**
   * Add a message to conversation history and trim if necessary
   * @param {Object} message - Message object with role and content
   * @returns {Object} Information about any trimming that occurred
   */
  addMessageToHistory(message) {
    // Add the message to history
    this.conversationHistory.push(message);

    // Check if trimming is needed and perform it
    const trimResult = this._trimHistory();

    // If trimming occurred and we have a callback, notify the user
    if (trimResult.trimmed && this.onMessage) {
      this.onMessage({
        type: "history_trimmed",
        message: trimResult.message,
        trimmedCount: trimResult.trimmedCount,
        initialSize: trimResult.initialSize,
        finalSize: trimResult.finalSize,
        timestamp: new Date().toISOString(),
      });
    }

    return trimResult;
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = AgenticService;
} else {
  window.AgenticService = AgenticService;
}
