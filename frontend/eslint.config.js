import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tanstackQuery from '@tanstack/eslint-plugin-query';
import globals from 'globals';

export default tseslint.config(// Ignore patterns
{
  ignores: [
    'dist/**',
    'node_modules/**',
    'coverage/**',
    'public/**',
    '*.config.js',
    '*.config.ts',
    'scripts/**',
  ],
}, // Base configuration for TypeScript files
{
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    ecmaVersion: 2022,
    globals: {
      ...globals.browser,
      ...globals.es2022,
    },
    parser: tseslint.parser,
    parserOptions: {
      project: './tsconfig.json',
      tsconfigRootDir: import.meta.dirname,
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
}, // Apply base rules
js.configs.recommended, ...tseslint.configs.recommendedTypeChecked, ...tseslint.configs.stylisticTypeChecked, // React configuration
{
  files: ['**/*.{ts,tsx}'],
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
    }]
  },
}, // Test files configuration
{
  files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'src/__tests__/**/*.{ts,tsx}', 'src/test/**/*.{ts,tsx}', 'src/mocks/**/*.{ts,tsx}'],
  languageOptions: {
    ecmaVersion: 2022,
    globals: {
      ...globals.browser,
      ...globals.es2022,
    },
    parser: tseslint.parser,
    parserOptions: {
      project: './tsconfig.json',
      tsconfigRootDir: import.meta.dirname,
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    'no-console': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'react-refresh/only-export-components': 'off', // Test utilities need to export both components and functions
  },
});