# Admin Scripts Documentation

This directory contains administrative scripts for managing the e-commerce platform.

## Available Scripts

### User Management

#### `npm run list-users`
Lists all users in the system with their details (name, email, role, creation date).

#### `npm run make-admin <email>`
Promotes a user to admin role.
```bash
npm run make-admin user@example.com
```

### Coupon Management

#### `npm run create-coupon <email> [discount] [days] [code]`
Creates a new coupon for a specific user.

**Parameters:**
- `email` (required): Email of the user who will receive the coupon
- `discount` (optional): Discount percentage (0-100). Default: 10
- `days` (optional): Number of days until expiration. Default: 30
- `code` (optional): Custom coupon code. Default: auto-generated

**Examples:**
```bash
# Create a 10% coupon valid for 30 days with auto-generated code
npm run create-coupon user@example.com

# Create a 20% coupon valid for 7 days
npm run create-coupon user@example.com 20 7

# Create a 15% coupon with custom code "SUMMER15"
npm run create-coupon user@example.com 15 30 SUMMER15
```

**Note:** Each user can only have one active coupon at a time. If the user already has an active coupon, you'll be prompted to deactivate it before creating a new one.

#### `npm run list-coupons [options]`
Lists all coupons in the system with their status.

**Options:**
- `--active`: Show only active and non-expired coupons
- `--expired`: Show only expired or used coupons
- `<email>`: Filter coupons for a specific user

**Examples:**
```bash
# List all coupons
npm run list-coupons

# List only active coupons
npm run list-coupons --active

# List only expired/used coupons
npm run list-coupons --expired

# List coupons for a specific user
npm run list-coupons user@example.com
```

#### `npm run deactivate-coupon <code>`
Manually deactivates a coupon by its code.

**Example:**
```bash
npm run deactivate-coupon SUMMER20
```

### Database Management

#### `npm run migrate-categories`
Migrates category data (specific to the project's needs).

## How Coupons Work

1. **Automatic Generation**: Coupons are automatically created when a user makes a purchase over $200. The coupon provides a 10% discount and is valid for 30 days.

2. **Manual Creation**: Administrators can create coupons manually using the `create-coupon` script for promotions, customer service, or testing.

3. **Restrictions**: 
   - Each user can only have one active coupon at a time
   - Coupons are user-specific and cannot be transferred
   - Coupons have an expiration date
   - Once used, coupons are automatically deactivated

4. **Usage**: Users can apply their coupon code during checkout to receive the discount.

## Environment Requirements

All scripts require the following environment variables to be set in the `.env` file:
- `MONGO_URI`: MongoDB connection string

Make sure to run these scripts from the project root directory.