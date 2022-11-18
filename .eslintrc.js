module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json'],
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'jest'],
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  rules: {
    'object-shorthand': 'warn',
    'no-useless-rename': 'warn',
    'prettier/prettier': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { varsIgnorePattern: '_$', argsIgnorePattern: '_$' },
    ],
    'object-curly-spacing': ['warn', 'always'],
    'require-await': 'warn',
    '@typescript-eslint/explicit-module-boundary-types': 'warn',
    '@typescript-eslint/no-empty-function': 'warn',
    '@typescript-eslint/no-empty-interface': 'warn',
    'prefer-const': 'warn',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error',
  },
  overrides: [
    {
      files: ['**/*.spec.ts'],
      rules: {
        'require-await': 'off',
        '@typescript-eslint/no-empty-function': 'off',
      },
    },
  ],
};
