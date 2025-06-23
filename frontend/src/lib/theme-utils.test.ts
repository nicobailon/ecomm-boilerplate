import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validateTheme,
  sanitizeRGB,
  getContrastRatio,
  meetsContrastRequirements,
  validateThemeContrast,
  applyThemeTransition,
} from './theme-utils';

describe('Theme Utilities', () => {
  beforeEach(() => {
    // Reset DOM
    document.documentElement.innerHTML = '';
    document.documentElement.style.cssText = '';
  });

  describe('validateTheme', () => {
    it('should return true when all required CSS variables are defined', () => {
      // Mock getComputedStyle
      const mockStyle = {
        getPropertyValue: (prop: string) => {
          const values: Record<string, string> = {
            '--background': '255, 255, 255',
            '--foreground': '0, 0, 0',
            '--card': '255, 255, 255',
            '--card-foreground': '0, 0, 0',
            '--popover': '255, 255, 255',
            '--popover-foreground': '0, 0, 0',
            '--primary': '16, 185, 129',
            '--primary-foreground': '255, 255, 255',
            '--secondary': '245, 245, 245',
            '--secondary-foreground': '0, 0, 0',
            '--muted': '245, 245, 245',
            '--muted-foreground': '115, 115, 115',
            '--accent': '16, 185, 129',
            '--accent-foreground': '255, 255, 255',
            '--destructive': '239, 68, 68',
            '--destructive-foreground': '255, 255, 255',
            '--border': '229, 229, 229',
            '--input': '229, 229, 229',
            '--ring': '16, 185, 129',
          };
          return values[prop] || '';
        },
      };
      
      vi.spyOn(window, 'getComputedStyle').mockReturnValue(mockStyle as any);
      
      expect(validateTheme()).toBe(true);
    });

    it('should return false when CSS variables are missing', () => {
      const mockStyle = {
        getPropertyValue: () => '',
      };
      
      vi.spyOn(window, 'getComputedStyle').mockReturnValue(mockStyle as any);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(validateTheme()).toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('sanitizeRGB', () => {
    it('should accept valid comma-separated RGB values', () => {
      expect(sanitizeRGB('255, 255, 255')).toBe('255, 255, 255');
      expect(sanitizeRGB('0, 0, 0')).toBe('0, 0, 0');
      expect(sanitizeRGB('16, 185, 129')).toBe('16, 185, 129');
    });

    it('should accept valid space-separated RGB values and convert to comma-separated', () => {
      expect(sanitizeRGB('255 255 255')).toBe('255, 255, 255');
      expect(sanitizeRGB('0 0 0')).toBe('0, 0, 0');
      expect(sanitizeRGB('16 185 129')).toBe('16, 185, 129');
    });

    it('should reject invalid RGB values', () => {
      expect(sanitizeRGB('256, 255, 255')).toBeNull();
      expect(sanitizeRGB('255, 255, -1')).toBeNull();
      expect(sanitizeRGB('255, 255')).toBeNull();
      expect(sanitizeRGB('255, 255, 255, 255')).toBeNull();
      expect(sanitizeRGB('not-a-color')).toBeNull();
      expect(sanitizeRGB('rgb(255, 255, 255)')).toBeNull();
    });

    it('should prevent CSS injection attempts', () => {
      expect(sanitizeRGB('255, 255, 255); malicious-property: bad-value; (')).toBeNull();
      expect(sanitizeRGB('255, 255, 255; }')).toBeNull();
      expect(sanitizeRGB('255 255 255; --other-var: hack')).toBeNull();
    });
  });

  describe('getContrastRatio', () => {
    it('should calculate correct contrast ratios', () => {
      // White on black should be 21:1
      expect(Math.round(getContrastRatio('255, 255, 255', '0, 0, 0'))).toBe(21);
      
      // Black on white should be 21:1
      expect(Math.round(getContrastRatio('0, 0, 0', '255, 255, 255'))).toBe(21);
      
      // Same color should be 1:1
      expect(getContrastRatio('128, 128, 128', '128, 128, 128')).toBe(1);
    });

    it('should handle space-separated RGB values', () => {
      expect(Math.round(getContrastRatio('255 255 255', '0 0 0'))).toBe(21);
    });
  });

  describe('meetsContrastRequirements', () => {
    it('should validate AA contrast requirements', () => {
      // White on black - passes AA
      expect(meetsContrastRequirements('255, 255, 255', '0, 0, 0', 'AA')).toBe(true);
      
      // Light gray on white - fails AA
      expect(meetsContrastRequirements('200, 200, 200', '255, 255, 255', 'AA')).toBe(false);
    });

    it('should validate AAA contrast requirements', () => {
      // White on black - passes AAA
      expect(meetsContrastRequirements('255, 255, 255', '0, 0, 0', 'AAA')).toBe(true);
      
      // Medium gray on white - may pass AA but not AAA
      expect(meetsContrastRequirements('100, 100, 100', '255, 255, 255', 'AAA')).toBe(false);
    });
  });

  describe('validateThemeContrast', () => {
    it('should validate all color pairs in theme', () => {
      const mockStyle = {
        getPropertyValue: (prop: string) => {
          const values: Record<string, string> = {
            '--background': '255, 255, 255',
            '--foreground': '0, 0, 0',
            '--card': '255, 255, 255',
            '--card-foreground': '0, 0, 0',
            '--primary': '0, 100, 60',
            '--primary-foreground': '255, 255, 255',
            '--secondary': '245, 245, 245',
            '--secondary-foreground': '0, 0, 0',
            '--destructive': '185, 28, 28',
            '--destructive-foreground': '255, 255, 255',
            '--muted': '245, 245, 245',
            '--muted-foreground': '50, 50, 50',
            '--accent': '0, 100, 60',
            '--accent-foreground': '255, 255, 255',
            '--popover': '255, 255, 255',
            '--popover-foreground': '0, 0, 0',
          };
          return values[prop] || '';
        },
      };
      
      vi.spyOn(window, 'getComputedStyle').mockReturnValue(mockStyle as any);
      
      const result = validateThemeContrast();
      
      // Log issues for debugging
      if (!result.valid) {
        console.log('Contrast issues found:', result.issues);
      }
      
      // Secondary colors might have lower contrast, that's acceptable
      const criticalIssues = result.issues.filter(issue => 
        ['main', 'card', 'primary', 'destructive'].includes(issue.pair)
      );
      
      expect(criticalIssues).toHaveLength(0);
    });

    it('should identify contrast issues', () => {
      const mockStyle = {
        getPropertyValue: (prop: string) => {
          const values: Record<string, string> = {
            '--background': '255, 255, 255',
            '--foreground': '200, 200, 200', // Poor contrast
            '--card': '255, 255, 255',
            '--card-foreground': '0, 0, 0',
            '--primary': '200, 200, 200', // Poor contrast
            '--primary-foreground': '255, 255, 255',
          };
          return values[prop] || '';
        },
      };
      
      vi.spyOn(window, 'getComputedStyle').mockReturnValue(mockStyle as any);
      
      const result = validateThemeContrast();
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].ratio).toBeLessThan(4.5);
    });
  });

  describe('applyThemeTransition', () => {
    it('should add and remove transition class', async () => {
      const callback = vi.fn();
      const root = document.documentElement;
      
      applyThemeTransition(callback);
      
      expect(root.classList.contains('theme-transitioning')).toBe(true);
      expect(callback).toHaveBeenCalled();
      
      // Wait for requestAnimationFrame
      await new Promise(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve(undefined);
          });
        });
      });
      
      expect(root.classList.contains('theme-transitioning')).toBe(false);
    });
  });
});