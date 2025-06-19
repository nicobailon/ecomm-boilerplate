import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Label } from '@/components/ui/Label';

describe('Theme Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('should persist theme selection', async () => {
    renderWithProviders(<ThemeToggle />);
    
    // Find and click theme toggle
    const themeToggle = screen.getByRole('button', { name: /Current theme.*Click to change theme/i });
    fireEvent.click(themeToggle);
    
    // Check localStorage - the storage key should match what's used in ThemeProvider
    await waitFor(() => {
      expect(localStorage.getItem('app-theme')).toBe('dark');
    });
  });

  it('should apply theme to all components', async () => {
    const TestComponent = () => (
      <div>
        <Button>Test Button</Button>
        <Input placeholder="Test Input" />
        <Badge>Test Badge</Badge>
        <Label>Test Label</Label>
      </div>
    );
    
    const { container } = renderWithProviders(<TestComponent />, { theme: 'dark' });
    
    // Check root element
    await waitFor(() => {
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });
    
    // Check various components have theme classes
    const button = container.querySelector('button');
    expect(button?.className).toMatch(/bg-primary/);
    expect(button?.className).toMatch(/text-primary-foreground/);
    
    const input = container.querySelector('input');
    expect(input?.className).toMatch(/bg-background/);
    expect(input?.className).toMatch(/text-foreground/);
  });

  it('should handle theme keyboard shortcut', async () => {
    renderWithProviders(<ThemeToggle />);
    
    // Simulate Ctrl+Shift+L
    fireEvent.keyDown(window, {
      key: 'L',
      ctrlKey: true,
      shiftKey: true,
    });
    
    await waitFor(() => {
      expect(localStorage.getItem('app-theme')).toBe('dark');
    });
  });

  it('should not have any hardcoded colors', () => {
    const TestComponent = () => (
      <div>
        <Button>Button</Button>
        <Input />
        <Badge>Badge Content</Badge>
        <Label>Label Text</Label>
        <div className="text-foreground bg-background">Semantic Colors</div>
      </div>
    );
    
    const { container } = renderWithProviders(<TestComponent />);
    const html = container.innerHTML;
    
    // Check for common hardcoded patterns
    const hardcodedPatterns = [
      /text-(gray|emerald)-[0-9]{3}/,
      /bg-(gray|emerald|blue|red|green)-[0-9]{3}/,
      /border-(gray|emerald|blue|red|green)-[0-9]{3}/,
    ];
    
    hardcodedPatterns.forEach(pattern => {
      const matches = html.match(pattern);
      expect(matches).toBeNull();
    });
  });
});