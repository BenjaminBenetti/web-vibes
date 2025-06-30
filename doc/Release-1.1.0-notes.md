# Web Vibes Release Notes

## Version 1.1.0 - Major Architecture Update
*Release Date: June 30, 2025*

### 🎉 Major Features & Changes

#### 🔄 Complete Migration to Chrome Side Panel
- **Breaking Change**: Completely migrated from Chrome popup extension to Chrome side panel extension
- Enhanced user experience with persistent, dockable interface
- Improved workspace for managing vibes and AI interactions
- Better integration with Chrome's native UI patterns

#### 🤖 Advanced AI Tools & Capabilities
- **New AI Tools**: Added comprehensive website inspection capabilities
  - `inspect-html-css`: Deep CSS and HTML structure analysis
  - `search-website-by-keyword`: Smart keyword-based content discovery
  - `search-website-html`: HTML structure exploration
  - `search-website-javascript`: JavaScript code analysis and inspection
- **Enhanced Context Awareness**: AI now preloads CSS and JS vibe changes when editing, enabling more informed modifications
- **Improved Tool Output**: Cleaner AI responses with better tool call result formatting

#### 📁 Import/Export System
- **Vibe Import**: Complete import functionality for sharing vibes between users
- **Smart Export**: Exported vibes now automatically use the hostname as filename for better organization
- **File Management**: Improved file naming conventions and export behavior

#### ⚙️ Advanced Settings & Configuration
- **Gemini Model Selection**: Added support for different Gemini AI models
- **Token Limit Controls**: Configurable limits to manage AI context size and prevent runaway usage
- **Message Size Management**: Intelligent context trimming to optimize AI performance
- **Refactored Settings Architecture**: Separated Gemini settings into dedicated configuration object

#### 🎯 **NEW: Visual Element Targeting System**
- **Interactive Element Selection**: Brand new visual targeting system that allows users to click and select specific elements on any webpage
- **Precision Modifications**: Target exact DOM elements for surgical CSS and JavaScript modifications
- **Real-time Visual Feedback**: Intuitive hover effects and selection indicators guide users to the perfect element
- **Smart Element Detection**: Intelligent element identification with visual overlays and highlighting
- **Seamless AI Integration**: Selected elements are automatically passed to AI tools for contextual modifications

### 🛠️ Technical Improvements

#### 🔧 Bug Fixes & Stability
- **Vibe Conflict Resolution**: Fixed vibes fighting with themselves during edit operations
- **Save/Refresh Styling**: Improved button styling and positioning for save/refresh operations
- **Auto-Save Prevention**: Fixed vibes saving even when the user did not explicitly saved during edits
- **Application Reliability**: Added refresh button to help with vibes not applying correctly after multiple edits

#### 📊 Context Management
- **Smart Context Trimming**: Automatic context size management to prevent AI getting stuck
- **Message Size Limits**: Configurable limits to control conversation context growth
- **Tool Response Filtering**: Cleaner user experience by hiding internal tool communications

### 🎨 UI/UX Enhancements
- **Modern Side Panel Design**: Complete visual redesign for side panel interface
- **Consistent Styling**: Unified CSS architecture with proper theme support
- **Responsive Layout**: Better adaptation to different screen sizes and panel widths
- **Material Design Integration**: Enhanced use of Material Icons throughout the interface


---

**Technical Notes**: This release represents a major milestone in the evolution of Web Vibes, transitioning from a simple popup extension to a full-featured side panel application with advanced AI capabilities and comprehensive vibe management.