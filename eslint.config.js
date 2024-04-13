import js from '@eslint/js';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';
import solidPlugin from 'eslint-plugin-solid';
import globals from 'globals';

import prettierConfig from './prettier.config.js';

export default [
  js.configs['recommended'],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      import: importPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': ['warn', prettierConfig],
      eqeqeq: 'warn',
      'guard-for-in': 'error',
      'import/first': 'warn',
      'import/newline-after-import': 'warn',
      'import/order': [
        'warn',
        {
          'newlines-between': 'always',
          groups: ['builtin', 'external', ['internal', 'parent'], 'sibling', 'index'],
          alphabetize: { order: 'asc', caseInsensitive: false },
        },
      ],
      'no-console': 'off',
      'no-duplicate-imports': 'warn',
      'no-multiple-empty-lines': ['warn', { max: 1 }],
      'no-shadow': 'error',
      'no-unused-vars': 'warn',
      'no-use-before-define': ['error', 'nofunc'],
      'no-var': 'error',
      'object-shorthand': 'warn',
      'one-var': ['warn', 'never'],
      'prefer-const': 'warn',
      'prefer-template': 'warn',
      'sort-imports': ['warn', { ignoreDeclarationSort: true }],
      'spaced-comment': ['warn', 'always', { markers: ['/'] }],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: { project: './tsconfig.json' },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
      solid: solidPlugin,
    },
    rules: {
      ...typescriptPlugin.configs['recommended-type-checked'].rules,
      ...solidPlugin.configs['typescript'].rules,
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/explicit-function-return-type': ['warn', { allowExpressions: true }],
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/restrict-template-expressions': ['warn', { allowNever: true }],
    },
  },
];
