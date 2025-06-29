# MERN-Commerce: A Modern Full-Stack E-Commerce Platform

A feature-rich, scalable, and modern e-commerce solution built with the MERN stack and enhanced with a powerful set of tools including tRPC, TanStack Query, and Stripe.

---

## ✨ Key Features

-   **Full-Stack Architecture**: Monorepo structure with a Node.js/Express backend and a React 19 frontend.
-   **Type-Safe API**: End-to-end type safety with **tRPC**, ensuring your frontend and backend stay in sync.
-   **Modern Frontend**: Built with **React 19** and **Vite** for a blazing fast development experience.
-   **Powerful Data Fetching**: Declarative, auto-caching, and optimistic updates using **TanStack Query**.
-   **Seamless Payments**: Secure and reliable payment processing integrated with **Stripe**.
-   **Robust Authentication**: JWT-based authentication with refresh and access tokens for secure sessions.
-   **Admin Dashboard**: A protected area for administrators to manage products and view sales analytics.
-   **Efficient Caching**: **Redis** integration for caching frequently accessed data and improving performance.
-   **File & Image Uploads**: Simple and reliable file uploads powered by **UploadThing**.
-   **Email System**: Asynchronous email processing with templates for order confirmations, welcome emails, and password resets.
-   **Styled with Tailwind CSS**: A utility-first CSS framework for rapid UI development.

## 🛠️ Tech Stack

| Category         | Technology                                                                                              |
| :--------------- | :------------------------------------------------------------------------------------------------------ |
| **Backend**      | Node.js, Express.js, TypeScript, tRPC, Mongoose (MongoDB), Redis, JWT                                   |
| **Frontend**     | React 19, Vite, TypeScript, TanStack Query, TanStack Table, React Router, Zustand, Tailwind CSS        |
| **Payments**     | Stripe                                                                                                  |
| **Database**     | MongoDB, Redis (Upstash)                                                                                |
| **File Uploads** | UploadThing                                                                                             |
| **Email**        | Resend, Bull Queue, EJS Templates                                                                      |

## 🚀 Getting Started

### Prerequisites

-   Node.js (v18 or higher)
-   MongoDB (local instance or a cloud service like MongoDB Atlas)
-   Redis (local instance or a cloud service like Upstash)
-   Stripe Account & CLI

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/mern-ecommerce.git
    cd mern-ecommerce
    ```

2.  **Install dependencies for both backend and frontend:**
    ```bash
    npm install
    cd frontend
    npm install
    cd ..
    ```

3.  **Set up environment variables:**
    -   Copy the `.env.example` to a new `.env` file in the root directory.
    -   Fill in the required values:
        -   `MONGO_URI`
        -   `UPSTASH_REDIS_URL`
        -   `ACCESS_TOKEN_SECRET` & `REFRESH_TOKEN_SECRET` (generate with `openssl rand -base64 32`)
        -   `STRIPE_SECRET_KEY`
        -   `UPLOADTHING_APP_ID` & `UPLOADTHING_SECRET`
        -   `RESEND_API_KEY` & `EMAIL_ENABLED=true` (for email functionality)

4.  **Run the application in development mode:**
    ```bash
    # This command runs both the backend and frontend concurrently
    npm run dev:all
    ```
    -   Frontend will be available at `http://localhost:5173`.
    -   Backend API will be available at `http://localhost:3001`.

### Stripe Webhook for Local Development

To test Stripe payments and webhooks locally, you need to forward webhook events to your local server.

1.  **Run the Stripe CLI:**
    ```bash
    stripe listen --forward-to localhost:3001/api/payments/webhook
    ```
