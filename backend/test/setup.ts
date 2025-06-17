import { beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

beforeAll(async () => {
  console.log('Setting up tests...');
});

afterAll(async () => {
  console.log('Cleaning up tests...');
});
