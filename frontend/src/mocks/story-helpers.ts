import type { StoryObj } from '@storybook/react-vite';
import type { HttpHandler } from 'msw';
import { scenarioPresets } from './scenarios';

/**
 * Helper to add MSW handlers to a story
 */
export function withMSW<T = unknown>(handlers: HttpHandler[]): Partial<StoryObj<T>> {
  return {
    parameters: {
      msw: {
        handlers,
      },
    },
  } as Partial<StoryObj<T>>;
}

/**
 * Helper to use a predefined scenario
 */
export function withScenario<T>(scenario: keyof typeof scenarioPresets): Partial<StoryObj<T>> {
  return withMSW(scenarioPresets[scenario]);
}

/**
 * Helper to combine multiple scenarios
 */
export function withScenarios<T>(...scenarios: (keyof typeof scenarioPresets)[]): Partial<StoryObj<T>> {
  const handlers = scenarios.flatMap(scenario => scenarioPresets[scenario]);
  return withMSW(handlers);
}

/**
 * Helper to override specific endpoints
 */
export function withEndpointOverrides<T = unknown>(overrides: HttpHandler[]): Partial<StoryObj<T>> {
  return {
    parameters: {
      msw: {
        handlers: [...scenarioPresets.default, ...overrides],
      },
    },
  } as Partial<StoryObj<T>>;
}

/**
 * Helper to simulate network conditions
 */
export function withNetworkCondition<T>(
  condition: 'offline' | 'slow' | 'fast' = 'fast',
  handlers: HttpHandler[] = scenarioPresets.default,
): Partial<StoryObj<T>> {
  if (condition === 'offline') {
    return withScenario('networkErrors');
  }
  
  if (condition === 'slow') {
    return withScenario('loading');
  }
  
  return withMSW(handlers);
}

/**
 * Helper to simulate authentication states
 */
export function withAuthState<T>(
  state: 'authenticated' | 'unauthenticated' | 'admin' = 'authenticated',
): Partial<StoryObj<T>> {
  if (state === 'unauthenticated') {
    return withScenario('authFailure');
  }
  
  // For authenticated/admin states, use default handlers
  // The actual auth state would be handled by the tRPC context
  return withScenario('default');
}

/**
 * Helper for real-time stories
 */
export function withRealtimeUpdates<T>(): Partial<StoryObj<T>> {
  return withScenario('realtime');
}

/**
 * Helper for error testing
 */
export function withErrorState<T>(): Partial<StoryObj<T>> {
  return withScenario('errors');
}

/**
 * Helper for empty states
 */
export function withEmptyState<T>(): Partial<StoryObj<T>> {
  return withScenario('empty');
}

/**
 * Helper for performance testing
 */
export function withLargeDataset<T>(): Partial<StoryObj<T>> {
  return withScenario('performance');
}