import type { Meta, StoryObj } from '@storybook/react-vite';
import Layout from './Layout';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { createTRPCClient } from '@/lib/trpc-client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

// Mock child component for demonstration
const MockPage = ({ title, showSidebar = false }: { title: string; showSidebar?: boolean }) => (
  <div className="container mx-auto px-4 py-8">
    <div className={showSidebar ? 'flex gap-8' : ''}>
      {showSidebar && (
        <aside className="w-64 flex-shrink-0">
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Sidebar</h3>
            <nav className="space-y-2">
              <a href="#" className="block px-3 py-2 rounded hover:bg-muted">Dashboard</a>
              <a href="#" className="block px-3 py-2 rounded hover:bg-muted">Products</a>
              <a href="#" className="block px-3 py-2 rounded hover:bg-muted">Orders</a>
              <a href="#" className="block px-3 py-2 rounded hover:bg-muted">Settings</a>
            </nav>
          </Card>
        </aside>
      )}
      <main className="flex-1">
        <h1 className="text-3xl font-bold mb-6">{title}</h1>
        <Card className="p-6">
          <p className="text-muted-foreground mb-4">
            This is a mock page demonstrating the layout component. The layout provides the overall structure
            including the navbar, background gradients, and toast notifications.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card className="p-4">
              <h3 className="font-medium mb-2">Feature 1</h3>
              <p className="text-sm text-muted-foreground">Lorem ipsum dolor sit amet.</p>
            </Card>
            <Card className="p-4">
              <h3 className="font-medium mb-2">Feature 2</h3>
              <p className="text-sm text-muted-foreground">Consectetur adipiscing elit.</p>
            </Card>
            <Card className="p-4">
              <h3 className="font-medium mb-2">Feature 3</h3>
              <p className="text-sm text-muted-foreground">Sed do eiusmod tempor.</p>
            </Card>
          </div>
        </Card>
      </main>
    </div>
  </div>
);

// Wrapper to provide routing context
const LayoutWrapper = ({ children, initialPath = '/' }: { children: React.ReactNode; initialPath?: string }) => {
  const mockUser = {
    _id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'customer' as const,
    cartItems: [],
  };

  // Create a new query client for each story to avoid conflicts
  const storyQueryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: Infinity, retry: false },
    },
  });

  // Mock the auth profile query
  storyQueryClient.setQueryData(['auth.profile'], mockUser);

  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <QueryClientProvider client={storyQueryClient}>
        <trpc.Provider client={createTRPCClient()} queryClient={storyQueryClient}>
          {children}
        </trpc.Provider>
      </QueryClientProvider>
    </MemoryRouter>
  );
};

const meta: Meta<typeof Layout> = {
  title: 'Layout/Layout',
  component: Layout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <LayoutWrapper>
        <Story />
      </LayoutWrapper>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    () => (
      <LayoutWrapper>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<MockPage title="Welcome to E-Commerce Admin" />} />
          </Route>
        </Routes>
      </LayoutWrapper>
    ),
  ],
};

export const WithSidebar: Story = {
  decorators: [
    () => (
      <LayoutWrapper>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<MockPage title="Dashboard" showSidebar={true} />} />
          </Route>
        </Routes>
      </LayoutWrapper>
    ),
  ],
};

export const FullWidthContent: Story = {
  decorators: [
    () => (
      <LayoutWrapper>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={
              <div className="w-full">
                <div className="bg-muted py-12">
                  <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold mb-4">Full Width Hero Section</h1>
                    <p className="text-xl text-muted-foreground">
                      This demonstrates a full-width layout without container constraints
                    </p>
                  </div>
                </div>
                <div className="container mx-auto px-4 py-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                      <Card key={i} className="p-4">
                        <div className="aspect-square bg-muted rounded mb-3" />
                        <h3 className="font-medium">Product {i}</h3>
                        <p className="text-sm text-muted-foreground">$99.99</p>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            } />
          </Route>
        </Routes>
      </LayoutWrapper>
    ),
  ],
};

