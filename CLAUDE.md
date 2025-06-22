# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Bash Guidelines
Always make sure to kill all processes that you initiate in the current codebase when you are done with a task. It's likely that the user already has an instance of `npm run dev:all` running already that you can leave running.

## Development Commands

### Full-Stack Development

```bash
# Start both backend and frontend (recommended for development)
npm run dev:all

# Start backend only with hot reload
npm run dev

# Start frontend only
npm run dev --prefix frontend
```

### Building and Production

```bash
# Build both backend and frontend
npm run build

# Start production server
npm run start:prod

# Preview frontend production build
npm run preview --prefix frontend
```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run frontend tests with UI
npm run test:ui --prefix frontend

# Run a specific test file
npx vitest path/to/test/file.test.ts
```

### Code Quality

```bash
# Run all checks (frontend only)
npm run check-all --prefix frontend

# TypeScript type checking
npm run typecheck

# Linting
npm run lint
npm run lint --prefix frontend
```

### Admin Management

```bash
# List all users and their roles
npm run list-users

# Promote a user to admin
npm run make-admin user@example.com
```

## Architecture Overview

### Monorepo Structure

This is a TypeScript monorepo with separate backend and frontend applications sharing common configurations.

```
/backend/              # Express.js + tRPC API server
  /controllers/        # Business logic handlers
  /models/            # Mongoose schemas
  /routes/            # Express REST routes
  /trpc/              # tRPC routers for type-safe API
    /routers/         # Domain-specific routers (auth, products, etc.)
    /context.ts       # tRPC context with auth
    /index.ts         # Root router combining all routers
  /services/          # Business logic layer
  /middleware/        # Auth, error handling, security
  /lib/               # External service connections (DB, Redis, Stripe)
  /utils/             # Helper functions
  /validations/       # Zod schemas shared between tRPC and services

/frontend/             # React + Vite SPA
  /src/
    /components/      # React components
      /forms/         # Form components with validation
      /ui/            # Base UI components
    /pages/           # Route pages
    /hooks/           # Custom hooks
      /queries/       # TanStack Query hooks using tRPC
      /migration/     # Feature-flagged migration hooks
    /stores/          # Zustand state management
    /lib/             # Utilities and configurations
      /trpc.ts        # tRPC client setup
      /api-client.ts  # Legacy REST client (being migrated)
    /types/           # TypeScript type definitions
```

### Type-Safe API Communication

The application uses tRPC for end-to-end type safety between frontend and backend:

1. **Backend**: tRPC routers define procedures with Zod validation
2. **Frontend**: tRPC client provides fully typed hooks
3. **Migration**: Feature flags allow gradual migration from REST to tRPC

Example tRPC usage:
```typescript
// Backend router
export const authRouter = router({
  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ input, ctx }) => {
      return authService.login(input);
    }),
});

// Frontend hook
const login = trpc.auth.login.useMutation({
  onSuccess: (user) => {
    queryClient.setQueryData(['user'], user);
  },
});
```

### Authentication Flow

- JWT-based with access and refresh tokens
- Tokens stored in httpOnly cookies
- Automatic token refresh on 401 responses
- Protected routes use `protectedProcedure` in tRPC

### State Management

- **Server State**: TanStack Query with tRPC integration
- **Client State**: Zustand stores (deprecated, being removed)
- **Forms**: React Hook Form with Zod validation

### Testing Strategy

- **Backend**: Service layer tests with mocked dependencies
- **Frontend**: Component tests with React Testing Library
- **E2E**: tRPC router integration tests
- **Test Utilities**: Custom render function with providers

## Key Development Patterns

### TypeScript Strict Mode

The project enforces strict TypeScript with no `any` types allowed. When encountering type errors:

1. Use `as const` assertions for literal types
2. Prefer branded types for domain values
3. Never widen types to solve errors
4. Add explicit type annotations when inference fails

### Error Handling

- Custom `AppError` class for business logic errors
- Centralized error middleware for consistent responses
- tRPC error formatting for client-friendly messages

### File Upload

Uses UploadThing for image uploads:
- Configured in `/backend/lib/uploadthing.ts`
- Upload routes in `/backend/routes/upload.route.ts`
- Images stored externally, URLs saved in database

### Feature Flags

Environment-based feature flags for gradual tRPC migration:
```typescript
// In /frontend/src/lib/feature-flags.ts
export const FEATURE_FLAGS = {
  USE_TRPC_PRODUCTS: import.meta.env.VITE_USE_TRPC_PRODUCTS === 'true',
  // ... other domains
};
```

### Security Measures

- Input sanitization with DOMPurify
- Rate limiting on auth endpoints
- CORS configuration for production
- Helmet.js for security headers
- JWT secrets rotation support

## Environment Variables

Required variables are documented in `.env.example`. Key services:

- **MongoDB**: Local or MongoDB Atlas connection
- **Redis**: Upstash Redis for caching
- **Stripe**: Payment processing
- **UploadThing**: Image upload service
- **JWT Secrets**: Generate with `openssl rand -base64 32`

## Common Tasks

### Adding a New API Endpoint

1. Create Zod schema in `/backend/validations/`
2. Add tRPC procedure to appropriate router
3. Implement service method with business logic
4. Create frontend hook in `/frontend/src/hooks/queries/`
5. Add tests for service and hook

### Modifying Database Schema

1. Update Mongoose model in `/backend/models/`
2. Update TypeScript types
3. Update Zod validation schemas
4. Run tests to ensure compatibility

### Debugging tRPC Errors

1. Check browser DevTools Network tab for request/response
2. Verify Zod schema matches input data
3. Check tRPC context for auth issues
4. Look for error formatting in tRPC setup

## Performance Considerations

- Redis caching for analytics and featured products
- Manual code splitting in Vite config
- React.lazy for route-based splitting
- Optimistic updates with TanStack Query
- Database indexes on frequently queried fields

## Inventory Management

### Shopify-Like Pattern (No Reservations)

The system follows a Shopify-like inventory pattern without reservations:

- **No inventory reservations**: Items can remain in cart even if out of stock
- **Checkout-time validation**: Inventory is only checked when proceeding to payment
- **Automatic adjustment**: If insufficient stock at checkout, quantities are automatically adjusted
- **Clear messaging**: Users receive clear feedback about any quantity adjustments

### Inventory Flow

1. **Adding to Cart**: No inventory checks - items can be added freely
2. **Cart Display**: Shows current inventory status with warnings but doesn't prevent items
3. **Checkout Process**:
   - Backend validates each item against current inventory
   - Automatically adjusts quantities if insufficient stock
   - Returns adjustment details to frontend
   - Proceeds with available items only
4. **Real-time Updates**: WebSocket notifications for inventory changes

### Key Services

- **Inventory Service** (`/backend/services/inventory.service.ts`): 
  - `getAvailableInventory()` returns actual inventory (no reservation calculations)
  - `updateInventory()` handles stock changes with atomic operations
  
- **Payment Service** (`/backend/services/payment.service.ts`):
  - Validates and adjusts cart at checkout time
  - Returns `adjustments` array with any quantity changes
  - Handles inventory decrement only after successful payment