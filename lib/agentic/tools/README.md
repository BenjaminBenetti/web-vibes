# Agentic Tools

This directory contains all the agentic tools that allow the AI to interact with webpages and the extension.

## Available Tools

### Page Analysis Tools

#### SearchWebsiteHTMLTool
- **Purpose**: Search for HTML content using CSS selectors
- **Parameters**: 
  - `selector` (required): CSS selector to search for
  - `maxResults` (optional): Maximum number of results (default: 10)
  - `maxLength` (optional): Maximum length per element (default: 5000)
- **Returns**: HTML elements matching the selector with their content and metadata

#### InspectHTMLCSSTool
- **Purpose**: Inspect CSS styles applied to HTML elements
- **Parameters**:
  - `selector` (required): CSS selector to find elements to inspect
  - `maxResults` (optional): Maximum elements to inspect (default: 5)
  - `includeComputed` (optional): Include computed styles (default: true)
  - `includePseudo` (optional): Include pseudo-element styles (default: false)
- **Returns**: Detailed CSS information including:
  - **CSS Rules**: Actual CSS rules that match the element (sorted by specificity)
  - **Inline Styles**: Styles applied directly to the element
  - **Computed Styles**: Final computed values
  - **Pseudo-element Styles**: Styles for pseudo-elements (if enabled)
  - **Rule Details**: Selector, source stylesheet, specificity, and property values
  - **Element Metadata**: Tag name, selector, bounding rectangle, visibility

#### SearchWebsiteByKeywordTool
- **Purpose**: Search webpage content by keyword with surrounding context
- **Parameters**:
  - `keyword` (required): Keyword or phrase to search for
  - `maxResults` (optional): Maximum matches to return (default: 10)
  - `contextLines` (optional): Lines of context before/after (default: 3)
  - `caseSensitive` (optional): Case-sensitive search (default: false)
  - `searchInText` (optional): Search in text content (default: true)
  - `searchInHTML` (optional): Search in HTML attributes/tags (default: false)
- **Returns**: Keyword matches with highlighted context and element information

### Hack Management Tools

#### SaveJSTool
- **Purpose**: Save JavaScript code as a hack
- **Parameters**: JavaScript code and metadata
- **Returns**: Created hack information

#### ReadJSTool
- **Purpose**: Read existing JavaScript hacks
- **Parameters**: Hack ID or search criteria
- **Returns**: Hack content and metadata

#### SaveCSSTool
- **Purpose**: Save CSS code as a hack
- **Parameters**: CSS code and metadata
- **Returns**: Created hack information

#### ReadCSSTool
- **Purpose**: Read existing CSS hacks
- **Parameters**: Hack ID or search criteria
- **Returns**: Hack content and metadata

#### ApplyHackTool
- **Purpose**: Apply a hack to the current webpage
- **Parameters**: Hack ID or hack data
- **Returns**: Application status and results

## Usage Examples

### Inspecting CSS Styles
```javascript
// Inspect styles for all buttons
const result = await inspectHTMLCSS({
  selector: 'button',
  maxResults: 3,
  includeComputed: true
});

// The result now includes:
// - cssRules: Array of actual CSS rules that match the element
// - styles.inline: Inline styles applied directly
// - styles.computed: Final computed values
// - styles.pseudo: Pseudo-element styles (if enabled)

// Example cssRules structure:
// [
//   {
//     type: 'style',
//     selector: '.btn-primary',
//     cssText: '.btn-primary { background: blue; color: white; }',
//     style: { background: { value: 'blue', important: false } },
//     source: { href: 'styles.css', type: 'external' },
//     specificity: 10,
//     ruleIndex: 5,
//     sheetIndex: 2
//   }
// ]
```

### Searching by Keyword
```javascript
// Search for "login" with context
const result = await searchWebsiteByKeyword({
  keyword: 'login',
  maxResults: 5,
  contextLines: 2,
  caseSensitive: false
});
```

### Finding HTML Elements
```javascript
// Find all navigation elements
const result = await searchWebsiteHTML({
  selector: 'nav, .navigation, #nav',
  maxResults: 10
});
```

## Tool Architecture

All tools follow the same pattern:
1. **Tool Class**: Extends `AgenticTool` with specific parameters and logic
2. **Content Script Handler**: Processes the request in the webpage context
3. **Message Routing**: Chrome extension messaging between popup and content script
4. **Response Formatting**: Consistent success/error response structure

## Adding New Tools

To add a new tool:

1. Create the tool class in `lib/agentic/tools/`
2. Create the content script handler in `content/handlers/`
3. Add message type to `lib/constants/message-types.js`
4. Update message router in `content/handlers/message-router.js`
5. Add tool to `lib/agentic/index.js`
6. Include script in `popup/chat/chat.html`
7. Update manifest.json content scripts array

## Error Handling

All tools include comprehensive error handling:
- Parameter validation
- Chrome API error handling
- Content script communication errors
- User-friendly error messages
- Detailed logging for debugging 