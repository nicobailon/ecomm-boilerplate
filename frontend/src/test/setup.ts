import '@testing-library/jest-dom';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { queryClient } from '@/lib/query-client';

// Mock window.matchMedia
const mockMatchMedia = vi.fn().mockImplementation((query: string): MediaQueryList => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  addListener: vi.fn(), // deprecated but still required
  removeListener: vi.fn(), // deprecated but still required
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

// Mock window.scrollTo
const mockScrollTo = vi.fn();
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: mockScrollTo,
});

// Clear query client cache after each test
afterEach(() => {
  cleanup();
  queryClient.clear();
});

// Reset query client before each test
beforeEach(() => {
  queryClient.clear();
});