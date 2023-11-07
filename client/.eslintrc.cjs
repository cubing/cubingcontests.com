module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['next', 'next/core-web-vitals', 'eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'react/no-unescaped-entities': 'off',
    'no-irregular-whitespace': 'off',
    indent: ['warn', 2, { offsetTernaryExpressions: true, SwitchCase: 1 }],
    // WHEN EDITING ANY OF THE RULES BELOW, COPY THEM OVER TO server/.eslintrc.js
    '@typescript-eslint/no-unused-vars': 'error',
    semi: ['error', 'always', { omitLastInOneLineBlock: true }],
    quotes: ['warn', 'single', { avoidEscape: true }],
    'comma-dangle': ['error', 'always-multiline'],
  },
};
