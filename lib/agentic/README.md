# Agentic Module 

This module provides the agentic loop for the AI agent that will edit webpages via the chat interface. The agentic service manages tool execution, conversation flow, and iterative AI-driven code modification.

## Architecture

The agentic module follows the established three-layer architecture:

```
lib/agentic/
├── model/
│   └── agentic-tool.js        # Base class for all agentic tools
├── service/
│   └── agentic-service.js     # Main agentic service managing the AI loop
├── tools/                     # Individual tool implementations
│   ├── save-js.js            # Save JavaScript code tool
│   ├── read-js.js            # Read JavaScript code tool
│   ├── save-css.js           # Save CSS code tool
│   └── read-css.js           # Read CSS code tool
└── index.js                  # Module entry point and utilities
```

## Features

### AgenticService
- **Iterative AI Loop**: Manages conversation flow between AI and tools
- **Tool Management**: Registers and executes tools based on AI requests
- **Error Handling**: Robust error handling with fallback strategies
- **Conversation History**: Maintains context across iterations
- **Safety Limits**: Prevents infinite loops with iteration limits

### Tool System
- **Extensible**: Easy to add new tools by extending `AgenticTool`
- **Validated**: Parameter validation using JSON schemas
- **Type-Safe**: Runtime type checking for tool parameters
- **Error Reporting**: Standardized error and success response formats

## Available Tools

All tools extend the base class `AgenticTool` and implement the `run` method. Tools are defined in separate files under the `tools/` folder.

### save-js
**Purpose**: Save JavaScript code to the current vibe under edit  
**Parameters**:
- `code` (string, required): The JavaScript code to save
- `append` (boolean, optional): Whether to append to existing code (default: false)

**Features**:
- Syntax validation using JavaScript parser
- Append or replace mode
- Automatic persistence to storage

### read-js  
**Purpose**: Read JavaScript code from the current vibe under edit  
**Parameters**:
- `includeMetadata` (boolean, optional): Include analysis metadata (default: false)

**Features**:
- Code analysis (complexity, features, line count)
- Metadata about functions, classes, and patterns
- Performance estimates

### save-css
**Purpose**: Save CSS code to the current vibe under edit  
**Parameters**:
- `code` (string, required): The CSS code to save  
- `append` (boolean, optional): Whether to append to existing code (default: false)

**Features**:
- CSS syntax validation
- Rule counting and analysis
- Append or replace mode
- Automatic persistence to storage

### read-css
**Purpose**: Read CSS code from the current vibe under edit  
**Parameters**:
- `includeMetadata` (boolean, optional): Include analysis metadata (default: false)

**Features**:
- CSS analysis (selectors, rules, features)
- Complexity estimation
- Feature detection (Grid, Flexbox, animations, etc.)
- Selector type analysis

## Usage

### Basic Setup

```javascript
// Create services
const settingsService = webVibes.createSettingsService();
const hackService = webVibes.createHackService();
const aiService = webVibes.createAIService(settingsService);

// Create agentic service with all standard tools
const agenticService = webVibes.createAgenticService(aiService, hackService);

// Set the hack to edit
const hack = await hackService.getHackById(hackId);
agenticService.setCurrentHack(hack);
```

### Starting an Agentic Loop

```javascript
// Start the agentic loop with a user request
const result = await agenticService.startAgenticLoop(
  "Add a dark mode toggle button to this page",
  {
    maxIterations: 10,
    verbose: true
  }
);

if (result.success) {
  console.log("Task completed:", result.finalResponse);
  console.log("Iterations used:", result.iterations);
} else {
  console.error("Task failed:", result.error);
}
```

### Manual Tool Registration

```javascript
// Create service with custom tools
const customTools = [
  new SaveJSTool(hackService),
  new ReadJSTool(hackService),
  // Add custom tools here
];

const agenticService = new AgenticService(aiService, customTools);
```

## Tool Development

### Creating a Custom Tool

```javascript
class CustomTool extends AgenticTool {
  constructor(dependencies) {
    const schema = {
      type: "object",
      properties: {
        parameter1: {
          type: "string",
          description: "Description of parameter"
        }
      },
      required: ["parameter1"]
    };

    super("custom_tool", "Description of what the tool does", schema);
    this.dependencies = dependencies;
  }

  async run(parameters) {
    try {
      if (!this.validateParameters(parameters)) {
        return this.formatError("Invalid parameters", { parameters });
      }

      // Tool implementation here
      const result = await this.doWork(parameters);

      return this.formatSuccess(result);
    } catch (error) {
      return this.formatError(error.message, { error: error.stack });
    }
  }
}
```

### Tool Response Format

All tools return standardized responses:

```javascript
// Success response
{
  success: true,
  data: { /* tool-specific data */ },
  tool: "tool_name",
  timestamp: "2025-06-26T10:00:00.000Z",
  // Additional context...
}

// Error response
{
  success: false,
  error: "Error message",
  tool: "tool_name", 
  timestamp: "2025-06-26T10:00:00.000Z",
  // Additional error context...
}
```

## AI Integration

### Tool Call Format

The AI uses this format to call tools:

```
TOOL_CALL: tool_name
PARAMETERS: {"param1": "value1", "param2": "value2"}
```

### System Prompt

The agentic service automatically generates a system prompt that:
- Lists all available tools with descriptions
- Provides parameter schemas
- Includes usage instructions
- Sets context about the current hack being edited

## Error Handling

### Iteration Limits
- Default maximum of 10 iterations
- Configurable via `maxIterations` option
- Prevents infinite loops

### Tool Failures
- Non-critical tool failures continue the loop
- Critical tool failures (save operations) stop the loop
- Detailed error reporting in conversation history

### AI Service Errors
- Automatic retry mechanisms (future enhancement)
- Graceful degradation
- Error context preservation

## Performance Considerations

### Memory Management
- Conversation history is limited by iteration count
- Tool instances are reused across iterations
- Automatic cleanup after completion

### Storage Efficiency
- Only modified hacks are saved to storage
- Incremental updates for append operations
- Batch operations for multiple changes

## Security

### Input Validation
- All tool parameters are validated against schemas
- Code syntax validation before saving
- Parameter type checking

### Execution Limits
- Iteration limits prevent runaway processes
- Tool execution timeouts (future enhancement)
- Safe code evaluation practices

## Future Enhancements

### Planned Tools
- `analyze-page`: Analyze current webpage structure
- `get-element`: Extract specific page elements
- `test-code`: Validate code functionality
- `backup-hack`: Create hack backups
- `revert-changes`: Undo modifications

### Service Improvements
- Parallel tool execution
- Tool dependency management
- Performance metrics and optimization
- Advanced conversation management

### Integration Features
- Real-time preview updates
- Collaborative editing support
- Version control integration
- Advanced debugging tools

