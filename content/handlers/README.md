# Content Script Handlers

This directory contains modular handlers for the Web Vibes content script. Each handler is responsible for a specific type of message or functionality, making the codebase more maintainable and easier to extend.

## File Structure

```
content/
├── content.js                    # Main content script entry point
└── handlers/
    ├── shared-utils.js           # Shared utilities used across handlers
    ├── message-router.js         # Routes messages to appropriate handlers
    ├── apply-hack-handler.js     # Handles hack application to pages
    └── remove-hack-handler.js    # Handles hack removal from pages
```

## Handler Responsibilities

### apply-hack-handler.js
- Applies CSS and JavaScript hacks to the current webpage
- Manages injection of style and script elements into the DOM
- Tracks applied elements for later management
- Handles the `APPLY_HACK` message type

### remove-hack-handler.js
- Removes specific hacks from the current webpage
- Cleans up DOM elements created by hacks
- Handles the `REMOVE_HACK` message type

### message-router.js
- Routes incoming Chrome extension messages to appropriate handlers
- Provides centralized error handling for message processing
- Dispatches based on message type constants

### shared-utils.js
- Contains utility functions used across multiple handlers
- Prevents code duplication between handlers
- Currently includes hack removal functionality

## Message Flow

1. Chrome extension message arrives at content script
2. `content.js` passes message to `message-router.js`
3. Router examines message type and calls appropriate handler
4. Handler processes the request and sends response
5. Response is returned to the original sender

## Adding New Handlers

To add a new message handler:

1. Create a new handler file in `/content/handlers/`
2. Implement the handler function following the naming convention
3. Add the handler to `message-router.js` switch statement
4. Add the new file to the manifest.json content_scripts array
5. Define any new message types in `/lib/constants/message-types.js`

## Error Handling

All handlers follow a consistent error handling pattern:
- Try/catch blocks around main logic
- Console logging for debugging
- Structured error responses with success/error fields
- Graceful fallbacks where appropriate

## Dependencies

Handlers depend on:
- `MESSAGE_TYPES` constants from `/lib/constants/message-types.js`
- Shared utilities from `shared-utils.js`
- Global `appliedHacks` Map from main content script

The loading order in manifest.json ensures all dependencies are available when handlers execute.
