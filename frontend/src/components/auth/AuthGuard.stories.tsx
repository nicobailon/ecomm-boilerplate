import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthGuard } from './AuthGuard';
import { useCurrentUser } from '@/hooks/auth/useAuth';
import { vi } from 'vitest';
import { mockUser } from '@/test/mocks';

// Mock the hook
vi.mock('@/hooks/auth/useAuth');

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const meta = {
  title: 'Auth/AuthGuard',
  component: AuthGuard,
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      return (
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Story />
          </BrowserRouter>
        </QueryClientProvider>
      );
    },
  ],
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AuthGuard>;

export default meta;
type Story = StoryObj<typeof meta>;

const ProtectedContent = () => (
  <div className="p-8 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
    <h2 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">Protected Content</h2>
    <p className="text-green-700 dark:text-green-300">
      This content is only visible to authenticated users.
    </p>
  </div>
);

const AdminContent = () => (
  <div className="p-8 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
    <h2 className="text-2xl font-bold text-purple-800 dark:text-purple-200 mb-2">Admin Content</h2>
    <p className="text-purple-700 dark:text-purple-300">
      This content is only visible to administrators.
    </p>
  </div>
);

const PublicContent = () => (
  <div className="p-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
    <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-200 mb-2">Public Content</h2>
    <p className="text-blue-700 dark:text-blue-300">
      This content is visible to everyone.
    </p>
  </div>
);

export const AuthenticatedUser: Story = {
  args: {
    children: <ProtectedContent />,
    requireAuth: true,
  },
  decorators: [
    (Story) => {
      (useCurrentUser as any).mockReturnValue({
        data: mockUser,
        isLoading: false,
      });
      return <Story />;
    },
  ],
};

export const UnauthenticatedUser: Story = {
  args: {
    children: <ProtectedContent />,
    requireAuth: true,
  },
  decorators: [
    (Story) => {
      (useCurrentUser as any).mockReturnValue({
        data: null,
        isLoading: false,
      });
      return (
        <Routes>
          <Route path="/" element={<Story />} />
          <Route path="/login" element={
            <div className="p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <h2 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-2">Redirected to Login</h2>
              <p className="text-red-700 dark:text-red-300">
                User was redirected here because authentication is required.
              </p>
            </div>
          } />
        </Routes>
      );
    },
  ],
};

export const LoadingState: Story = {
  args: {
    children: <ProtectedContent />,
    requireAuth: true,
  },
  decorators: [
    (Story) => {
      (useCurrentUser as any).mockReturnValue({
        data: null,
        isLoading: true,
      });
      return <Story />;
    },
  ],
};

export const AdminUser: Story = {
  args: {
    children: <AdminContent />,
    requireAuth: true,
    requireAdmin: true,
  },
  decorators: [
    (Story) => {
      (useCurrentUser as any).mockReturnValue({
        data: { ...mockUser, role: 'admin' },
        isLoading: false,
      });
      return <Story />;
    },
  ],
};

export const NonAdminUser: Story = {
  args: {
    children: <AdminContent />,
    requireAuth: true,
    requireAdmin: true,
    redirectTo: '/unauthorized',
  },
  decorators: [
    (Story) => {
      (useCurrentUser as any).mockReturnValue({
        data: { ...mockUser, role: 'customer' },
        isLoading: false,
      });
      return (
        <Routes>
          <Route path="/" element={<Story />} />
          <Route path="/unauthorized" element={
            <div className="p-8 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <h2 className="text-2xl font-bold text-orange-800 dark:text-orange-200 mb-2">Unauthorized</h2>
              <p className="text-orange-700 dark:text-orange-300">
                You don't have permission to access this resource.
              </p>
            </div>
          } />
        </Routes>
      );
    },
  ],
};

export const PreventAuthenticatedAccess: Story = {
  args: {
    children: <PublicContent />,
    requireAuth: false,
    redirectTo: '/dashboard',
  },
  decorators: [
    (Story) => {
      (useCurrentUser as any).mockReturnValue({
        data: mockUser,
        isLoading: false,
      });
      return (
        <Routes>
          <Route path="/" element={<Story />} />
          <Route path="/dashboard" element={
            <div className="p-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <h2 className="text-2xl font-bold text-indigo-800 dark:text-indigo-200 mb-2">Dashboard</h2>
              <p className="text-indigo-700 dark:text-indigo-300">
                Authenticated users are redirected to dashboard.
              </p>
            </div>
          } />
        </Routes>
      );
    },
  ],
};

export const PermissionBasedRendering: Story = {
  args: {
    children: <div>Protected Content</div>,
  },
  render: () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Permission-Based Content</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Public Content (No Auth Required)</h4>
          <AuthGuard requireAuth={false}>
            <PublicContent />
          </AuthGuard>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2">User Content (Auth Required)</h4>
          <AuthGuard requireAuth={true}>
            <ProtectedContent />
          </AuthGuard>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2">Admin Content (Admin Role Required)</h4>
          <AuthGuard requireAuth={true} requireAdmin={true}>
            <AdminContent />
          </AuthGuard>
        </div>
      </div>
    </div>
  ),
  decorators: [
    (Story) => {
      (useCurrentUser as any).mockReturnValue({
        data: { ...mockUser, role: 'customer' },
        isLoading: false,
      });
      return <Story />;
    },
  ],
};

export const AllStates: Story = {
  args: {
    children: <div>Protected Content</div>,
  },
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">AuthGuard States</h3>
        <div className="grid gap-6">
          <div>
            <h4 className="text-sm font-medium mb-2">Loading</h4>
            <div className="h-32 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Authenticated</h4>
            <ProtectedContent />
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Unauthenticated (Redirect)</h4>
            <div className="p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 opacity-50">
              <p className="text-red-700 dark:text-red-300">
                → Redirects to /login
              </p>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Insufficient Permissions (Redirect)</h4>
            <div className="p-8 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800 opacity-50">
              <p className="text-orange-700 dark:text-orange-300">
                → Redirects to /unauthorized
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
  decorators: [
    (Story) => {
      (useCurrentUser as any).mockReturnValue({
        data: mockUser,
        isLoading: false,
      });
      return <Story />;
    },
  ],
};

export const MobileView: Story = {
  args: {
    children: <ProtectedContent />,
    requireAuth: true,
  },
  decorators: [
    (Story) => {
      (useCurrentUser as any).mockReturnValue({
        data: mockUser,
        isLoading: false,
      });
      return <Story />;
    },
  ],
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const AccessibilityFeatures: Story = {
  args: {
    children: <ProtectedContent />,
    requireAuth: true,
  },
  decorators: [
    (Story) => {
      (useCurrentUser as any).mockReturnValue({
        data: mockUser,
        isLoading: false,
      });
      return <Story />;
    },
  ],
  render: (args) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Accessibility Considerations</h3>
      <div className="text-sm text-muted-foreground space-y-2 mb-4">
        <p>• Loading states are announced to screen readers</p>
        <p>• Redirects maintain focus management</p>
        <p>• Content structure is preserved</p>
        <p>• No layout shifts during auth checks</p>
      </div>
      <AuthGuard {...args} />
    </div>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'aria-roles', enabled: true },
          { id: 'focus-order', enabled: true },
        ],
      },
    },
  },
};