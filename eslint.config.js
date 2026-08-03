import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/', 'node_modules/', 'scripts/', 'src/__tests__/', '*.mjs'],
  },
  {
    files: ['src/**/*.ts'],
    extends: [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Allow unused vars prefixed with underscore (intentional ignores)
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Allow numbers and strings in template expressions
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // Non-null assertions are sometimes necessary in DOM code — warn, don't error
      '@typescript-eslint/no-non-null-assertion': 'warn',
      // Ensure switch statements on discriminated unions cover all cases
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      // Prefer for-of over indexed loops (stylistic)
      '@typescript-eslint/prefer-for-of': 'error',
      // Catch unnecessary type assertions
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      // The T generic in el() is inferred from usage — allow single-use type params
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
      // Void in arrow shorthand is common in event handlers
      '@typescript-eslint/no-confusing-void-expression': 'off',
      // Allow type aliases for simple object shapes
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      // || is a valid intentional pattern when falsy values (0, '') should be caught
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      // DOM code often checks truthiness of values that TS considers always-truthy
      '@typescript-eslint/no-unnecessary-condition': 'off',
      // Floating promises: error for async calls that are not handled
      '@typescript-eslint/no-floating-promises': 'error',
      // Allow type assertion function style (e.g., non-nullable-type-assertion-style)
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
    },
  },
);
