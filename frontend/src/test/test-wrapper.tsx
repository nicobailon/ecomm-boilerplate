import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/providers/theme-provider';
import { getSharedQueryClient } from './test-utils-exports';

interface TestWrapperProps {
  children: React.ReactNode;
  theme?: 'light' | 'dark' | 'system';
  useSharedQueryClient?: boolean;
}

export const TestWrapper: React.FC<TestWrapperProps> = ({ 
  children, 
  theme = 'light',
  useSharedQueryClient = true,
}) => {
  const queryClient = useSharedQueryClient ? getSharedQueryClient() : undefined;
  
  return (
    <ThemeProvider defaultTheme={theme}>
      <BrowserRouter>
        <QueryClientProvider client={queryClient ?? getSharedQueryClient()}>
          {children}
        </QueryClientProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};