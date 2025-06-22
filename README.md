# Web Vibes

A chrome extension that let's you vibe hack any website on the fly, then save
your hacks for later use. Don't like the way a website looks? Change it! Want to
add some functionality? Add it! Want to remove some functionality? Remove it!
Wild, and crazy, and fun!

## Features 
- Vibe modify any website using the browser extension on the fly. When you feel 
  happy with your changes, you can save them for later use. All your saved 
  changes will be applied automatically when you visit the website again.
- Manage your list of saved vibes. Disable and enable them at will. Allowing full
  control over your vibe hacks.
- Works with any AI agent, just bring your API key

## Project Structure

```
web-vibes/
├── manifest.json          # Chrome extension manifest (v3)
├── popup/                 # Extension popup UI
│   ├── popup.html        # Popup HTML structure
│   ├── popup.css         # Popup styling
│   └── popup.js          # Popup functionality
├── content/              # Content script (runs on web pages)
│   └── content.js        # Content script logic
├── icons/                # Extension icons
│   └── README.md         # Icon requirements
└── README.md             # This file
```

## Development Setup

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select this project directory
4. The extension will be loaded and ready for development

## Current Status

This is a scaffolded project with basic structure in place:
- ✅ Chrome extension manifest (v3)
- ✅ Basic popup with "Hello Web Vibes" message
- ✅ Content script template (ready for future MCP-style server integration)
- ⏳ Icons (placeholders - need actual PNG files)
- ⏳ Core functionality (to be implemented)
