# MSW (Mock Service Worker) Mocking Guide

This guide documents the mocking patterns used in our Storybook stories for API interactions.

## Overview

We use MSW (Mock Service Worker) to intercept API calls in Storybook, allowing stories to work offline and demonstrate various states (loading, error, success) without hitting real APIs.

## Quick Start

### Basic Story with Default Mocks

```typescript
import { withScenario } from '@/mocks/story-helpers';

export const MyStory: Story = {
  args: { /* your args */ },
  ...withScenario('default'), // Uses default success handlers
};
```

### Story with Error State

```typescript
export const ErrorStory: Story = {
  args: { /* your args */ },
  ...withScenario('errors'), // Uses error scenario handlers
};
```

### Story with Loading State

```typescript
export const LoadingStory: Story = {
  args: { /* your args */ },
  ...withScenario('loading'), // Simulates slow network
};
```

## Available Scenarios

### Pre-configured Scenarios

- `default` - Success responses with realistic data
- `errors` - Various error states (401, 404, 500, etc.)
- `loading` - Delayed responses to show loading states
- `networkErrors` - Network failures
- `empty` - Empty data sets
- `realtime` - Real-time updates simulation
- `conflicts` - Conflict resolution scenarios
- `performance` - Large datasets for performance testing
- `authFailure` - Authentication failures
- `partialData` - Incomplete data scenarios

### Using Multiple Scenarios

```typescript
export const ComplexStory: Story = {
  args: { /* your args */ },
  ...withScenarios('default', 'realtime'), // Combines scenarios
};
```

## Custom Handlers

### Override Specific Endpoints

```typescript
import { withEndpointOverrides } from '@/mocks/story-helpers';
import { trpcMutation } from '@/mocks/utils/trpc-mock';

export const CustomStory: Story = {
  args: { /* your args */ },
  ...withEndpointOverrides([
    trpcMutation('cart.update', async ({ quantity }) => {
      if (quantity > 10) {
        throw new Error('Insufficient inventory');
      }
      return { items: [] };
    }),
  ]),
};
```

### Network Conditions

```typescript
import { withNetworkCondition } from '@/mocks/story-helpers';

export const SlowNetworkStory: Story = {
  args: { /* your args */ },
  ...withNetworkCondition('slow'), // Simulates slow network
};

export const OfflineStory: Story = {
  args: { /* your args */ },
  ...withNetworkCondition('offline'), // Simulates no network
};
```

## Creating Mock Data

### Using Factories

```typescript
import { 
  createMockProduct, 
  createMockUser,
  createMockCartItem 
} from '@/mocks/factories';

// Create a product with defaults
const product = createMockProduct();

// Create a product with overrides
const featuredProduct = createMockProduct({
  name: 'Special Product',
  price: 99.99,
  isFeatured: true,
  inventory: 5,
});

// Create related data
const user = createMockUser({ role: 'admin' });
const cartItem = createMockCartItem({ quantity: 3 });
```

## Advanced Patterns

### Real-time Updates Simulation

```typescript
import { withRealtimeUpdates } from '@/mocks/story-helpers';

export const RealtimeStory: Story = {
  args: { /* your args */ },
  render: (args) => <RealtimeComponent {...args} />,
  ...withRealtimeUpdates(), // Enables real-time mock updates
};
```

### Custom tRPC Handlers

```typescript
import { trpcQuery, trpcMutation } from '@/mocks/utils/trpc-mock';

const customHandlers = [
  // Query handler
  trpcQuery('product.getAll', async (params) => {
    return {
      products: Array.from({ length: params.limit || 10 }, () => 
        createMockProduct()
      ),
      totalProducts: 100,
    };
  }),
  
  // Mutation handler
  trpcMutation('cart.add', async ({ productId, quantity }) => {
    return { 
      items: [createMockCartItem({ productId, quantity })] 
    };
  }),
  
  // Error simulation
  trpcMutation('auth.login', async ({ email }) => {
    if (email === 'error@example.com') {
      throw new Error('Invalid credentials');
    }
    return createMockUser({ email });
  }),
];
```

### Delayed Responses

```typescript
import { trpcQuery } from '@/mocks/utils/trpc-mock';

const slowHandler = trpcQuery(
  'product.getAll', 
  async () => createMockProducts(),
  { delay: 3000 } // 3 second delay
);
```

## Testing Patterns

### Story with Interactions

```typescript
export const InteractiveStory: Story = {
  args: { /* your args */ },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Click button that triggers API call
    const button = canvas.getByRole('button', { name: /update/i });
    await userEvent.click(button);
    
    // MSW will intercept and respond with mocked data
    await waitFor(() => {
      expect(canvas.getByText('Updated successfully')).toBeInTheDocument();
    });
  },
  ...withScenario('default'),
};
```

### Testing Error Recovery

```typescript
export const ErrorRecoveryStory: Story = {
  args: { /* your args */ },
  ...withEndpointOverrides([
    trpcMutation('cart.update', async () => {
      // First call fails
      if (!window.__retryCount) {
        window.__retryCount = 1;
        throw new Error('Network error');
      }
      // Second call succeeds
      return { items: [] };
    }),
  ]),
};
```

## Best Practices

1. **Use Factories for Consistency**: Always use mock factories to create test data
2. **Scenario First**: Start with pre-configured scenarios before custom handlers
3. **Document Custom Behavior**: Add comments explaining non-obvious mock behavior
4. **Test Edge Cases**: Use mocks to test error states, empty states, and conflicts
5. **Keep It Realistic**: Mock data should resemble production data structure
6. **Avoid Over-Mocking**: Only mock what's necessary for the story

## Troubleshooting

### Mocks Not Working

1. Check that MSW is initialized in `.storybook/preview.tsx`
2. Verify handler URL matches your API endpoint
3. Check browser DevTools Network tab - MSW logs intercepted requests
4. Ensure you're using the correct scenario or handler

### TypeScript Errors

```typescript
// Type your mock data properly
const product: Product = createMockProduct();

// Type handler parameters
trpcMutation<{ email: string; password: string }, User>(
  'auth.login',
  async ({ email, password }) => {
    return createMockUser({ email });
  }
);
```

### Performance Issues

- Use `withLargeDataset()` sparingly
- Implement pagination in mock handlers
- Consider virtualization for large lists

## Examples in Our Codebase

- `CartItem.stories.tsx` - Real-time inventory updates, error states
- `ProductImageGallery.stories.tsx` - Progressive loading, network conditions
- `ProductCard.stories.tsx` - Various product states, loading, errors

## Future Enhancements

- WebSocket simulation for real-time features
- GraphQL support
- Persistent mock state between interactions
- Mock data seeding from JSON files