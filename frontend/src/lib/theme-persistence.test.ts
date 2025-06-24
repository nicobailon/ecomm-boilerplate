import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Theme Persistence', () => {
  const STORAGE_KEY = 'vite-ui-theme';
  let originalLocalStorage: Storage;

  beforeEach(() => {
    // Save original localStorage
    originalLocalStorage = window.localStorage;
    
    // Reset DOM
    document.documentElement.className = '';
    document.documentElement.style.cssText = '';
    
    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    // Restore original localStorage
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
    });
  });

  describe('theme-init.js behavior', () => {
    // Simulate the theme-init.js script execution
    const executeThemeInit = () => {
      const script = `
        (function() {
          const STORAGE_KEY = 'vite-ui-theme';
          const DEFAULT_THEME = 'light';
          const VALID_THEMES = ['light', 'dark', 'modern', 'playful'];
          
          function isValidTheme(theme) {
            return VALID_THEMES.includes(theme);
          }
          
          try {
            const savedTheme = localStorage.getItem(STORAGE_KEY);
            let theme = DEFAULT_THEME;
            
            if (savedTheme) {
              try {
                const parsedTheme = JSON.parse(savedTheme);
                if (isValidTheme(parsedTheme)) {
                  theme = parsedTheme;
                } else {
                  localStorage.removeItem(STORAGE_KEY);
                }
              } catch (parseError) {
                localStorage.removeItem(STORAGE_KEY);
              }
            }
            
            const root = document.documentElement;
            const themeClasses = ['dark', 'theme-modern', 'theme-playful'];
            
            themeClasses.forEach(cls => root.classList.remove(cls));
            
            switch (theme) {
              case 'dark':
                root.classList.add('dark');
                break;
              case 'modern':
                root.classList.add('theme-modern');
                break;
              case 'playful':
                root.classList.add('theme-playful');
                break;
            }
            
            root.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
          } catch (e) {
            console.error('Failed to initialize theme:', e);
          }
        })();
      `;
      eval(script);
    };

    it('should apply default theme when no saved theme exists', () => {
      executeThemeInit();
      
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(document.documentElement.classList.contains('theme-modern')).toBe(false);
      expect(document.documentElement.classList.contains('theme-playful')).toBe(false);
      expect(document.documentElement.style.colorScheme).toBe('light');
    });

    it('should apply saved dark theme', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify('dark'));
      executeThemeInit();
      
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.style.colorScheme).toBe('dark');
    });

    it('should apply saved modern theme', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify('modern'));
      executeThemeInit();
      
      expect(document.documentElement.classList.contains('theme-modern')).toBe(true);
      expect(document.documentElement.style.colorScheme).toBe('light');
    });

    it('should apply saved playful theme', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify('playful'));
      executeThemeInit();
      
      expect(document.documentElement.classList.contains('theme-playful')).toBe(true);
      expect(document.documentElement.style.colorScheme).toBe('light');
    });

    it('should reject invalid theme values', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify('invalid-theme'));
      executeThemeInit();
      
      // Should fall back to default (light)
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      expect(document.documentElement.classList.contains('theme-modern')).toBe(false);
      expect(document.documentElement.classList.contains('theme-playful')).toBe(false);
      
      // Invalid theme should be removed from storage
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('should handle malformed JSON in localStorage', () => {
      localStorage.setItem(STORAGE_KEY, 'not-valid-json');
      executeThemeInit();
      
      // Should fall back to default (light)
      expect(document.documentElement.classList.contains('dark')).toBe(false);
      
      // Malformed data should be removed
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const mockLocalStorage = {
        getItem: () => {
          throw new Error('Storage error');
        },
        removeItem: () => {
          // Mock implementation
        },
        setItem: () => {
          // Mock implementation
        },
        clear: () => {
          // Mock implementation
        },
        length: 0,
        key: () => null,
      };
      
      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true,
      });
      
      // Should not throw
      expect(() => executeThemeInit()).not.toThrow();
    });

    it('should remove all theme classes before applying new one', () => {
      // Pre-set multiple theme classes
      document.documentElement.classList.add('dark', 'theme-modern', 'theme-playful');
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify('dark'));
      executeThemeInit();
      
      // Should only have the dark class
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(document.documentElement.classList.contains('theme-modern')).toBe(false);
      expect(document.documentElement.classList.contains('theme-playful')).toBe(false);
    });
  });

  describe('Theme switching behavior', () => {
    it('should persist theme changes to localStorage', () => {
      const setTheme = (theme: string) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
      };
      
      setTheme('dark');
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '')).toBe('dark');

      setTheme('modern');
      expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '')).toBe('modern');
    });
  });
});