export default {
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'ts-jest'
  },
  testMatch: [
    '**/__tests__/**/*.ts?(x)', 
    '**/?(*.)+(spec|test).ts?(x)',
    '**/__tests__/**/*.js?(x)', 
    '**/?(*.)+(spec|test).js?(x)'
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1'
  },
  resolver: '<rootDir>/jest-resolver.cjs',
  transformIgnorePatterns: [
    'node_modules/(?!(@astrojs)/)'
  ],
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
};