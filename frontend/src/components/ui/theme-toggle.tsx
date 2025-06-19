import { useTheme } from '@/providers/theme-provider';
import { Button } from '@/components/ui/Button';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  // Add keyboard shortcut (Ctrl/Cmd + Shift + L)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        const themes: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system'];
        const currentIndex = themes.indexOf(theme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        setTheme(nextTheme);
        
        // Announce to screen readers and show toast
        const announcement = `Theme changed to ${nextTheme}`;
        const ariaLive = document.createElement('div');
        ariaLive.setAttribute('aria-live', 'polite');
        ariaLive.setAttribute('aria-atomic', 'true');
        ariaLive.className = 'sr-only';
        ariaLive.textContent = announcement;
        document.body.appendChild(ariaLive);
        setTimeout(() => document.body.removeChild(ariaLive), 1000);
        
        toast.success(announcement, { duration: 2000 });
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [theme, setTheme]);
  
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => {
        const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
        setTheme(next);
      }}
      aria-label={`Current theme: ${theme}. Click to change theme`}
      title="Toggle theme (Ctrl+Shift+L)"
    >
      <Icon className="h-5 w-5 transition-all" />
    </Button>
  );
}