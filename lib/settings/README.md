# Settings Architecture

## File Structure

```
lib/settings/
├── model/
│   └── settings.js              # Settings data model class
├── repo/
│   └── settings-repo.js         # Settings repository for storage
├── service/
│   └── settings-service.js      # Settings service for business logic
└── README.md                    # This documentation
```

## Architecture Pattern

This follows the **exact same pattern** as the hack system:

### Model Layer (`lib/settings/model/settings.js`)
- **Settings class** - Data model for user preferences
- Methods: `toJSON()`, `fromJSON()`, `isValid()`, `getDefaults()`
- Static methods for theme management
- Immutable theme configurations

### Repository Layer (`lib/settings/repo/settings-repo.js`)
- **SettingsRepository class** - Handles Chrome storage API
- Methods: `getSettings()`, `saveSettings()`, `clearSettings()`
- Storage abstraction and error handling
- Storage usage information

### Service Layer (`lib/settings/service/settings-service.js`)
- **SettingsService class** - Business logic and operations
- Uses Settings model instances via SettingsRepository
- Methods: `getAllSettings()`, `setTheme()`, `resetToDefaults()`, etc.
- Takes repository as constructor dependency

## Usage Example

```javascript
// Create the full stack (like hack system)
const settingsRepository = new SettingsRepository();
const settingsService = new SettingsService(settingsRepository);

// Get current settings
const settings = await settingsService.getAllSettings();
console.log(settings.selectedTheme); // 'cosmic-purple'

// Change theme
await settingsService.setTheme('sunset-glow');

// Get theme data
const currentTheme = await settingsService.getCurrentTheme();
console.log(currentTheme.gradient); // 'linear-gradient(...)'
```

## Benefits

1. **Consistent Architecture** - Identical to Hack system (Model → Repo → Service)
2. **Separation of Concerns** - Clear layer responsibilities
3. **Dependency Injection** - Service takes repository as parameter
4. **Testability** - Each layer can be tested independently
5. **Maintainability** - Easy to modify storage or business logic
6. **Extensibility** - Simple to add new settings or storage backends

## Layer Responsibilities

- **Model**: Data structure, validation, serialization
- **Repository**: Storage operations, Chrome API interaction
- **Service**: Business logic, data transformations, external API
