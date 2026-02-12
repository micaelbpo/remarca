module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 1,
      functions: 2,
      lines: 1,
      statements: 2,
    },
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
};
