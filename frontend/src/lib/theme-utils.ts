/**
 * Theme validation and utility functions
 */

const REQUIRED_CSS_VARIABLES = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'destructive-foreground',
  'border',
  'input',
  'ring',
] as const;

/**
 * Validates that all required CSS variables are defined for the current theme
 */
export function validateTheme(element: HTMLElement = document.documentElement): boolean {
  const computedStyle = getComputedStyle(element);
  
  const missingVariables: string[] = [];
  
  for (const variable of REQUIRED_CSS_VARIABLES) {
    const value = computedStyle.getPropertyValue(`--${variable}`).trim();
    if (!value) {
      missingVariables.push(variable);
    }
  }
  
  if (missingVariables.length > 0) {
    console.error('Missing theme variables:', missingVariables);
    return false;
  }
  
  return true;
}

/**
 * Sanitizes RGB values to prevent CSS injection
 */
export function sanitizeRGB(value: string): string | null {
  // Support both space-separated and comma-separated formats
  const match = value.match(/^(\d{1,3})[,\s]+(\d{1,3})[,\s]+(\d{1,3})$/);
  if (!match) return null;
  
  const [_, r, g, b] = match;
  const values = [r, g, b].map(Number);
  
  if (values.every(n => n >= 0 && n <= 255)) {
    // Always return comma-separated format
    return `${values[0]}, ${values[1]}, ${values[2]}`;
  }
  
  return null;
}

/**
 * Calculates contrast ratio between two RGB colors
 * Based on WCAG 2.1 guidelines
 */
export function getContrastRatio(rgb1: string, rgb2: string): number {
  const parseRGB = (rgb: string) => {
    // Support both space-separated and comma-separated formats
    const parts = rgb.split(/[,\s]+/).map(Number);
    return { r: parts[0], g: parts[1], b: parts[2] };
  };
  
  const getLuminance = (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  
  const color1 = parseRGB(rgb1);
  const color2 = parseRGB(rgb2);
  
  const lum1 = getLuminance(color1.r, color1.g, color1.b);
  const lum2 = getLuminance(color2.r, color2.g, color2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Checks if a color combination meets WCAG AA standards
 */
export function meetsContrastRequirements(
  foregroundRGB: string,
  backgroundRGB: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  const ratio = getContrastRatio(foregroundRGB, backgroundRGB);
  
  // WCAG 2.1 Level AA requires 4.5:1 for normal text, 3:1 for large text
  // Level AAA requires 7:1 for normal text, 4.5:1 for large text
  const minRatio = level === 'AA' ? 4.5 : 7;
  
  return ratio >= minRatio;
}

/**
 * Validates all color combinations in the current theme
 */
export function validateThemeContrast(element: HTMLElement = document.documentElement): {
  valid: boolean;
  issues: Array<{ pair: string; ratio: number; required: number }>;
} {
  const computedStyle = getComputedStyle(element);
  const issues: Array<{ pair: string; ratio: number; required: number }> = [];
  
  const colorPairs = [
    { bg: 'background', fg: 'foreground', name: 'main' },
    { bg: 'card', fg: 'card-foreground', name: 'card' },
    { bg: 'primary', fg: 'primary-foreground', name: 'primary' },
    { bg: 'secondary', fg: 'secondary-foreground', name: 'secondary' },
    { bg: 'destructive', fg: 'destructive-foreground', name: 'destructive' },
    { bg: 'muted', fg: 'muted-foreground', name: 'muted' },
    { bg: 'accent', fg: 'accent-foreground', name: 'accent' },
    { bg: 'popover', fg: 'popover-foreground', name: 'popover' },
  ];
  
  for (const { bg, fg, name } of colorPairs) {
    const bgValue = computedStyle.getPropertyValue(`--${bg}`).trim();
    const fgValue = computedStyle.getPropertyValue(`--${fg}`).trim();
    
    if (bgValue && fgValue) {
      const ratio = getContrastRatio(fgValue, bgValue);
      if (ratio < 4.5) {
        issues.push({
          pair: name,
          ratio: Math.round(ratio * 100) / 100,
          required: 4.5,
        });
      }
    }
  }
  
  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Applies theme transition class to prevent jarring changes
 */
export function applyThemeTransition(callback: () => void): void {
  const root = document.documentElement;
  root.classList.add('theme-transitioning');
  
  callback();
  
  // Remove the class after a frame to ensure the transition is applied
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.classList.remove('theme-transitioning');
    });
  });
}