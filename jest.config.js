/** Jest config — Angular standalone lib via jest-preset-angular (ESM-aware). */
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/markdown-editor', '<rootDir>/pwa'],
  testMatch: ['**/*.spec.ts'],
  moduleNameMapper: {
    '\\.(css|scss)$': '<rootDir>/testing/style-mock.js',
    // The secondary entries (markdown editor, pwa) import the primary entry by its name.
    '^@stupa-makers/ui-kit$': '<rootDir>/src/public-api.ts',
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
    'pwa/src/**/*.ts',
    '!**/*.spec.ts',
    '!**/index.ts',
  ],
};
