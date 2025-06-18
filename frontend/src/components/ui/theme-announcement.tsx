import { useEffect, useRef } from 'react';
import { useTheme } from '@/providers/theme-provider';

export function ThemeAnnouncement() {
  const { resolvedTheme } = useTheme();
  const previousTheme = useRef(resolvedTheme);
  
  useEffect(() => {
    if (previousTheme.current !== resolvedTheme) {
      const announcement = `Theme changed to ${resolvedTheme} mode`;
      const ariaLive = document.createElement('div');
      ariaLive.setAttribute('role', 'status');
      ariaLive.setAttribute('aria-live', 'polite');
      ariaLive.setAttribute('aria-atomic', 'true');
      ariaLive.className = 'sr-only';
      ariaLive.textContent = announcement;
      
      document.body.appendChild(ariaLive);
      setTimeout(() => {
        document.body.removeChild(ariaLive);
      }, 1000);
      
      previousTheme.current = resolvedTheme;
    }
  }, [resolvedTheme]);
  
  return null;
}