module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['next', 'next/core-web-vitals', 'eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    indent: ['error', 2, { offsetTernaryExpressions: true }],
    // WHEN EDITING ANY OF THE RULES BELOW, COPY THEM OVER TO server/.eslintrc.js
    semi: [
      'error',
      'always',
      {
        omitLastInOneLineBlock: true,
      },
    ],
    quotes: [
      'error',
      'single',
      {
        avoidEscape: true,
      },
    ],
    'comma-dangle': ['error', 'always-multiline'],
    'max-len': [
      'warn',
      {
        code: 120,
        tabWidth: 2,
        ignoreComments: true,
        ignoreTrailingComments: false,
      },
    ],
  },
};
