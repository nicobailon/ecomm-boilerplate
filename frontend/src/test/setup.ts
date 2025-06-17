import '@testing-library/jest-dom';
import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { queryClient } from '@/lib/query-client';

// Clear query client cache after each test
afterEach(() => {
  cleanup();
  queryClient.clear();
});

// Reset query client before each test
beforeEach(() => {
  queryClient.clear();
});