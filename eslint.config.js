// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('@angular-eslint/eslint-plugin');
const angularTemplate = require('@angular-eslint/eslint-plugin-template');
const templateParser = require('@angular-eslint/template-parser');
const functionalPlugin = require('eslint-plugin-functional');

const functional = functionalPlugin.default ?? functionalPlugin;

module.exports = tseslint.config(
  {
    ignores: ['dist/**', 'out-tsc/**', 'coverage/**', 'node_modules/**', '.angular/**'],
  },
  {
    files: ['**/*.ts'],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    plugins: { '@angular-eslint': angular },
    languageOptions: {
      parserOptions: { project: ['tsconfig.lib.json', 'tsconfig.spec.json'] },
    },
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  {
    // Functional style: warnings, not errors. `npm run lint:functional` caps their count
    // with --max-warnings, so CI fails when the count goes up. Tests and the testing
    // helpers are an exception and stay out.
    files: [
      'src/**/*.ts',
      'shell/**/*.ts',
      'markdown-editor/**/*.ts',
      'markdown-view/**/*.ts',
      'pwa/**/*.ts',
    ],
    ignores: ['**/*.spec.ts', 'testing/**'],
    plugins: { functional },
    rules: {
      'prefer-const': 'warn',
      'no-param-reassign': 'warn',
      '@typescript-eslint/switch-exhaustiveness-check': [
        'warn',
        { considerDefaultExhaustiveForUnions: true },
      ],
      'functional/no-let': 'warn',
      'functional/immutable-data': ['warn', { ignoreClasses: 'fieldsOnly' }],
      'functional/no-loop-statements': 'warn',
      'functional/prefer-readonly-type': [
        'warn',
        { allowLocalMutation: true, ignoreClass: true, ignoreInterface: false },
      ],
    },
  },
  {
    files: ['**/*.html'],
    languageOptions: { parser: templateParser },
    plugins: { '@angular-eslint/template': angularTemplate },
    rules: {
      '@angular-eslint/template/eqeqeq': 'error',
      '@angular-eslint/template/banana-in-box': 'error',
    },
  },
);
