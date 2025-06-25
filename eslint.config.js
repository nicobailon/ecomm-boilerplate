import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

// Conditionally import React plugins (only available in frontend)
let react, reactHooks, reactRefresh, tanstackQuery, storybook;
try {
  react = (await import('eslint-plugin-react')).default;
  reactHooks = (await import('eslint-plugin-react-hooks')).default;
  reactRefresh = (await import('eslint-plugin-react-refresh')).default;
  tanstackQuery = (await import('@tanstack/eslint-plugin-query')).default;
  storybook = (await import('eslint-plugin-storybook')).default;
} catch (error) {
  // React plugins not available - this is expected when running from root
}

export default tseslint.config(
  // Global ignore patterns
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/storybook-static/**',
      'frontend/public/**',
      '**/*.config.js', // Ignore all config files
      '**/*.config.ts',
      '**/*.cjs', // Ignore CommonJS files
      'scripts/**',
      'frontend/scripts/**',
      '**/*.ejs', // EJS templates are not JavaScript/TypeScript
    ],
  },

  // Shared/Backend TypeScript configuration
  {
    files: ['backend/**/*.ts', 'shared/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Frontend TypeScript/React configuration
  {
    files: ['frontend/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
      parser: tseslint.parser,
      parserOptions: {
        project: './frontend/tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },

  // Apply base rules to all TypeScript files
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Backend/Shared specific rules
  {
    files: ['backend/**/*.ts', 'shared/**/*.ts'],
    rules: {
      // Synchronize with frontend team
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      'no-multiple-empty-lines': ['error', { max: 1 }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      
      // TypeScript specific
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/explicit-function-return-type': ['error', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      }],
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      // Prevent 'as any' type assertions
      '@typescript-eslint/consistent-type-assertions': ['error', {
        assertionStyle: 'as',
        objectLiteralTypeAssertions: 'never',
      }]
    },
  },

  // Frontend React configuration
  ...(react ? [{
    files: ['frontend/**/*.{ts,tsx}'],
    plugins: {
      'react': react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@tanstack/query': tanstackQuery,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React rules
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...tanstackQuery.configs.recommended.rules,
      
      'react/prop-types': 'off', // TypeScript handles this
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      
      // Synchronize with backend team
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'always-multiline'],
      'no-multiple-empty-lines': ['error', { max: 1 }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      
      // TypeScript specific
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off', // Too strict for React
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      '@typescript-eslint/consistent-type-imports': ['error', {
        prefer: 'type-imports',
        fixStyle: 'separate-type-imports',
      }],
      
      // Temporarily set to warn for gradual migration
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
    },
  }] : []),

  // Test files configuration (both backend and frontend)
  {
    files: [
      '**/*.test.{ts,tsx}', 
      '**/*.spec.{ts,tsx}', 
      'backend/test/**/*.ts',
      'backend/tests/**/*.ts',
      'frontend/src/__tests__/**/*.{ts,tsx}',
      'frontend/src/**/*.test.{ts,tsx}',
    ],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      // Test assertions don't return promises even though ESLint thinks they do
      '@typescript-eslint/no-floating-promises': ['error', {
        ignoreVoid: true,
        ignoreIIFE: true,
      }],
    },
  },

  // Storybook configuration
  ...(storybook ? [{
    files: ['frontend/.storybook/**/*.{ts,tsx}', 'frontend/**/*.stories.{ts,tsx}'],
    ...storybook.configs['flat/recommended'],
    rules: {
      ...storybook.configs['flat/recommended'].rules,
      '@typescript-eslint/explicit-function-return-type': 'off',
      // Storybook test assertions don't return promises
      '@typescript-eslint/no-floating-promises': ['error', {
        ignoreVoid: true,
        ignoreIIFE: true,
      }],
    },
  }] : []),
);
