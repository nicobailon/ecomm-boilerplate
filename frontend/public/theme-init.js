// Theme initialization script to prevent flash of unstyled content
// This runs before React hydrates to set the correct theme immediately
(function() {
  const STORAGE_KEY = 'vite-ui-theme';
  const DEFAULT_THEME = 'light';
  const VALID_THEMES = ['light', 'dark', 'modern', 'playful'];
  
  // Validate theme value
  function isValidTheme(theme) {
    return VALID_THEMES.includes(theme);
  }
  
  try {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    let theme = DEFAULT_THEME;
    
    // Validate saved theme
    if (savedTheme) {
      try {
        const parsedTheme = JSON.parse(savedTheme);
        if (isValidTheme(parsedTheme)) {
          theme = parsedTheme;
        } else {
          // Invalid theme value, clear it
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (parseError) {
        // Invalid JSON, clear it
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    
    // Apply theme classes
    const root = document.documentElement;
    const themeClasses = ['dark', 'theme-modern', 'theme-playful'];
    
    // Remove all theme classes efficiently
    themeClasses.forEach(cls => root.classList.remove(cls));
    
    // Apply the validated theme
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
      // 'light' is the default, no class needed
    }
    
    // Also set color-scheme for native elements
    root.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
  } catch (e) {
    // If anything fails, we'll just use the default theme
    console.error('Failed to initialize theme:', e);
  }
})();