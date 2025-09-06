# Core Frontend Library

A self-contained Vue 3 component library with Quasar integration and theme support.

## Features

- 🎨 **Self-contained styling** - No external dependencies on host application styles
- 🌙 **Theme support** - Built-in light/dark theme compatibility with Quasar
- 🎯 **Customizable** - Override default colors and styles to match your brand
- 📱 **Responsive** - Mobile-first design with responsive utilities
- ♿ **Accessible** - Built with accessibility best practices
- 🔧 **TypeScript** - Full TypeScript support

## Installation

```bash
npm install @your-org/core-fe-lib
```

## Basic Usage

### 1. Import and Use Components

```vue
<template>
  <BUploaderBase
    :has-content="false"
    :uploading="false"
    @file-selected="handleFileSelected"
    @file-dropped="handleFileDropped"
  >
    <template #prompt>
      <div>Drop files here or click to upload</div>
    </template>
  </BUploaderBase>
</template>

<script setup>
import { BUploaderBase } from '@your-org/core-fe-lib'

function handleFileSelected(event) {
  console.log('File selected:', event.target.files)
}

function handleFileDropped(files) {
  console.log('Files dropped:', files)
}
</script>
```

### 2. Import Styles (Optional)

If you want to use the library's utility classes and global styles:

```scss
// In your main.scss or App.vue
@import '@your-org/core-fe-lib/styles/index.scss';
```

## Theme Customization

### Method 1: Override SCSS Variables

Create your theme configuration before importing the library:

```scss
// your-theme.scss
// Override library variables
$lib-primary: #1e40af;        // Your brand primary
$lib-secondary: #3b82f6;      // Your brand secondary
$lib-tertiary: #dbeafe;       // Your brand tertiary
$lib-accent: #f59e0b;         // Your brand accent

// Override semantic colors
$lib-success: #10b981;
$lib-error: #ef4444;
$lib-warning: #f59e0b;
$lib-info: #3b82f6;

// Override typography
$lib-font-family-sans: 'Your Font', system-ui, sans-serif;

// Then import the library styles
@import '@your-org/core-fe-lib/styles/index.scss';
```

### Method 2: CSS Custom Properties (Runtime)

For dynamic theme switching:

```javascript
// JavaScript theme switching
function setLibraryTheme(colors) {
  const root = document.documentElement;
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--lib-${key}`, value);
  });
}

// Usage
setLibraryTheme({
  primary: '#ff0000',
  secondary: '#00ff00',
  accent: '#0000ff'
});
```

## Available Variables

### Colors
- `$lib-primary` - Primary brand color
- `$lib-secondary` - Secondary brand color  
- `$lib-tertiary` - Tertiary brand color
- `$lib-accent` - Accent color
- `$lib-success` - Success state color
- `$lib-error` - Error state color
- `$lib-warning` - Warning state color
- `$lib-info` - Info state color
- `$lib-gray-*` - Neutral gray scale (50-900)

### Typography
- `$lib-font-family-sans` - Sans-serif font stack
- `$lib-font-family-mono` - Monospace font stack
- `$lib-font-sizes` - Font size map (xs, sm, base, lg, xl, 2xl, 3xl, 4xl)

### Spacing & Layout
- `$lib-spacing` - Spacing scale map (xs, sm, md, lg, xl, 2xl, 3xl)
- `$lib-radius-*` - Border radius values (sm, md, lg, xl)
- `$lib-shadow-*` - Box shadow values (sm, md, lg, xl)

### Transitions
- `$lib-transition-fast` - Fast transition (0.15s)
- `$lib-transition-normal` - Normal transition (0.3s)
- `$lib-transition-slow` - Slow transition (0.5s)

## Available Mixins

### Theme Mixins
```scss
@include lib-light-theme {
  // Styles for light theme
}

@include lib-dark-theme {
  // Styles for dark theme
}
```

### Responsive Mixins
```scss
@include lib-mobile {
  // Mobile styles (max-width: 767px)
}

@include lib-tablet {
  // Tablet styles (768px - 1023px)
}

@include lib-desktop {
  // Desktop styles (min-width: 1024px)
}
```

### Utility Mixins
```scss
@include lib-flex-center;      // Center content with flexbox
@include lib-flex-between;     // Space between with flexbox
@include lib-glass($opacity);  // Glass morphism effect
@include lib-truncate;         // Text truncation
@include lib-visually-hidden;  // Screen reader only content
```

## Components

### BUploaderBase

A flexible file upload component with drag & drop support.

#### Props
- `accept` (String) - File types to accept
- `hasContent` (Boolean) - Whether content is already uploaded
- `uploading` (Boolean) - Upload in progress state
- `loadingText` (String) - Loading text to display
- `progress` (Number) - Upload progress (0-1)
- `hasError` (Boolean) - Error state
- `multiple` (Boolean) - Allow multiple files

#### Events
- `file-selected` - Emitted when files are selected via input
- `file-dropped` - Emitted when files are dropped
- `zone-click` - Emitted when upload zone is clicked

#### Slots
- `prompt` - Upload prompt content
- `content` - Content display when files are uploaded
- `loading` - Custom loading indicator

## Development

### Building the Library

```bash
npm run build:lib
```

### Running Tests

```bash
npm test
```

### Development Server

```bash
npm run dev
```

## Browser Support

- Chrome 87+
- Firefox 78+
- Safari 13.1+
- Edge 88+

## License

MIT
