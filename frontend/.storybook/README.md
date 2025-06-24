# Storybook Configuration

This directory contains the configuration for Storybook v9.0.12 for the MERN E-commerce frontend.

## Important Notes

### Storybook Add-ons for v9

**Note**: `@storybook/addon-essentials` is not available for Storybook v9.0.12. The addon-essentials package for v9 is still in alpha and not compatible with the stable v9.0.12 release. 

Instead, we've configured individual essential addons that are available for v9:
- `@storybook/addon-docs` - Component documentation
- `@storybook/addon-themes` - Theme switching support
- `@storybook/addon-a11y` - Accessibility testing
- `@storybook/addon-onboarding` - New user onboarding

This provides the core functionality of addon-essentials while maintaining compatibility with v9.0.12.

## Available Scripts

```bash
# Start Storybook development server
npm run storybook

# Build static Storybook
npm run build-storybook

# Run Storybook tests
npm run test-storybook

# Run tests in CI mode
npm run test-storybook:ci
```

## Features

### Interactive Stories
Button components include interactive stories demonstrating state management:
- Loading state transitions
- Counter with increment/decrement
- Toggle states

### Component Documentation
All stories use the `tags: ['autodocs']` annotation to automatically generate documentation.

### Accessibility Testing
The a11y addon provides automated accessibility checks for all stories.

### Test Runner
Configured with `@storybook/test-runner` for automated story testing. Configuration is in `test-runner.ts`.

### Build Optimization
Manual chunking strategy for optimal bundle sizes:
- React and React DOM in separate vendor chunk
- UI libraries (Radix UI) grouped together
- Form libraries separated
- Utility libraries in their own chunk

## Story Organization

Stories are co-located with their components:
- Component stories: `/src/components/**/[Component].stories.tsx`
- MDX documentation: `/src/stories/*.mdx`

## Security

All user-generated content in stories is sanitized to prevent XSV injection, particularly in placeholder image generation.