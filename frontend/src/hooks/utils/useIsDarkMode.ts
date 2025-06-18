import { useTheme } from '@/providers/theme-provider';

export function useIsDarkMode() {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === 'dark';
}

export function useThemeInfo() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  
  return {
    theme,
    resolvedTheme,
    isDark: resolvedTheme === 'dark',
    isLight: resolvedTheme === 'light',
    isSystem: theme === 'system',
    setTheme
  };
}