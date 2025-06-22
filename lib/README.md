# Web Vibes Library

This directory contains the core business logic and data models for the Web Vibes Chrome extension, organized following clean architecture principles.

## 📁 Directory Structure

```
lib/
├── index.js                    # Library index and factory functions
└── hack/                       # Hack-related modules
    ├── model/
    │   └── hack.js             # Hack data model
    ├── repo/
    │   └── hack-repo.js        # Data repository for Chrome storage
    └── service/
        └── hack-service.js     # Business logic and operations
```

## 🏗️ Architecture

### **Model Layer** (`hack/model/`)
- **`Hack`** - Core data model representing a user hack
- Handles data validation and serialization
- Immutable operations with clear interfaces

### **Repository Layer** (`hack/repo/`)
- **`HackRepository`** - Data access layer for Chrome storage
- Abstracts storage implementation details
- Handles data persistence and retrieval

### **Service Layer** (`hack/service/`)
- **`HackService`** - Business logic and application operations
- Coordinates between UI and data layers
- Handles Chrome extension APIs (tabs, messaging)

## 🔧 Usage

### Loading the Library

Include the files in your HTML in dependency order:

```html
<!-- Load core models first -->
<script src="../lib/hack/model/hack.js"></script>
<!-- Then repositories -->
<script src="../lib/hack/repo/hack-repo.js"></script>
<!-- Then services -->
<script src="../lib/hack/service/hack-service.js"></script>
<!-- Finally your application code -->
<script src="your-app.js"></script>
```

### Creating Service Instances

```javascript
// Create repository and service
const repository = new HackRepository();
const hackService = new HackService(repository);

// Use the service
const { hostname, hacks } = await hackService.getHacksForCurrentSite();
```

### Using the Factory (Optional)

```html
<script src="../lib/index.js"></script>
<script>
// Check if library is loaded
if (WebVibesLib.checkLoaded()) {
    const lib = WebVibesLib.create();
    const hackService = lib.createHackService();
}
</script>
```

## 📝 Class Responsibilities

### Hack Model
- Represents a single hack with metadata
- Validates hack data
- Handles serialization/deserialization
- Provides toggle functionality

### HackRepository
- Manages Chrome storage operations
- Organizes hacks by hostname
- Provides CRUD operations
- Handles storage errors gracefully

### HackService
- Coordinates business operations
- Manages current tab information
- Handles Chrome extension messaging
- Provides high-level hack operations

## 🧪 Testing

Each class is designed to be testable in isolation:

```javascript
// Mock repository for testing
class MockHackRepository {
    constructor() {
        this.data = {};
    }
    
    async getHacksForSite(hostname) {
        return this.data[hostname] || [];
    }
    // ... other methods
}

// Test service with mock
const mockRepo = new MockHackRepository();
const service = new HackService(mockRepo);
```

## 🔄 Data Flow

1. **UI Layer** (popup.js) → Service Layer
2. **Service Layer** → Repository Layer
3. **Repository Layer** → Chrome Storage API
4. **Chrome Storage** ↔ Local Browser Storage

## 📈 Future Enhancements

- Add TypeScript definitions
- Implement ES6 modules with build process
- Add comprehensive unit tests
- Create additional repositories (sync storage, file export)
- Add caching layer for performance

## 💡 Design Principles

- **Single Responsibility**: Each class has one clear purpose
- **Dependency Inversion**: Classes depend on abstractions
- **Open/Closed**: Easy to extend without modifying existing code
- **Interface Segregation**: Clean, minimal interfaces
- **DRY**: No code duplication across layers
