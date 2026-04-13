#!/usr/bin/env node

import { execSync } from 'node:child_process';

// pula instalação de lefthook no ci na construção do docker
if (process.env.CI || process.env.DOCKER_BUILD) {
    process.exit(0);
}

execSync('pnpm lefthook install', {
    stdio: 'inherit'
});