export const MobileResponsive: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    () => (
      <LayoutWrapper>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<MockPage title="Mobile View" />} />
          </Route>
        </Routes>
      </LayoutWrapper>
    ),
  ],
};

export const TabletView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  decorators: [
    () => (
      <LayoutWrapper>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<MockPage title="Tablet View" showSidebar={true} />} />
          </Route>
        </Routes>
      </LayoutWrapper>
    ),
  ],
};

export const WithScrolledContent: Story = {
  decorators: [
    () => {
      const [scrolled, setScrolled] = useState(false);

      useEffect(() => {
        const timer = setTimeout(() => {
          window.scrollTo({ top: 200, behavior: 'smooth' });
          setScrolled(true);
        }, 1000);
        return () => clearTimeout(timer);
      }, []);

      return (
        <LayoutWrapper>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={
                <div className="container mx-auto px-4 py-8">
                  <h1 className="text-3xl font-bold mb-6">Scrollable Content</h1>
                  <p className="text-muted-foreground mb-4">
                    {scrolled && <span className="text-primary">→ Page has been scrolled automatically</span>}
                  </p>
                  {[...Array(20)].map((_, i) => (
                    <Card key={i} className="p-6 mb-4">
                      <h2 className="text-xl font-semibold mb-2">Section {i + 1}</h2>
                      <p className="text-muted-foreground">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
                        incididunt ut labore et dolore magna aliqua.
                      </p>
                    </Card>
                  ))}
                </div>
              } />
            </Route>
          </Routes>
        </LayoutWrapper>
      );
    },
  ],
};

export const ErrorState: Story = {
  decorators: [
    () => (
      <LayoutWrapper>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={
              <div className="container mx-auto px-4 py-8">
                <Card className="p-12 text-center">
                  <div className="text-6xl mb-4">⚠️</div>
                  <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
                  <p className="text-muted-foreground mb-6">
                    An unexpected error occurred. Please try again later.
                  </p>
                  <Button>Go back home</Button>
                </Card>
              </div>
            } />
          </Route>
        </Routes>
      </LayoutWrapper>
    ),
  ],
};

export const LoadingState: Story = {
  decorators: [
    () => (
      <LayoutWrapper>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={
              <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse">
                  <div className="h-8 bg-muted rounded w-1/3 mb-6" />
                  <Card className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-4" />
                    <div className="h-4 bg-muted rounded w-1/2 mb-4" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </Card>
                </div>
              </div>
            } />
          </Route>
        </Routes>
      </LayoutWrapper>
    ),
  ],
};

export const CustomBackground: Story = {
  decorators: [
    () => (
      <div>
        <style>{`
          .custom-gradient {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
        `}</style>
        <LayoutWrapper>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={
                <div>
                  <div className="custom-gradient text-white py-20">
                    <div className="container mx-auto px-4 text-center">
                      <h1 className="text-5xl font-bold mb-4">Custom Background Demo</h1>
                      <p className="text-xl opacity-90">
                        The layout&apos;s gradient background adapts to different content styles
                      </p>
                    </div>
                  </div>
                  <div className="container mx-auto px-4 py-8">
                    <Card className="p-6">
                      <p>The layout component provides a consistent structure while allowing custom styling for individual pages.</p>
                    </Card>
                  </div>
                </div>
              } />
            </Route>
          </Routes>
        </LayoutWrapper>
      </div>
    ),
  ],
};

export const RightToLeft: Story = {
  decorators: [
    () => (
      <div dir="rtl">
        <LayoutWrapper>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={
                <div className="container mx-auto px-4 py-8">
                  <h1 className="text-3xl font-bold mb-6">תצוגת RTL</h1>
                  <Card className="p-6">
                    <p className="mb-4">
                      זוהי דוגמה של פריסה בכיוון מימין לשמאל. הפריסה מתאימה את עצמה אוטומטית לכיוון הטקסט.
                    </p>
                    <div className="flex gap-4">
                      <Button>כפתור ראשי</Button>
                      <Button variant="outline">כפתור משני</Button>
                    </div>
                  </Card>
                </div>
              } />
            </Route>
          </Routes>
        </LayoutWrapper>
      </div>
    ),
  ],
};