import { AppError } from './AppError.js';

export function validateEnvVariables() {
  const requiredEnvVars = [
    'ACCESS_TOKEN_SECRET',
    'REFRESH_TOKEN_SECRET',
    'MONGO_URI',
    'UPSTASH_REDIS_URL',
    'STRIPE_SECRET_KEY',
    'CLIENT_URL',
    'NODE_ENV'
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
      500
    );
  }

  console.log('✅ All required environment variables are set');
}
