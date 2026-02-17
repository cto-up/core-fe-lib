# Integration Guide: Using Core-FE-Lib Variables in Host Applications

This guide explains how to properly integrate the Core-FE-Lib component library with your host application, ensuring that components can access your application's design system variables while maintaining library independence.

## Problem Statement

Library must not be coupled with host application variables.

## Solution: Self-Contained Library with Override Capability

The library now includes its own complete set of variables and mixins, but allows host applications to override them.

### 1. Library Structure

```
frontend/core-fe-lib/lib/styles/
├── _variables.scss      # Self-contained variables with !default
├── _mixins.scss         # Self-contained mixins
├── index.scss           # Main entry point
└── theme-config.scss    # Configuration examples
```

### 2. Component Implementation

Components now use library-prefixed variables:

```scss
// ✅ Components use self-contained variables
<style lang="scss" scoped>
@import '../styles/variables';
@import '../styles/mixins';

.upload-zone {
  @include lib-light-theme {
    border: 5px dashed rgba($lib-secondary, 0.6);
    background: linear-gradient(
      135deg,
      mix($lib-tertiary, $lib-white, 30%) 0%,
      mix($lib-secondary, $lib-white, 20%) 100%
    );
  }
}
</style>
```

## Integration Methods

### Method 1: Use Library Defaults (Simplest)

Just import and use components - they work out of the box:

```vue
<!-- Host application component -->
<template>
  <BUploaderBase @file-selected="handleFile" />
</template>

<script setup>
import { BUploaderBase } from '@your-org/core-fe-lib';
</script>
```

### Method 2: Override Variables to Match Your Brand

Create a theme file in your host application:

```scss
// host-app/src/styles/library-theme.scss

// Override library variables to match your brand
$lib-primary: #4a90a4; // Use your app's primary color
$lib-secondary: #9cc7c6; // Use your app's secondary color
$lib-tertiary: #f6e6d8; // Use your app's tertiary color

// Map your existing variables to library variables
$lib-primary: $primary; // If you have $primary defined
$lib-secondary: $secondary; // If you have $secondary defined
$lib-gray-200: $gray-200; // Map your grays

// Import library styles AFTER overriding variables
@import '@your-org/core-fe-lib/styles/index.scss';
```

Then import this in your main application:

```scss
// host-app/src/css/app.scss
@import 'variables'; // Your app variables
@import 'library-theme'; // Library theme overrides
@import 'mixins'; // Your app mixins
// ... rest of your styles
```

### Method 3: Dynamic Theme Integration

For applications with runtime theme switching:

```javascript
// host-app/src/utils/theme.js
export function syncLibraryTheme(appTheme) {
  const root = document.documentElement;

  // Map your app's theme to library variables
  const libraryTheme = {
    primary: appTheme.colors.primary,
    secondary: appTheme.colors.secondary,
    tertiary: appTheme.colors.tertiary,
    'gray-200': appTheme.colors.gray[200],
    'gray-600': appTheme.colors.gray[600],
    // ... map other colors
  };

  // Apply to CSS custom properties
  Object.entries(libraryTheme).forEach(([key, value]) => {
    root.style.setProperty(`--lib-${key}`, value);
  });
}

// Usage in your app
import { syncLibraryTheme } from './utils/theme';

// When your app theme changes
function changeTheme(newTheme) {
  // Update your app theme
  updateAppTheme(newTheme);

  // Sync library theme
  syncLibraryTheme(newTheme);
}
```

### Method 4: Quasar Integration

For Quasar applications, integrate with Quasar's theme system:

```scss
// quasar.variables.sass
$primary: #4a90a4
$secondary: #9cc7c6
$tertiary: #f6e6d8

// Map Quasar variables to library variables
$lib-primary: $primary
$lib-secondary: $secondary
$lib-tertiary: $tertiary
```

## Best Practices

### 1. Library Development

- ✅ Always use `!default` for variables
- ✅ Prefix library variables with `lib-`
- ✅ Include complete fallback values
- ✅ Test components in isolation
- ✅ Document override capabilities

### 2. Host Application Integration

- ✅ Override variables before importing library styles
- ✅ Use semantic mapping (your-primary → lib-primary)
- ✅ Test with different themes
- ✅ Document your theme integration

### 3. Maintenance

- ✅ Keep library variables in sync with design system
- ✅ Version control theme configurations
- ✅ Test library updates with your overrides

## Migration from Dependent Components

If you have existing components that depend on host application variables:

1. **Identify dependencies**: Search for undefined variables
2. **Create library variables**: Add to `_variables.scss` with `!default`
3. **Update component imports**: Use library variables
4. **Test independence**: Build component in isolation
5. **Document overrides**: Update integration guide

## Example: Complete Integration

```scss
// host-app/src/styles/main.scss

// 1. Define your app variables
@import 'variables';

// 2. Override library variables to match your brand
$lib-primary: $primary;
$lib-secondary: $secondary;
$lib-tertiary: $tertiary;
$lib-accent: $accent;

// Map your grays
$lib-gray-50: $gray-50;
$lib-gray-100: $gray-100;
$lib-gray-200: $gray-200;
$lib-gray-300: $gray-300;
$lib-gray-600: $gray-600;
$lib-gray-700: $gray-700;
$lib-gray-800: $gray-800;

// Override typography
$lib-font-family-sans: $font-family-sans;

// 3. Import library styles
@import '@your-org/core-fe-lib/styles/index.scss';

// 4. Continue with your app styles
@import 'mixins';
@import 'components/buttons';
// ... rest of your styles
```

This approach ensures:

- ✅ Library components work independently
- ✅ Components match your brand when integrated
- ✅ No breaking changes when library is updated
- ✅ Easy to maintain and test
