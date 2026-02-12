import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['**/tests/**/*.test.ts'],
  setupFilesAfterFramework: ['./tests/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/types/**',
    '!src/server.ts',
    '!src/workers.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        strict: false,
      },
    },
  },
};

export default config;
