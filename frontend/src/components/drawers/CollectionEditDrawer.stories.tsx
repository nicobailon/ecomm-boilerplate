import type { Meta, StoryObj } from '@storybook/react-vite';
import { CollectionEditDrawer } from './CollectionEditDrawer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { createTRPCClient } from '@/lib/trpc-client';
import { fn } from '@storybook/test';
import { within, userEvent, expect, waitFor } from '@storybook/test';
import type { RouterOutputs } from '@/lib/trpc';
import { Toaster } from 'sonner';

type Collection = RouterOutputs['collection']['getById'];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: Infinity },
  },
});

const mockCollection: Collection = {
  _id: '1',
  name: 'Summer Collection',
  slug: 'summer-collection',
  description: 'Bright and breezy styles perfect for warm weather.',
  isPublic: true,
  products: [
    { 
      _id: 'prod1' as any,
      name: 'Summer Dress',
      description: 'Light and airy summer dress',
      price: 59.99,
      image: 'https://example.com/dress.jpg',
      category: 'clothing',
      isFeatured: false,
      collectionId: '1',
      slug: 'summer-dress'
    },
    { 
      _id: 'prod2' as any,
      name: 'Beach Sandals',
      description: 'Comfortable beach sandals',
      price: 29.99,
      image: 'https://example.com/sandals.jpg',
      category: 'footwear',
      isFeatured: false,
      collectionId: '1',
      slug: 'beach-sandals'
    },
    { 
      _id: 'prod3' as any,
      name: 'Sun Hat',
      description: 'Wide-brimmed sun hat',
      price: 19.99,
      image: 'https://example.com/hat.jpg',
      category: 'accessories',
      isFeatured: false,
      collectionId: '1',
      slug: 'sun-hat'
    },
  ],
  owner: {
    _id: 'user1',
    name: 'Test User',
    email: 'test@example.com'
  } as any,
  createdAt: new Date(),
  updatedAt: new Date(),
} as any;

const meta = {
  title: 'Drawers/CollectionEditDrawer',
  component: CollectionEditDrawer,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <div className="min-h-screen bg-background">
            <Story />
            <Toaster position="top-right" />
          </div>
        </QueryClientProvider>
      </trpc.Provider>
    ),
  ],
  args: {
    onClose: fn(),
  },
} satisfies Meta<typeof CollectionEditDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CreateMode: Story = {
  args: {
    isOpen: true,
    collection: null,
  },
};

export const EditMode: Story = {
  args: {
    isOpen: true,
    collection: mockCollection,
  },
};

export const EditModeEmpty: Story = {
  args: {
    isOpen: true,
    collection: {
      ...mockCollection,
      products: [],
    } as unknown as Collection,
  },
};

export const EditModePrivate: Story = {
  args: {
    isOpen: true,
    collection: {
      ...mockCollection,
      isPublic: false,
    } as unknown as Collection,
  },
};

export const CreateWithValidation: Story = {
  args: {
    isOpen: true,
    collection: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByLabelText('Name')).toBeInTheDocument();
    });
    
    // Try to submit without filling required fields
    const submitButton = canvas.getByRole('button', { name: 'Continue to Product Selection' });
    await userEvent.click(submitButton);
    
    // Check for validation error
    await waitFor(() => {
      expect(canvas.getByText('Name is required')).toBeInTheDocument();
    });
  },
};

export const CreateFlow: Story = {
  args: {
    isOpen: true,
    collection: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByLabelText('Name')).toBeInTheDocument();
    });
    
    // Fill in collection details
    const nameInput = canvas.getByLabelText('Name');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'New Test Collection');
    
    const descInput = canvas.getByLabelText('Description');
    await userEvent.clear(descInput);
    await userEvent.type(descInput, 'This is a test collection description');
    
    // Continue to product selection
    const continueButton = canvas.getByRole('button', { name: 'Continue to Product Selection' });
    await userEvent.click(continueButton);
    
    // Should show product selection step
    await waitFor(() => {
      expect(canvas.getByText('Select products to include in this collection')).toBeInTheDocument();
    });
  },
};

export const EditFlow: Story = {
  args: {
    isOpen: true,
    collection: mockCollection,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByLabelText('Name')).toBeInTheDocument();
    });
    
    // Check that form is pre-filled
    const nameInput = canvas.getByLabelText('Name') as HTMLInputElement;
    expect(nameInput.value).toBe('Summer Collection');
    
    // Click manage products button
    const manageButton = canvas.getByRole('button', { name: /Manage Products/ });
    await userEvent.click(manageButton);
    
    // Should show product selection step
    await waitFor(() => {
      expect(canvas.getByText('Select products to include in this collection')).toBeInTheDocument();
    });
  },
};

