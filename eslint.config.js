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
      parserOptions: { project: ['tsconfig.lib.json', 'tsconfig.spec.json', 'showcase/tsconfig.app.json'] },
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
      'screens/**/*.ts',
      'views/**/*.ts',
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
      // §STUPA-Workflow:NF/accessibility/conformance/000492: every accessibility rule as an error.
      // angular-eslint 22 no longer ships the config inside the plugin, so the rules of its
      // accessibility config are listed here.
      '@angular-eslint/template/alt-text': 'error',
      '@angular-eslint/template/click-events-have-key-events': 'error',
      '@angular-eslint/template/elements-content': 'error',
      '@angular-eslint/template/interactive-supports-focus': 'error',
      '@angular-eslint/template/label-has-associated-control': 'error',
      '@angular-eslint/template/mouse-events-have-key-events': 'error',
      '@angular-eslint/template/no-autofocus': 'error',
      '@angular-eslint/template/no-distracting-elements': 'error',
      '@angular-eslint/template/role-has-required-aria': 'error',
      '@angular-eslint/template/table-scope': 'error',
      '@angular-eslint/template/valid-aria': 'error',
    },
  },
  // §S/framework/packages/002215: an entry point imports only the layers below it.
  ...[
    { files: ['src/**/*.ts'], banned: ['@stupa-makers/ui-kit/*'] },
    {
      files: ['markdown-view/**/*.ts', 'markdown-editor/**/*.ts', 'pwa/**/*.ts'],
      banned: ['@stupa-makers/ui-kit/shell', '@stupa-makers/ui-kit/screens', '@stupa-makers/ui-kit/views/*'],
    },
    { files: ['shell/**/*.ts'], banned: ['@stupa-makers/ui-kit/screens', '@stupa-makers/ui-kit/views/*'] },
    { files: ['screens/**/*.ts'], banned: ['@stupa-makers/ui-kit/shell', '@stupa-makers/ui-kit/views/*'] },
    { files: ['views/**/*.ts'], banned: ['@stupa-makers/ui-kit/shell', '@stupa-makers/ui-kit/views/*'] },
  ].map(({ files, banned }) => ({
    files,
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: banned, message: 'An entry point imports only the layers below it (002215).' },
            { group: ['**/testing/**', '**/testing'], message: 'Only a test imports /testing (002215).' },
            { group: ['../../*/src/*', '../../../*/src/*'], message: 'Import another entry point by its package name (002215).' },
          ],
        },
      ],
    },
  })),
  // The showcase app is not part of the package, so its selectors carry its own prefix (002209).
  {
    files: ['showcase/**/*.ts'],
    rules: {
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'sc', style: 'kebab-case' },
      ],
    },
  },
);
