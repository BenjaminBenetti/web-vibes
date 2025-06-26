/**
 * Agentic Service - Manages the agentic loop for AI-driven webpage editing
 * Provides tools to the AI and handles tool execution with conversation flow
 */
class AgenticService {
  /**
   * Create an agentic service instance
   * @param {AIService} aiService - AI service for communication with AI providers
   * @param {Array<AgenticTool>} tools - Array of tools available to the AI
   */
  constructor(aiService, tools = []) {
    if (!aiService) {
      throw new Error("AIService is required for AgenticService");
    }

    this.aiService = aiService;
    this.tools = new Map();
    this.conversationHistory = [];
    this.currentHack = null;
    this.maxIterations = 10; // Prevent infinite loops
    this.currentIteration = 0;

    // Register provided tools
    this.registerTools(tools);
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
   * @param {Function} [options.onMessage] - Callback for real-time message updates
   * @returns {Promise<Object>} The final result of the agentic loop
   */
  async startAgenticLoop(userRequest, options = {}) {
    try {
      this.maxIterations = options.maxIterations || 10;
      this.currentIteration = 0;
      this.conversationHistory = [];
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

      // Create the initial system prompt with available tools
      const systemPrompt = this.createSystemPrompt();

      // Start conversation with user request
      const initialPrompt = `User Request: ${userRequest}

Please analyze this request and use the available tools to help modify the current webpage vibe (hack). You can read existing CSS/JS code, make modifications, and save updated code.

Start by reading the existing code to understand the current state, then proceed with the requested modifications.`;

      this.conversationHistory.push({
        role: "system",
        content: systemPrompt,
      });

      this.conversationHistory.push({
        role: "user",
        content: initialPrompt,
      });

      // Send initial user request to callback if provided
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
    while (this.currentIteration < this.maxIterations) {
      this.currentIteration++;

      if (verbose) {
        console.log(
          `\n=== Agentic Loop Iteration ${this.currentIteration} ===`
        );
      }

      try {
        // Send conversation to AI
        const aiResponse = await this.aiService.sendConversation(
          this.conversationHistory.map((msg) => msg.content)
        );

        if (!aiResponse.success) {
          throw new Error(`AI response error: ${aiResponse.error}`);
        }

        const responseText = aiResponse.content;

        // Add AI response to conversation
        this.conversationHistory.push({
          role: "assistant",
          content: responseText,
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

        // Check if AI wants to use a tool
        const toolCall = this.parseToolCall(responseText);

        if (!toolCall) {
          // No tool call found, AI is done
          if (verbose) {
            console.log("No tool call detected. AI has completed the task.");
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

        // Execute the tool
        if (verbose) {
          console.log(`Executing tool: ${toolCall.name}`);
          console.log("Parameters:", toolCall.parameters);
        }

        // Send tool execution notification to callback if provided
        if (this.onMessage) {
          this.onMessage({
            type: "tool_execution",
            toolName: toolCall.name,
            parameters: toolCall.parameters,
            iteration: this.currentIteration,
            timestamp: new Date().toISOString(),
          });
        }

        const toolResult = await this.executeTool(
          toolCall.name,
          toolCall.parameters
        );

        if (verbose) {
          console.log("Tool result:", toolResult);
        }

        // Send tool result to callback if provided
        if (this.onMessage) {
          this.onMessage({
            type: "tool_result",
            toolName: toolCall.name,
            result: toolResult,
            iteration: this.currentIteration,
            timestamp: new Date().toISOString(),
          });
        }

        // Add tool result to conversation
        const toolResultMessage = `Tool Result (${
          toolCall.name
        }): ${JSON.stringify(toolResult, null, 2)}`;
        this.conversationHistory.push({
          role: "user",
          content: toolResultMessage,
        });

        // If tool execution failed and it's critical, we might want to stop
        if (!toolResult.success && this.isCriticalTool(toolCall.name)) {
          return {
            success: false,
            error: `Critical tool '${toolCall.name}' failed: ${toolResult.error}`,
            conversationHistory: this.conversationHistory,
            iterations: this.currentIteration,
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

2. Always read existing code before making modifications to understand the current state.

3. When modifying code:
   - For CSS: Focus on visual improvements, responsive design, and user experience
   - For JavaScript: Ensure functionality is preserved and enhanced
   - Test your understanding by reading code before and after changes

4. Be concise but thorough in your explanations.

5. If you complete the user's request successfully, provide a clear summary of what was accomplished.

6. If you encounter errors, try to fix them or suggest alternatives.

Current Context:
- You are editing a webpage vibe (hack) that contains CSS and/or JavaScript code
- The user wants you to help modify this code based on their request
- Always start by understanding the current state before making changes`;
  }

  /**
   * Parse tool call from AI response
   * @param {string} responseText - AI response text
   * @returns {Object|null} Parsed tool call or null if none found
   */
  parseToolCall(responseText) {
    try {
      // Look for tool call pattern
      const toolCallMatch = responseText.match(/TOOL_CALL:\s*(\w+)/);

      if (!toolCallMatch) {
        return null;
      }

      const toolName = toolCallMatch[1];
      let parameters = {};

      // Look for PARAMETERS: line - handle multiline JSON
      const parametersMatch = responseText.match(
        /PARAMETERS:\s*([\s\S]*?)(?=\n\n|\n[A-Z]|$)/
      );

      if (parametersMatch) {
        const parametersText = parametersMatch[1].trim();
        console.log("Raw parameters text:", JSON.stringify(parametersText));

        // Find the JSON object by looking for balanced braces
        const jsonStart = parametersText.indexOf("{");
        if (jsonStart !== -1) {
          let braceCount = 0;
          let jsonEnd = jsonStart;

          for (let i = jsonStart; i < parametersText.length; i++) {
            if (parametersText[i] === "{") braceCount++;
            if (parametersText[i] === "}") braceCount--;
            if (braceCount === 0) {
              jsonEnd = i;
              break;
            }
          }

          const jsonString = parametersText.substring(jsonStart, jsonEnd + 1);
          console.log("Extracted JSON string:", JSON.stringify(jsonString));

          try {
            parameters = JSON.parse(jsonString);
            console.log("Parsed parameters:", parameters);
          } catch (jsonError) {
            console.warn("Failed to parse tool parameters JSON:", jsonError);
            console.warn("Raw JSON string:", JSON.stringify(jsonString));
            console.warn("JSON string length:", jsonString.length);
            console.warn(
              "First few characters:",
              jsonString
                .substring(0, 10)
                .split("")
                .map((c) => `'${c}' (${c.charCodeAt(0)})`)
            );
            parameters = {};
          }
        } else {
          console.warn(
            "No opening brace found in parameters text:",
            JSON.stringify(parametersText)
          );
        }
      } else {
        console.warn("No PARAMETERS section found in response");
      }

      return {
        name: toolName,
        parameters,
      };
    } catch (error) {
      console.warn("Error parsing tool call:", error);
      return null;
    }
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
    const criticalTools = ["save_vibe_css", "save_vibe_js"];
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
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = AgenticService;
} else {
  window.AgenticService = AgenticService;
}
