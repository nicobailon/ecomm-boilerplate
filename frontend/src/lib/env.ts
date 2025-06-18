import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url().default('http://localhost:3001/api'),
  VITE_USE_TRPC_AUTH: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  VITE_USE_TRPC_PRODUCTS: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  VITE_USE_TRPC_CART: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  VITE_USE_TRPC_ANALYTICS: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  VITE_USE_TRPC_COUPONS: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  VITE_USE_TRPC_PAYMENT: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
});

type EnvSchema = z.infer<typeof envSchema>;

function validateEnv(): EnvSchema {
  try {
    return envSchema.parse(import.meta.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(
        (issue) => `${issue.path.join('.')}: ${issue.message}`
      );
      throw new Error(
        `Invalid environment variables:\n${issues.join('\n')}`
      );
    }
    throw error;
  }
}

export const env = validateEnv();

// Re-export individual env vars for convenience
export const API_URL = env.VITE_API_URL;
export const USE_TRPC_AUTH = env.VITE_USE_TRPC_AUTH;
export const USE_TRPC_PRODUCTS = env.VITE_USE_TRPC_PRODUCTS;
export const USE_TRPC_CART = env.VITE_USE_TRPC_CART;
export const USE_TRPC_ANALYTICS = env.VITE_USE_TRPC_ANALYTICS;
export const USE_TRPC_COUPONS = env.VITE_USE_TRPC_COUPONS;
export const USE_TRPC_PAYMENT = env.VITE_USE_TRPC_PAYMENT;

// Type-safe environment check
export const isDevelopment = import.meta.env.DEV;
export const isProduction = import.meta.env.PROD;

// Helper to check if any tRPC feature is enabled
export const isAnyTrpcEnabled = 
  USE_TRPC_AUTH ||
  USE_TRPC_PRODUCTS ||
  USE_TRPC_CART ||
  USE_TRPC_ANALYTICS ||
  USE_TRPC_COUPONS ||
  USE_TRPC_PAYMENT;