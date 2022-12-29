/*
//This was working before
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ["build/"]
};
*/
const { pathsToModuleNameMapper } = require('ts-jest')
const { compilerOptions } = require('./tsconfig')

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'node',
  roots: ["<rootDir>/src/"],
  modulePaths: [compilerOptions.baseUrl],
};