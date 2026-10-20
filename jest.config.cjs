/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['<rootDir>/src/__tests__/**/*.(test|spec).(ts|tsx)'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
  },
  moduleNameMapper: {
    // kept from the old "jest" section in package.json
    '^src/util/getApiBaseUrl$': '<rootDir>/src/util/__mocks__/getApiBaseUrl.ts',
    '^src/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  clearMocks: true,
  restoreMocks: true,
  collectCoverageFrom: ['src/utils/**/*.ts', 'src/pages/Watchlist.tsx'],
  coverageReporters: ['text', 'text-summary', 'lcov', 'cobertura', 'json-summary'],
  coverageThreshold: { global: { statements: 90, branches: 85, functions: 90, lines: 90 } },
  reporters: ['default', ['jest-junit', { outputDirectory: 'reports', outputName: 'junit.xml' }]],
};