2.  **Update your `.env` file:**
    -   The CLI will output a webhook signing secret (e.g., `whsec_...`).
    -   Copy this value and add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`.

## 👑 Admin System

The application features a role-based system with `customer` and `admin` roles. Admins have exclusive access to the dashboard for managing the store.

### Creating an Admin User

1.  **Sign up** for a new account through the application's UI. By default, this creates a `customer` account.
2.  **Promote the user to admin** by running the provided script from the project root:
    ```bash
    # Replace with the user's email you want to promote
    npm run make-admin admin@example.com
    ```
3.  You can list all users and their roles with `npm run list-users`.

### Accessing the Admin Dashboard

-   Admins log in using the same page as regular customers.
-   Once logged in, an "Admin" or "Dashboard" link will appear in the navigation, leading to the protected admin area.

## 📧 Email System

The application includes a robust email system for transactional emails with the following features:

### Email Types

1. **Welcome Emails**: Sent automatically when users sign up
2. **Order Confirmations**: Sent after successful payment processing
3. **Password Reset**: Sent when users request password recovery
4. **Stock Notifications**: Sent when out-of-stock items become available

### Architecture

-   **Asynchronous Processing**: Uses Bull queue with Redis for non-blocking email delivery
-   **Template Engine**: EJS templates with base layout for consistent branding
-   **Fallback Mechanism**: Automatically falls back to synchronous sending if queue is unavailable
-   **Rate Limiting**: Prevents email abuse with configurable limits (5 emails per 15 minutes)

### Email Templates

  Email templates are located at: `/backend/templates/emails/`.

  The templates include:
  - welcome.ejs - New user registration
  - order-confirmation.ejs - Purchase confirmation
  - password-reset.ejs - Password recovery
  - stock-notification.ejs - Back in stock alerts
  - layouts/base.ejs - Base layout wrapper

### Configuration

1. **Required Environment Variables**:
   ```
   RESEND_API_KEY=your-resend-api-key
   EMAIL_ENABLED=true
   ```

2. **Email Features**:
   - HTML and plain text versions of all emails
   - Template caching for improved performance
   - XSS protection in templates
   - Automatic retry with exponential backoff
   - Comprehensive error logging

### Security

-   **Opt-in Design**: Emails only sent when both API key exists AND `EMAIL_ENABLED=true`
-   **URL Sanitization**: Prevents javascript: and data: URLs in emails
-   **Rate Limiting**: Applied to all email-sending endpoints
-   **Unsubscribe Support**: CAN-SPAM compliant with token-based unsubscribe links

For detailed documentation, see `/backend/docs/email-system.md`.

## 📜 Available Scripts

### Development & Build
-   `npm run dev`: Starts the backend server in development mode.
-   `npm run dev:all`: Starts both backend and frontend servers concurrently.
-   `npm run build`: Builds the backend and frontend for production.
-   `npm run start`: Starts the application using `ts-node`.
-   `npm run start:prod`: Starts the compiled production build from the `dist` folder.

### Testing & Linting
-   `npm test`: Runs tests for the application.
-   `npm run lint`: Lints both backend and frontend code.
-   `npm run lint --prefix frontend`: Lints frontend code only.
-   `npx eslint backend`: Lints backend code only.

### Development Tools
-   **Component Development**: Access the dev UI at `http://localhost:5173/dev` (development only).
-   The dev UI provides:
    - Component showcase with 84 UI components
    - Live prop editing and preview
    - Mock data generation
    - WebSocket simulation tools
    - Feature flag management
-   **Email Verification Preview Routes** (requires authentication):
    - Customer success page: `http://localhost:5173/dev/email-verified/customer`
    - Admin success page: `http://localhost:5173/dev/email-verified/admin`
    - These routes allow developers and designers to preview the email verification success states without going through the actual email verification flow
-   Dev code is automatically stripped from production builds.

### Admin Management
-   `npm run list-users`: Lists all users and their roles.
-   `npm run make-admin <email>`: Promotes a user to admin role.

### Development Route Authentication
To access the email verification preview routes:
1. Sign in to the application with any user account
2. Navigate to the desired route:
   - `/dev/email-verified/customer` - Shows the customer success experience
   - `/dev/email-verified/admin` - Shows the admin success experience
3. The routes are accessible to any authenticated user, allowing developers to preview both customer and admin experiences regardless of their actual role

## 🤝 Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
