#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';

const isPackageJson = (file) => file.endsWith('package.json');
const files = process.argv.slice(2).filter((file) => file && isPackageJson(file) && existsSync(file));

let foundError = false;

for (const file of files) {
    try {
        const content = readFileSync(file, 'utf8');

        if (content.includes('"workspace:^"')) {
            if (!foundError) {
                console.log('');
                console.log("erro: 'workspace:^' encontrado em arquivos package.json");
                console.log('');
                console.log("use 'workspace:*' em vez de setar as versões exatas");
                console.log("usar 'workspace:^' faz o npm resolver o semver quando o usuário");
                console.log("instala do npm, que pode liderar para problemas entre as versões dos");
                console.log("pacotes de @cernos/* e então finalizar a inicialização do cernos");
                console.log('');
            }

            foundError = true;
        }
    } catch (error) {
        // ignorar erros de leitura para arquivos individuais
    }
}

if (foundError) {
    process.exit(1);
}