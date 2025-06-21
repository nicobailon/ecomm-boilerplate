import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '../theme-provider';
import { useTheme } from '@/hooks/useTheme';

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('should default to system theme', () => {
    const TestComponent = () => {
      const { theme } = useTheme();
      return <div>{theme}</div>;
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    expect(screen.getByText('system')).toBeInTheDocument();
  });

  it('should persist theme to localStorage', async () => {
    const user = userEvent.setup();
    const TestComponent = () => {
      const { setTheme } = useTheme();
      return <button onClick={() => setTheme('dark')}>Set Dark</button>;
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    await user.click(screen.getByText('Set Dark'));

    expect(localStorage.getItem('app-theme')).toBe('dark');
  });

  it('should update DOM classes when theme changes', async () => {
    const user = userEvent.setup();
    const TestComponent = () => {
      const { setTheme } = useTheme();
      return (
        <>
          <button onClick={() => setTheme('light')}>Light</button>
          <button onClick={() => setTheme('dark')}>Dark</button>
        </>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    await user.click(screen.getByText('Dark'));

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('should respond to system theme changes', () => {
    const mockMatchMedia = (matches: boolean) => ({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    window.matchMedia = vi.fn().mockImplementation((query) => {
      return mockMatchMedia(query === '(prefers-color-scheme: dark)');
    });

    render(
      <ThemeProvider>
        <div>Test</div>
      </ThemeProvider>,
    );

    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
  });

  it('should use custom storage key when provided', async () => {
    const user = userEvent.setup();
    const TestComponent = () => {
      const { setTheme } = useTheme();
      return <button onClick={() => setTheme('dark')}>Set Dark</button>;
    };

    render(
      <ThemeProvider storageKey="custom-theme-key">
        <TestComponent />
      </ThemeProvider>,
    );

    await user.click(screen.getByText('Set Dark'));

    expect(localStorage.getItem('custom-theme-key')).toBe('dark');
  });

  it('should resolve theme correctly when system is selected', () => {
    const mockMatchMedia = (matches: boolean) => ({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    window.matchMedia = vi.fn().mockImplementation(() => mockMatchMedia(true));

    const TestComponent = () => {
      const { theme, resolvedTheme } = useTheme();
      return (
        <div>
          <span>Theme: {theme}</span>
          <span>Resolved: {resolvedTheme}</span>
        </div>
      );
    };

    render(
      <ThemeProvider defaultTheme="system">
        <TestComponent />
      </ThemeProvider>,
    );

    expect(screen.getByText('Theme: system')).toBeInTheDocument();
    expect(screen.getByText('Resolved: dark')).toBeInTheDocument();
  });
});