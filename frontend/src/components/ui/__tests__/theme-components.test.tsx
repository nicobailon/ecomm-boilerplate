import { render } from '@testing-library/react';
import { ThemeProvider } from '@/providers/theme-provider';
import { Button } from '../Button';
import { Input } from '../Input';
import { Label } from '../Label';
import { Badge } from '../Badge';

describe('Theme-aware Components', () => {
  const renderWithTheme = (ui: React.ReactElement, theme: 'light' | 'dark' = 'light') => {
    document.documentElement.className = theme;
    return render(
      <ThemeProvider defaultTheme={theme}>
        {ui}
      </ThemeProvider>,
    );
  };

  describe('Button', () => {
    it('should have correct classes in light mode', () => {
      const { container } = renderWithTheme(<Button>Test</Button>, 'light');
      const button = container.querySelector('button');
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('should have correct classes in dark mode', () => {
      const { container } = renderWithTheme(<Button>Test</Button>, 'dark');
      const button = container.querySelector('button');
      expect(button).toHaveClass('dark:hover:bg-primary/80');
    });
  });

  describe('Input', () => {
    it('should use semantic colors', () => {
      const { container } = renderWithTheme(<Input />);
      const input = container.querySelector('input');
      expect(input).toHaveClass('text-foreground', 'bg-background');
    });
  });

  describe('Label', () => {
    it('should have text-foreground class', () => {
      const { container } = renderWithTheme(<Label>Test Label</Label>);
      const label = container.querySelector('label');
      expect(label).toHaveClass('text-foreground');
    });
  });

  describe('Badge', () => {
    it('should support all variants', () => {
      const variants = ['default', 'secondary', 'destructive', 'outline', 'success', 'warning'];
      variants.forEach(variant => {
        const { container } = renderWithTheme(
          <Badge variant={variant as 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'}>Test</Badge>,
        );
        expect(container.firstChild).toBeTruthy();
      });
    });
  });
});