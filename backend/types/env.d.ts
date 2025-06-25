declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Required environment variables
      NODE_ENV: 'development' | 'production' | 'test';
      ACCESS_TOKEN_SECRET: string;
      REFRESH_TOKEN_SECRET: string;
      MONGO_URI: string;
      UPSTASH_REDIS_URL: string;
      STRIPE_SECRET_KEY: string;
      CLIENT_URL: string;
      UPLOADTHING_TOKEN: string;
      PORT?: string;
      
      // Email configuration (optional)
      EMAIL_ENABLED?: string;
      RESEND_API_KEY?: string;
      RESEND_FROM_EMAIL?: string;
      RESEND_FROM_NAME?: string;
      SUPPORT_EMAIL?: string;
      
      // Optional Redis token
      UPSTASH_REDIS_TOKEN?: string;
      
      // Stripe webhook secret (optional)
      STRIPE_WEBHOOK_SECRET?: string;
      
      // UploadThing alternative config (optional)
      UPLOADTHING_APP_ID?: string;
      UPLOADTHING_SECRET?: string;
      
      // Test environment flags (optional)
      VITEST?: string;
      JEST_WORKER_ID?: string;
      
      // Redis health status (runtime)
      REDIS_HEALTH_STATUS?: string;
    }
  }
}

export {};