import { baseConfig } from '@cernos/stylelint-config/base';

export default {
    ...baseConfig,

    rules: {
        ...baseConfig.rules,

        '@cernos/css-var-naming': [true, {
            severity: 'error'
        }]
    }
};