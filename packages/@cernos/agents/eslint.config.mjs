import { defineConfig } from 'eslint/config';
import { nodeConfig } from '@cernos/eslint-config/node';

export default defineConfig({
    ignores: [
        'examples/**',
        'vitest.integration.config.*',
        'src/__tests__/fixtures/**'
    ]
}, nodeConfig, {
    rules: {
        'unicorn/filename-case': ['error', {
            case: 'kebabCase'
        }],

        '@typescript-eslint/naming-convention': ['error', {
            'selector': 'enumNumber',
            'format': ['UPPER_CASE', 'PascalCase']
        }]
    }
}, {
    files: ['src/__tests__/integration/**/*.ts'],

    rules: {
        '@typescript-eslint/require-await': 'off',
        'cernos-local-rules/no-uncaught-json-parse': 'off'
    }
});