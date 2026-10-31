/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFiles: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@potionpulse/contracts$': '<rootDir>/../../packages/contracts/src',
    '^@potionpulse/ui-tokens$': '<rootDir>/../../packages/ui-tokens/src',
  },
  testMatch: ['**/__tests__/**/*.spec.(ts|tsx)'],
};
