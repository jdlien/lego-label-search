/** @type {import('jest').Config} */
const config = {
  // Use Node test environment for API testing
  testEnvironment: 'node',

  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],

  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.test.ts',
  ],

  // Module paths
  moduleDirectories: ['node_modules', '<rootDir>'],

  // Coverage configuration
  collectCoverageFrom: [
    'app/api/**/*.{js,ts}',
    '!app/api/**/*.d.ts',
    '!app/api/**/types.ts',
  ],

  coverageDirectory: '<rootDir>/coverage',

  coverageReporters: ['text', 'lcov', 'html'],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 90,
      statements: 90,
    },
  },

  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: ['next/babel'],
    }],
  },

  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@app/(.*)$': '<rootDir>/app/$1',
    '^@components/(.*)$': '<rootDir>/app/components/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1',
  },

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],

  // Global test timeout
  testTimeout: 30000,

  // Verbose output
  verbose: true,

  // Force exit after test run
  forceExit: true,

  // Detect open handles
  detectOpenHandles: true,

  // Max workers for parallel testing
  maxWorkers: '50%',
}

module.exports = config