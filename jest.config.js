/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  maxWorkers: 2, // Jest is leaking, so limiting the number of workers allows to pass the test without OOMing your computer. More info https://github.com/facebook/jest/issues/11956
};
