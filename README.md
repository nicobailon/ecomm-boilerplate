E-Commerce Shop Boilerplate with tRPC, Tanstack Query, UploadThing, and more

-   🚀 Project Setup
-   🗄️ MongoDB & Redis Integration
-   💳 Stripe Payment Setup
-   🔐 Robust Authentication System
-   🔑 JWT with Refresh/Access Tokens
-   📝 User Signup & Login
-   🛒 E-Commerce Core
-   📦 Product & Category Management
-   🛍️ Shopping Cart Functionality
-   💰 Checkout with Stripe
-   🏷️ Coupon Code System
-   👑 Admin Dashboard
-   📊 Sales Analytics
-   🎨 Design with Tailwind
-   🛒 Cart & Checkout Process
-   🔒 Security
-   🛡️ Data Protection
-   🚀Caching with Redis
-   ⌛ And a lot more...

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance) - See [MongoDB Guide](./MONGODB_GUIDE.md) for detailed setup
- Redis (Upstash or local)
- Stripe account for payments

## Setup Instructions

### 1. Clone the repository

```shell
git clone https://github.com/your-username/mern-ecommerce.git
cd mern-ecommerce
```

### 2. Install dependencies

```shell
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend && npm install
cd ..
```

### 3. Setup .env file

Copy the `.env.example` file to `.env` and fill in your values:

```shell
cp .env.example .env
```

Required environment variables:
- `MONGO_URI` - MongoDB connection string
- `UPSTASH_REDIS_URL` - Redis connection URL
- `ACCESS_TOKEN_SECRET` & `REFRESH_TOKEN_SECRET` - JWT secrets (generate with `openssl rand -base64 32`)
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `UPLOADTHING_APP_ID` & `UPLOADTHING_SECRET` - For file uploads

### 4. Run the application

#### Development mode (with hot reload):

```shell
# Run both backend and frontend
npm run dev:all

# Or run separately:
# Backend only
npm run dev

# Frontend only (in another terminal)
cd frontend && npm run dev
```

#### Production mode:

```shell
# Build both backend and frontend
npm run build

# Start the server
npm run start
```

### 5. Access the application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Admin System

### How Admin Users Work

This application uses a role-based access control system. There are two user roles:
- `customer` - Regular users (default for all new signups)
- `admin` - Administrative users with access to product management

### Creating Admin Users

Two convenient scripts are provided to manage admin users:

#### Option 1: Using Command Line Scripts (Recommended)

1. **Create a regular user account** through the normal signup process at `/signup`
2. **List all users** to see their current roles:
   ```shell
   npm run list-users
   ```
3. **Promote a user to admin**:
   ```shell
   npm run make-admin admin@example.com
   ```

The scripts will show you:
- Confirmation when a user is promoted
- List of all current admin users
- Error messages if the user doesn't exist

#### Option 2: Direct Database Access

If you prefer to use MongoDB directly:
```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

### Admin Login & Dashboard Access

- **Login**: Admins use the same login page as customers (`/login`)
- **Dashboard URL**: `/secret-dashboard` (only accessible to admin users)
- **Dashboard Access**: After login, admin users will see a "Dashboard" button in the navbar

### Admin Capabilities

The admin dashboard provides:
- **Analytics Overview**: Total revenue, users, products, and sales metrics
- **Product Management**: 
  - Create new products with images
  - Edit existing products
  - Delete products
  - Toggle featured status
  - Manage product categories

### Security

Admin routes are protected at multiple levels:
- Backend API endpoints use `adminRoute` middleware
- Frontend routes use `AuthGuard` component with `requireAdmin={true}`
- User roles are stored in JWT tokens and validated on each request

## Stripe Webhook Setup (Local Development)

To test Stripe payments locally, you need to forward webhooks:

```shell
stripe listen --forward-to localhost:3001/api/payments/webhook
```

Copy the webhook signing secret displayed and add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`.

## Available Scripts

- `npm run dev` - Run backend in development mode with hot reload
- `npm run dev:all` - Run both backend and frontend concurrently
- `npm run build` - Build both backend and frontend for production
- `npm run start` - Start the application using TypeScript directly
- `npm run start:prod` - Start the compiled production build
- `npm run test` - Run tests
- `npm run typecheck` - Check TypeScript types
- `npm run lint` - Run ESLint

## Tech Stack

### Backend
- Node.js + Express.js
- TypeScript
- MongoDB with Mongoose
- Redis for caching
- JWT authentication
- Stripe for payments
- UploadThing for file uploads

### Frontend
- React 19 with Vite
- TypeScript
- TanStack Query for data fetching
- Tailwind CSS for styling
- React Router v7
- Zustand for state management

## Documentation

- [MongoDB Guide](./MONGODB_GUIDE.md) - Complete guide for MongoDB setup and management
- [CLAUDE.md](./CLAUDE.md) - Development guidelines and project structure
