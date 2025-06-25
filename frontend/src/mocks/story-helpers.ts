import type { HttpHandler } from 'msw';
import { scenarioPresets } from './scenarios';

interface StoryParams {
  parameters?: {
    msw?: {
      handlers: HttpHandler[];
    };
  };
}

/**
 * Helper to add MSW handlers to a story
 */
export function withMSW(handlers: HttpHandler[]): StoryParams {
  return {
    parameters: {
      msw: {
        handlers,
      },
    },
  };
}

/**
 * Helper to use a predefined scenario
 */
export function withScenario(scenario: keyof typeof scenarioPresets): StoryParams {
  return withMSW(scenarioPresets[scenario]);
}

/**
 * Helper to combine multiple scenarios
 */
export function withScenarios(...scenarios: (keyof typeof scenarioPresets)[]): StoryParams {
  const handlers = scenarios.flatMap(scenario => scenarioPresets[scenario]);
  return withMSW(handlers);
}

/**
 * Helper to override specific endpoints
 */
export function withEndpointOverrides(overrides: HttpHandler[]): StoryParams {
  return {
    parameters: {
      msw: {
        handlers: [...scenarioPresets.default, ...overrides],
      },
    },
  };
}

/**
 * Helper to simulate network conditions
 */
export function withNetworkCondition(
  condition: 'offline' | 'slow' | 'fast' = 'fast',
  handlers: HttpHandler[] = scenarioPresets.default,
): StoryParams {
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
export function withAuthState(
  state: 'authenticated' | 'unauthenticated' | 'admin' = 'authenticated',
): StoryParams {
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
export function withRealtimeUpdates(): StoryParams {
  return withScenario('realtime');
}

/**
 * Helper for error testing
 */
export function withErrorState(): StoryParams {
  return withScenario('errors');
}

/**
 * Helper for empty states
 */
export function withEmptyState(): StoryParams {
  return withScenario('empty');
}

/**
 * Helper for performance testing
 */
export function withLargeDataset(): StoryParams {
  return withScenario('performance');
}