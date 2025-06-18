export const THEME_COLORS = {
  light: {
    background: '255 255 255',
    foreground: '17 24 39',
    card: '255 255 255',
    cardForeground: '17 24 39',
    popover: '255 255 255',
    popoverForeground: '17 24 39',
    primary: '16 185 129',
    primaryForeground: '255 255 255',
    secondary: '243 244 246',
    secondaryForeground: '17 24 39',
    muted: '243 244 246',
    mutedForeground: '107 114 128',
    accent: '16 185 129',
    accentForeground: '255 255 255',
    destructive: '239 68 68',
    destructiveForeground: '255 255 255',
    border: '229 231 235',
    input: '229 231 235',
    ring: '16 185 129',
    success: '34 197 94',
    successForeground: '255 255 255',
    warning: '234 179 8',
    warningForeground: '255 255 255',
    info: '59 130 246',
    infoForeground: '255 255 255',
  },
  dark: {
    background: '17 24 39',
    foreground: '243 244 246',
    card: '31 41 55',
    cardForeground: '243 244 246',
    popover: '31 41 55',
    popoverForeground: '243 244 246',
    primary: '16 185 129',
    primaryForeground: '255 255 255',
    secondary: '55 65 81',
    secondaryForeground: '243 244 246',
    muted: '55 65 81',
    mutedForeground: '156 163 175',
    accent: '16 185 129',
    accentForeground: '17 24 39',
    destructive: '185 28 28',
    destructiveForeground: '255 255 255',
    border: '55 65 81',
    input: '55 65 81',
    ring: '16 185 129',
    success: '34 197 94',
    successForeground: '255 255 255',
    warning: '234 179 8',
    warningForeground: '17 24 39',
    info: '59 130 246',
    infoForeground: '255 255 255',
  },
} as const;

export const THEME_GRADIENTS = {
  light: {
    primary: 'linear-gradient(to right, rgb(16 185 129), rgb(59 130 246))',
    secondary: 'linear-gradient(to bottom, rgb(243 244 246), rgb(229 231 235))',
    accent: 'linear-gradient(135deg, rgb(16 185 129), rgb(34 197 94))',
  },
  dark: {
    primary: 'linear-gradient(to right, rgb(16 185 129), rgb(59 130 246))',
    secondary: 'linear-gradient(to bottom, rgb(55 65 81), rgb(31 41 55))',
    accent: 'linear-gradient(135deg, rgb(16 185 129), rgb(34 197 94))',
  },
} as const;

export const THEME_CONFIG = {
  radius: '0.5rem',
  defaultTheme: 'dark' as const,
  storageKey: 'app-theme',
} as const;

export type ThemeColor = keyof typeof THEME_COLORS.light;
export type ThemeGradient = keyof typeof THEME_GRADIENTS.light;
export type Theme = 'light' | 'dark' | 'system';