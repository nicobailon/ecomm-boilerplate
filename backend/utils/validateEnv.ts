import { AppError } from './AppError.js';

export function validateEnvVariables(): void {
  // Set default NODE_ENV for test environments if not set
  if (!process.env.NODE_ENV && (process.env.VITEST === 'true' || process.env.JEST_WORKER_ID)) {
    process.env.NODE_ENV = 'test';
  }
  
  const requiredEnvVars = [
    'ACCESS_TOKEN_SECRET',
    'REFRESH_TOKEN_SECRET',
    'MONGO_URI',
    'UPSTASH_REDIS_URL',
    'STRIPE_SECRET_KEY',
    'CLIENT_URL',
    'NODE_ENV',
    'UPLOADTHING_TOKEN',
  ];

  // Email configuration is optional but warn if partially configured
  const emailEnvVars = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'noreply@ecommerce.com',
    RESEND_FROM_NAME: process.env.RESEND_FROM_NAME || 'E-Commerce Store',
    EMAIL_ENABLED: process.env.EMAIL_ENABLED,
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
  };

  if (emailEnvVars.RESEND_API_KEY && !emailEnvVars.EMAIL_ENABLED) {
    console.warn('⚠️  RESEND_API_KEY is configured but EMAIL_ENABLED is not set to "true". Emails will not be sent.');
  }

  if (emailEnvVars.EMAIL_ENABLED === 'true' && !emailEnvVars.RESEND_API_KEY) {
    console.warn('⚠️  EMAIL_ENABLED is set to "true" but RESEND_API_KEY is missing. Emails will not be sent.');
  }

  // Warn if SUPPORT_EMAIL is not configured when emails are enabled
  if (emailEnvVars.EMAIL_ENABLED === 'true' && !emailEnvVars.SUPPORT_EMAIL) {
    console.warn('⚠️  EMAIL_ENABLED is set to "true" but SUPPORT_EMAIL is not configured. Using default: support@example.com');
  }

  const missingVars: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }

  if (missingVars.length > 0) {
    throw new AppError(
      `Missing required environment variables: ${missingVars.join(', ')}`,
      500,
    );
  }

  // Environment variables validated successfully
}
