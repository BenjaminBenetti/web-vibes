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
├── manifest.json              # Chrome extension manifest
├── popup/                     # Extension popup interface
│   ├── popup.html
│   ├── popup.css
│   └── popup.js              # UI and event handling only
├── content/                   # Content scripts
│   └── content.js
├── lib/                      # Core business logic (NEW!)
│   ├── index.js              # Library factory functions
│   ├── README.md             # Library documentation
│   └── hack/                 # Hack-related modules
│       ├── model/
│       │   └── hack.js       # Data model
│       ├── repo/
│       │   └── hack-repo.js  # Storage repository
│       └── service/
│           └── hack-service.js # Business logic
├── icons/                    # Extension icons
└── test.html                # Test page for development
```

## Architecture

The codebase follows **SOLID principles** with clear separation of concerns:

- **Model Layer**: Business logic layer (`lib/`)
- **UI Layer**: User interface and interactions (`popup/`)

## Development Setup

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select this project directory
4. The extension will be loaded and ready for development

