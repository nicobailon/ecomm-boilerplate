import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    {
      name: '@storybook/addon-docs',
      options: {
        configureJSX: true,
        transcludeMarkdown: true,
      },
    },
    '@storybook/addon-onboarding',
    '@storybook/addon-themes',
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  typescript: {
    check: false,
    reactDocgen: 'react-docgen',
  },
  viteFinal(config) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@': join(__dirname, '../src'),
          '@shared': join(__dirname, '../../shared'),
        },
      },
      esbuild: {
        // Skip TypeScript type checking during build
        tsconfigRaw: {
          compilerOptions: {
            skipLibCheck: true,
          },
        },
      },
      build: {
        sourcemap: false,
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom'],
              'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-alert-dialog', '@radix-ui/react-label', '@radix-ui/react-switch'],
              'tanstack-vendor': ['@tanstack/react-query'],
              'form-vendor': ['react-hook-form', '@hookform/resolvers'],
              'utils-vendor': ['clsx', 'class-variance-authority', 'zod'],
            },
          },
        },
      },
    });
  },
};
export default config;