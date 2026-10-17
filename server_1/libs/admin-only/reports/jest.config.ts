const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('../../../tsconfig.base.json');

module.exports = {
  displayName: 'reports',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/../../../jest.env-setup.ts'],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json', isolatedModules: true }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../coverage/libs/admin-only/reports',
  moduleNameMapper: {
    // Before the `@server_1/modules/*` wildcard, which jest would otherwise match first (delivery imports this path)
    '^@server_1/modules/member/models$': '<rootDir>/../../../libs/modules/member/src/models/index.ts',
    ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/../../../' }),
  },
};
