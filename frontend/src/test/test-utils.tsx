// This file re-exports all testing utilities
// Note: Fast refresh warnings are expected for test utilities
// as they mix components and non-component exports

export {
  // Mock data factories
  createMockUser,
  createMockProduct,
  createMockApiResponse,
  
  // QueryClient utilities
  createTestQueryClient,
  getSharedQueryClient,
  resetSharedQueryClient,
  
  // Render functions
  customRender,
  customRender as render,
  renderWithProviders,
  renderInDarkMode,
  renderInLightMode,
  createWrapper,
  
  // Testing library exports
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
  renderHook,
  
  // Types
  type RenderResult,
  type RenderOptions,
  type RenderHookOptions,
  type RenderHookResult,
  type CustomRenderOptions,
} from './test-utils-exports';

export { TestWrapper } from './test-wrapper';