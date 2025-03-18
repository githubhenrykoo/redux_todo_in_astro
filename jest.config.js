export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', { configFile: './babel.config.cjs' }]
  },
  testMatch: ['**/__tests__/**/*.js?(x)', '**/?(*.)+(spec|test).js?(x)'],
  extensionsToTreatAsEsm: ['.jsx'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1'
  },
  resolver: '<rootDir>/jest-resolver.cjs',
  transformIgnorePatterns: [
    'node_modules/(?!(@astrojs)/)'
  ]
};