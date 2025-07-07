# Web Vibes

A chrome extension that let's you vibe hack any website on the fly, then save
your hacks for later use. Don't like the way a website looks? Change it! Want to
add some functionality? Add it! Want to remove some functionality? Remove it!
Wild, and crazy, and fun!

<img src="./doc/extension-screenshot.png" alt="Extension Screenshot" width="200" height="auto">

## 📥 Installation (Quick Install)

### Download & Install

1. **Download**: Get the latest release from
   [GitHub Releases](https://github.com/BenjaminBenetti/web-vibes/releases) -
   download the `web-vibes-extension-v*.zip` file
2. **Extract**: Right-click the ZIP file → "Extract All" → Choose a folder
3. **Open Chrome**: Type `chrome://extensions/` in your address bar
4. **Enable Developer Mode**: Toggle the switch in the top-right corner
5. **Load Extension**: Click "Load unpacked" → Select your extracted folder
6. **Done!** Look for the Web Vibes icon in your toolbar

### 🚨 Common Issues & Solutions

**"This extension is not from the Chrome Web Store"**

- This is normal! Click "Keep" to continue installation

**Extension doesn't appear**

- Make sure "Developer mode" is ON
- Try refreshing the Extensions page
- Restart Chrome if needed

**Can't find the extracted folder**

- Look for a folder named something like "web-vibes-extension-v1.2.0"
- Make sure you selected the folder, not the ZIP file

### 🔧 Using the Extension

1. **Click the Web Vibes icon** in your Chrome toolbar
2. **The side panel opens** with all the tools
3. **Navigate to any website** you want to modify
4. **Start vibing!** Use the tools to make changes

## Features

- Vibe modify any website using the browser extension on the fly. When you feel
  happy with your changes, you can save them for later use. All your saved
  changes will be applied automatically when you visit the website again.
- Manage your list of saved vibes. Disable and enable them at will. Allowing
  full control over your vibe hacks.
- Works with any AI agent, just bring your API key

## Architecture

The codebase follows **SOLID principles** with clear separation of concerns:

- **Model Layer**: Business logic layer (`lib/`)
- **UI Layer**: User interface and interactions (`popup/`)

## Development Setup

### For Developers

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select this project directory
5. The extension will be loaded and ready for development

### Building for Distribution

```bash
# Build the extension package
./build.sh
```

This creates a `web-vibes-extension-v*.zip` file ready for distribution.
