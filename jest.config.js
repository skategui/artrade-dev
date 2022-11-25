/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    'src/blockchain/*',
    'src/logging/*',
    'src/storage/*',
    'src/test/*',
    'src/config/*',
    'src/config/helpers/*',
    'src/types/*',
    'src/helpers/*',
  ],
  globalSetup: './src/test/jest-global-setup.ts',
  maxWorkers: 2, // Jest is leaking, so limiting the number of workers allows to pass the test without OOMing your computer. More info https://github.com/facebook/jest/issues/11956
};
