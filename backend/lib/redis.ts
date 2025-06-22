import { Redis } from 'ioredis';
import { config } from 'dotenv';

config();

const redisUrl = process.env.UPSTASH_REDIS_URL;
if (!redisUrl) {
  throw new Error('UPSTASH_REDIS_URL is not defined in environment variables');
}

export const redis = new Redis(redisUrl, {
  tls: {},
  maxRetriesPerRequest: 3,
});