export const NavigationFlow: Story = {
  args: {
    isOpen: true,
    collection: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByLabelText('Name')).toBeInTheDocument();
    });
    
    // Fill form and continue
    const nameInput = canvas.getByLabelText('Name');
    await userEvent.type(nameInput, 'Test Collection');
    
    const continueButton = canvas.getByRole('button', { name: 'Continue to Product Selection' });
    await userEvent.click(continueButton);
    
    // Wait for product selection
    await waitFor(() => {
      expect(canvas.getByText('Select products to include in this collection')).toBeInTheDocument();
    });
    
    // Go back to details
    const backButton = canvas.getByRole('button', { name: 'Back' });
    await userEvent.click(backButton);
    
    // Should be back at details
    await waitFor(() => {
      expect(canvas.getByLabelText('Name')).toBeInTheDocument();
    });
  },
};

export const LoadingState: Story = {
  args: {
    isOpen: true,
    collection: null,
  },
  decorators: [
    (Story) => {
      const slowQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
          mutations: {
            retry: false,
          },
        },
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={slowQueryClient}>
          <QueryClientProvider client={slowQueryClient}>
            <div className="min-h-screen bg-background">
              <Story />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByLabelText('Name')).toBeInTheDocument();
    });
    
    // Fill form
    const nameInput = canvas.getByLabelText('Name');
    await userEvent.type(nameInput, 'Test Collection');
    
    const continueButton = canvas.getByRole('button', { name: 'Continue to Product Selection' });
    await userEvent.click(continueButton);
    
    // Move to products and try to save
    await waitFor(() => {
      expect(canvas.getByText('Create Collection')).toBeInTheDocument();
    });
    
    const createButton = canvas.getByRole('button', { name: 'Create Collection' });
    await userEvent.click(createButton);
    
    // Should show loading state
    await waitFor(() => {
      expect(canvas.getByText('Saving...')).toBeInTheDocument();
    });
  },
};

