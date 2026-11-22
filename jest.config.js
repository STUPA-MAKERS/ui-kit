/** Jest config — Angular standalone lib via jest-preset-angular (ESM-aware). */
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/markdown-editor', '<rootDir>/markdown-view', '<rootDir>/pwa', '<rootDir>/shell', '<rootDir>/screens', '<rootDir>/views'],
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    '\\.(css|scss)$': '<rootDir>/testing/style-mock.js',
    // The secondary entries (markdown editor, pwa, shell) import the primary entry by its name.
    '^@stupa-makers/ui-kit$': '<rootDir>/src/public-api.ts',
    '^@stupa-makers/ui-kit/markdown-editor$': '<rootDir>/markdown-editor/src/public-api.ts',
    '^@stupa-makers/ui-kit/markdown-view$': '<rootDir>/markdown-view/src/public-api.ts',
    '^@stupa-makers/ui-kit/screens$': '<rootDir>/screens/src/public-api.ts',
    '^@stupa-makers/ui-kit/shell$': '<rootDir>/shell/src/public-api.ts',
    '^@stupa-makers/ui-kit/views/(.*)$': '<rootDir>/views/$1/src/public-api.ts',
  },
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$|@angular|rxjs)'],
  collectCoverageFrom: [
    'src/lib/**/*.ts',
    'markdown-editor/src/**/*.ts',
    'markdown-view/src/**/*.ts',
    'pwa/src/**/*.ts',
    'shell/src/**/*.ts',
    'screens/src/**/*.ts',
    'views/*/src/**/*.ts',
    '!**/*.spec.ts',
    '!**/index.ts',
  ],
};
