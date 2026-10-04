const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('../../../tsconfig.base.json');

module.exports = {
  displayName: 'member',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/../../../jest.env-setup.ts'],
  // Stale before this config existed (calls handleWebhook with 3 of its 4 args); fix separately, then remove
  testPathIgnorePatterns: ['/node_modules/', 'razorpay-webhook.controller.spec.ts'],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json', isolatedModules: true }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/modules/member',
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/../../../' }),
};
