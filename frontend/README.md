# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Theme System Documentation

### Overview
Our theme system supports light, dark, and system-preference themes.

### Usage

#### Using Theme Colors
Always use semantic color classes:
- `text-foreground` - Primary text
- `text-muted-foreground` - Secondary text
- `bg-background` - Main background
- `bg-card` - Card backgrounds
- `border-border` - Borders
- `text-primary` - Brand color (replaces hardcoded emerald)

#### Using the Theme Hook
```typescript
import { useTheme } from '@/providers/theme-provider';

const { theme, setTheme, resolvedTheme } = useTheme();
```

#### Checking Dark Mode
```typescript
import { useIsDarkMode } from '@/hooks/utils/useIsDarkMode';

const isDark = useIsDarkMode();
```

#### Using Theme Info Hook
```typescript
import { useThemeInfo } from '@/hooks/utils/useIsDarkMode';

const { theme, resolvedTheme, isDark, isLight, isSystem, setTheme } = useThemeInfo();
```

### Adding New Colors
1. Add CSS variable in src/index.css
2. Add Tailwind mapping in tailwind.config.js
3. Use semantic class names in components

### Best Practices
- Never use hardcoded colors (gray-500, emerald-400, etc.)
- Always use semantic color classes
- Test in both light and dark themes
- Consider system preference users