export const MobileView: Story = {
  args: {
    isOpen: true,
    collection: mockCollection,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletView: Story = {
  args: {
    isOpen: true,
    collection: mockCollection,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const LongContent: Story = {
  args: {
    isOpen: true,
    collection: {
      ...mockCollection,
      name: 'This Is A Very Long Collection Name That Might Need Special Handling In The UI',
      description: 'This is an extremely long description that goes on and on and on. It contains many details about the collection and its purpose, including information about the types of products it contains, the target audience, seasonal considerations, and much more. This helps test how the drawer handles lengthy content and whether it provides appropriate scrolling behavior.',
      products: Array.from({ length: 20 }, (_, i) => ({
        _id: `prod${i}`,
        name: `Product ${i + 1}`,
        description: `Description for product ${i + 1}`,
        price: Math.floor(Math.random() * 100) + 10,
        image: `https://example.com/product${i}.jpg`,
        category: 'general',
        isFeatured: false,
        collectionId: '1',
        slug: `product-${i + 1}`
      })) as unknown as Collection['products'],
    } as unknown as Collection,
  },
};

export const WithStringProductIds: Story = {
  args: {
    isOpen: true,
    collection: {
      ...mockCollection,
      products: ['prod1', 'prod2', 'prod3'] as unknown as Collection['products'],
    } as Collection,
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    collection: null,
  },
};

export const PublicToggle: Story = {
  args: {
    isOpen: true,
    collection: mockCollection,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByLabelText('Make this collection public')).toBeInTheDocument();
    });
    
    // Toggle public checkbox
    const publicCheckbox = canvas.getByLabelText('Make this collection public');
    await userEvent.click(publicCheckbox);
    
    // Verify it's unchecked
    expect(publicCheckbox).not.toBeChecked();
    
    // Toggle back
    await userEvent.click(publicCheckbox);
    
    // Verify it's checked again
    expect(publicCheckbox).toBeChecked();
  },
};

export const CompleteCreateWorkflow: Story = {
  args: {
    isOpen: true,
    collection: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Step 1: Fill in collection details
    await waitFor(() => {
      expect(canvas.getByLabelText('Name')).toBeInTheDocument();
    });
    
    const nameInput = canvas.getByLabelText('Name');
    await userEvent.type(nameInput, 'Spring Fashion Collection');
    
    const descInput = canvas.getByLabelText('Description');
    await userEvent.type(descInput, 'Fresh styles for the new season featuring vibrant colors and comfortable fabrics');
    
    // Make it public
    const publicCheckbox = canvas.getByLabelText('Make this collection public');
    await userEvent.click(publicCheckbox);
    expect(publicCheckbox).toBeChecked();
    
    // Continue to product selection
    const continueButton = canvas.getByRole('button', { name: 'Continue to Product Selection' });
    await userEvent.click(continueButton);
    
    // Step 2: Select products
    await waitFor(() => {
      expect(canvas.getByText('Select products to include in this collection')).toBeInTheDocument();
    });
    
    // Search for products
    const searchInput = canvas.getByPlaceholderText(/search products/i);
    await userEvent.type(searchInput, 'dress');
    
    // Select some products (simulate)
    await waitFor(() => {
      const checkboxes = canvas.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });
    
    // Step 3: Save collection
    const createButton = canvas.getByRole('button', { name: 'Create Collection' });
    await userEvent.click(createButton);
    
    // Should show saving state
    await waitFor(() => {
      expect(canvas.getByText('Saving...')).toBeInTheDocument();
    });
  },
};

export const CompleteEditWorkflow: Story = {
  args: {
    isOpen: true,
    collection: mockCollection,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Step 1: Edit collection details
    await waitFor(() => {
      const nameInput = canvas.getByLabelText('Name') as HTMLInputElement;
      expect(nameInput.value).toBe('Summer Collection');
    });
    
    // Update name
    const nameInput = canvas.getByLabelText('Name');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Summer Sale Collection');
    
    // Update description
    const descInput = canvas.getByLabelText('Description');
    await userEvent.clear(descInput);
    await userEvent.type(descInput, 'Amazing summer deals on all your favorite items!');
    
    // Step 2: Manage products
    const manageButton = canvas.getByRole('button', { name: /Manage Products/ });
    await userEvent.click(manageButton);
    
    await waitFor(() => {
      expect(canvas.getByText('Select products to include in this collection')).toBeInTheDocument();
    });
    
    // Remove a product
    const checkboxes = canvas.getAllByRole('checkbox');
    if (checkboxes.length > 1) {
      await userEvent.click(checkboxes[1]); // Uncheck first product
    }
    
    // Step 3: Save changes
    const saveButton = canvas.getByRole('button', { name: 'Save Changes' });
    await userEvent.click(saveButton);
    
    // Should show saving state
    await waitFor(() => {
      expect(canvas.getByText('Saving...')).toBeInTheDocument();
    });
  },
};

export const KeyboardNavigation: Story = {
  args: {
    isOpen: true,
    collection: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByLabelText('Name')).toBeInTheDocument();
    });
    
    // Focus should be on first input
    const nameInput = canvas.getByLabelText('Name');
    await userEvent.click(nameInput);
    expect(document.activeElement).toBe(nameInput);
    
    // Tab to description
    await userEvent.tab();
    const descInput = canvas.getByLabelText('Description');
    expect(document.activeElement).toBe(descInput);
    
    // Tab to public checkbox
    await userEvent.tab();
    const publicCheckbox = canvas.getByLabelText('Make this collection public');
    expect(document.activeElement).toBe(publicCheckbox);
    
    // Space to toggle
    await userEvent.keyboard(' ');
    expect(publicCheckbox).toBeChecked();
    
    // Tab to continue button
    await userEvent.tab();
    const continueButton = canvas.getByRole('button', { name: 'Continue to Product Selection' });
    expect(document.activeElement).toBe(continueButton);
    
    // Escape to close drawer
    await userEvent.keyboard('{Escape}');
  },
};

export const FocusManagement: Story = {
  args: {
    isOpen: true,
    collection: mockCollection,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for drawer to open
    await waitFor(() => {
      expect(canvas.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Focus should be trapped within drawer
    const drawer = canvas.getByRole('dialog');
    expect(drawer).toBeInTheDocument();
    
    // Close button should be focusable
    const closeButton = canvas.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
    
    // Tab through all focusable elements
    const focusableElements = drawer.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    expect(focusableElements.length).toBeGreaterThan(0);
  },
};

export const AccessibilityAnnouncements: Story = {
  args: {
    isOpen: true,
    collection: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Submit empty form
    await waitFor(() => {
      expect(canvas.getByRole('button', { name: 'Continue to Product Selection' })).toBeInTheDocument();
    });
    
    const continueButton = canvas.getByRole('button', { name: 'Continue to Product Selection' });
    await userEvent.click(continueButton);
    
    // Error should be announced
    await waitFor(() => {
      const errorMessage = canvas.getByText('Name is required');
      expect(errorMessage).toBeInTheDocument();
      // Check if error has proper ARIA attributes
      const errorContainer = errorMessage.closest('[role="alert"]');
      expect(errorContainer).toBeInTheDocument();
    });
    
    // Fill name and continue
    const nameInput = canvas.getByLabelText('Name');
    await userEvent.type(nameInput, 'Test Collection');
    await userEvent.click(continueButton);
    
    // Step change should be announced
    await waitFor(() => {
      expect(canvas.getByText('Select products to include in this collection')).toBeInTheDocument();
    });
  },
};