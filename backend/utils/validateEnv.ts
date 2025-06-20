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
  
  const optionalEnvVars = [
    'USE_VARIANT_LABEL',
    'USE_VARIANT_ATTRIBUTES',
  ];

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
