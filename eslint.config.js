import tsParser from '@typescript-eslint/parser';

export default [
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 'latest',
            sourceType: 'module'
        },
        rules: {
            'prefer-const': 'error',
            'no-var': 'error',
            'eqeqeq': 'error'
        }
    },
    {
        ignores: ['out/', 'node_modules/', '*.js', '.vscode-test/']
    }
];
