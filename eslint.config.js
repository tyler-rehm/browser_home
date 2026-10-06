import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

const browser = {
  document: 'readonly',
  window: 'readonly',
  localStorage: 'readonly',
  Storage: 'readonly',
  URL: 'readonly',
  Blob: 'readonly',
  FormData: 'readonly',
  File: 'readonly',
  Element: 'readonly',
  Intl: 'readonly',
  TextEncoder: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  getComputedStyle: 'readonly',
}

const node = {
  console: 'readonly',
  process: 'readonly',
  Buffer: 'readonly',
}

const vitest = {
  describe: 'readonly',
  it: 'readonly',
  expect: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
}

export default [
  {
    ignores: [
      'dist',
      'node_modules',
      'playwright-report',
      'test-results',
      'coverage',
      'vibe-probe',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...browser, ...node, ...vitest },
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^React$' }],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
]
