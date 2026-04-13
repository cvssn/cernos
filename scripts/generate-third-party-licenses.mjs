#!/usr/bin/env node

/**
 * gerador de licenças third-party para o cernos
 * 
 * gera third_party_licenses.md escaneando todas as dependências
 * utilizando license-checker, extraindo a informação de licença
 * e formatando em um report markdown
 * 
 * uso: node scripts/generate-third-party-licenses.mjs
 */

import { $, echo, fs, chalk } from 'zx';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

// desabilita o output zx verbose
$.verbose = false;

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(scriptDir, '..');

const config = {
    tempLicenseFile: 'licenses.json',
    outputFile: 'THIRD_PARTY_LICENSES.md',

    invalidLicenseFiles: [
        'readme.md',
        'readme.txt',
        'readme',
        'package.json',
        'changelog.md',
        'history.md'
    ],

    validLicenseFiles: [
        'license',
        'license',
        'copying',
        'copyright',
        'unlicense'
    ],

    paths: {
        root: rootDir,
        cliRoot: path.join(rootDir, 'packages', 'cli'),
        formatConfig: path.join(scriptDir, 'third-party-license-format.json'),
        tempLicenses: path.join(os.tmpdir(), 'licenses.json'),
        output: path.join(rootDir, 'packages', 'cli', 'THIRD_PARTY_LICENSES.md')
    }
};

// #region ===== funções ajudantes =====

async function generateLicenseData() {
    echo(chalk.yellow('[📊] rodando license-checker...'));

    try {
        $.cwd = config.paths.root;

        await $`pnpm exec license-checker --json --customPath ${config.paths.formatConfig}`.pipe(
            fs.createWriteStream(config.paths.tempLicenses)
        );

        echo(chalk.green('[✅] dados de licença coletados'));

        return config.paths.tempLicenses;
    } catch (error) {
        echo(chalk.red('[❌] falha ao rodar license-checker'));

        throw error;
    }
}

async function readLicenseData(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        const parsed = JSON.parse(data);

        echo(chalk.green(`[✅] ${Object.keys(parsed).length} pacotes analisados`));

        return parsed;
    } catch (error) {
        echo(chalk.red('[❌] falha ao analisar dados de licença'));

        throw error;
    }
}

function parsePackageKey(packageKey) {
    const lastAtIndex = packageKey.lastIndexOf('@');

    return {
        packageName: packageKey.substring(0, lastAtIndex),
        version: packageKey.substring(lastAtIndex + 1)
    };
}

function shouldExcludePackage(packageName) {
    const cernosPatterns = [
        /^@cernos\//, // @cernos/package
        /^@cernos_/,  // @cernos_io/package
        /^cernos-/,   // cernos-package
        /-cernos/     // package-cernos
    ];

    return cernosPatterns.some(pattern => pattern.test(packageName));
}

function isValidLicenseFile(filePath) {
    if (!filePath)
        return false;

    const fileName = path.basename(filePath).toLowerCase();

    // excluir arquivos que não sejam licenças
    const isInvalidFile = config.invalidLicenseFiles.some(
        (invalid) => fileName === invalid || fileName.endsWith(invalid)
    );

    if (isInvalidFile)
        return false;

    // deve conter palavras-chave relacionadas a licenças
    return config.validLicenseFiles.some((valid) => fileName.includes(valid));
}

function getFallbackLicenseText(licenseType, packages = []) {
    const fallbacks = {
        'CC-BY-3.0': 'Creative Commons Attribution 3.0 Unported License\n\nFull license text available at: https://creativecommons.org/licenses/by/3.0/legalcode',
		'LGPL-3.0-or-later': 'GNU Lesser General Public License v3.0 or later\n\nFull license text available at: https://www.gnu.org/licenses/lgpl-3.0.html',
		'PSF': 'Python Software Foundation License\n\nFull license text available at: https://docs.python.org/3/license.html',
		'(MIT OR CC0-1.0)': 'Licensed under MIT OR CC0-1.0\n\nMIT License full text available at: https://opensource.org/licenses/MIT\nCC0 1.0 Universal full text available at: https://creativecommons.org/publicdomain/zero/1.0/legalcode',
		'UNKNOWN': `License information not available for the following packages:\n${packages.map(pkg => `- ${pkg.name} ${pkg.version}`).join('\n')}\n\nPlease check individual package repositories for license details.`
    };

    // checa por licenças customizadas que começam como "custom:"
    if (licenseType.startsWith('Custom:')) {
        return `licença customizada. veja: ${licenseType.replace('Custom: ', '')}`;
    }

    return fallbacks[licenseType] || null;
}

function cleanLicenseText(text) {
    return text
        .replaceAll('\\n', '\n')
        .replaceAll('\\"', '"')
        .replaceAll('\r\n', '\n')
        .trim();
}

function addPackageToGroup(licenseGroups, licenseType, packageInfo) {
    if (!licenseGroups.has(licenseType)) {
        licenseGroups.set(licenseType, []);
    }

    licenseGroups.get(licenseType).push(packageInfo);
}

function processLicenseText(licenseTexts, licenseType, pkg) {
    if (!licenseTexts.has(licenseType)) {
        licenseTexts.set(licenseType, null);
    }

    if (!licenseTexts.get(licenseType) && pkg.licenseText?.trim() && isValidLicenseFile(pkg.licenseFile)) {
		licenseTexts.set(licenseType, cleanLicenseText(pkg.licenseText));
	}
}

function applyFallbackLicenseTexts(licenseTexts, licenseGroups) {
    const missingTexts = [];
    const fallbacksUsed = [];

    for (const [licenseType, text] of licenseTexts.entries()) {
        if (!text || !text.trim()) {
            const packagesForLicense = licenseGroups.get(licenseType) || [];
            const fallback = getFallbackLicenseText(licenseType, packagesForLicense);

            if (fallback) {
                licenseTexts.set(licenseType, fallback);
                fallbacksUsed.push(licenseType);
            } else {
                missingTexts.push(licenseType);
            }
        }
    }

    return {
        missingTexts,
        fallbacksUsed
    };
}

function logProcessingResults(processedCount, licenseGroupCount, fallbacksUsed, missingTexts) {
    echo(chalk.cyan(`[📦] ${processedCount} pacotes processados em ${licenseGroupCount} grupos de licenças`));

    if (fallbacksUsed.length > 0) {
        echo(chalk.blue(`[ℹ️] textos de fallbacks utilizados para: ${fallbacksUsed.join(', ')}`));
    }

    if (missingTexts.length > 0) {
        echo(chalk.yellow(`[⚠️] textos de licença ainda ausentes para: ${missingTexts.join(', ')}`));
    } else {
        echo(chalk.green(`[✅] todos os tipos de licenças possuem textos`));
    }
}

function processPackages(packages) {
    const licenseGroups = new Map();
    const licenseTexts = new Map();

    let processedCount = 0;

    for (const [packageKey, pkg] of Object.entries(packages)) {
        const { packageName, version } = parsePackageKey(packageKey);

        if (shouldExcludePackage(packageName)) {
            continue;
        }

        const licenseType = pkg.licenses || 'Unknown';

        processedCount++;

        // agrupa pacotes por licença
        addPackageToGroup(licenseGroups, licenseType, {
            name: packageName,
            version,
            repository: pkg.repository,
            copyright: pkg.copyright
        });

        // armazena texto de licença
        processLicenseText(licenseTexts, licenseType, pkg);
    }

    // aplica textos de licença de fallback para os ausentes
    const {
        missingTexts,
        fallbacksUsed
    } = applyFallbackLicenseTexts(licenseTexts, licenseGroups);

    logProcessingResults(processedCount, licenseGroups.size, fallbacksUsed, missingTexts);

    return {
        licenseGroups,
        licenseTexts,
        processedCount
    };
}

// #endregion ===== funções ajudantes =====

// #region ===== geração de documento =====

function createPackageSection(licenseType, packages) {
    const sortedPackages = [...packages].sort((a, b) => a.name.localeCompare(b.name));

    let section = `## ${licenseType}\n\n`;

    for (const pkg of sortedPackages) {
        section += `* ${pkg.name} ${pkg.version}`;

        if (pkg.copyright) {
            section += `, ${pkg.copyright}`;
        }

        section += '\n';
    }

    section += '\n';

    return section;
}

function createLicenseTextSection(licenseType, licenseText) {
    let section = `## ${licenseType} texto de licença\n\n`;

    if (licenseText && licenseText.trim()) {
        section += `\`\`\`\n${licenseText}\n\`\`\`\n\n`;
    } else {
        section += `texto de licença ${licenseType} não disponível.\n\n`;
    }

    return section;
}

function createDocumentHeader() {
    return `# licenças third-party

esse arquivo lista os componentes de software third-party inclusos no cernos e seus respectivos termos de licença.

o software cernos inclui pacotes, bibliotecas e módulos de código aberto, cada um sujeito à sua própria licença. As seções a seguir listam essas dependências e fornecem as atribuições e os textos de licença necessários.

`;
}

function buildMarkdownDocument(packages) {
    const {
        licenseGroups,
        licenseTexts,
        processedCount
    } = processPackages(packages);

    let document = createDocumentHeader();

    const sortedLicenseTypes = [...licenseGroups.keys()].sort();

    // primeiro: adicionar todas as seções de pacotes
    for (const licenseType of sortedLicenseTypes) {
        const packages = licenseGroups.get(licenseType);

        document += createPackageSection(licenseType, packages);
    }

    // segundo: adicionar seção de texto das licenças
    document += '# texto de licenças\n\n';

    for (const licenseType of sortedLicenseTypes) {
        const licenseText = licenseTexts.get(licenseType);

        document += createLicenseTextSection(licenseType, licenseText);
    }

    return {
        content: document, processedCount
    };
}

// #endregion ===== geração de documento =====

async function generateThirdPartyLicenses() {
    echo(chalk.blue('[🚀] gerando licenças third-party para cernos...'));

    try {
        const licensesJsonPath = await generateLicenseData();
		const packages = await readLicenseData(licensesJsonPath);

        echo(chalk.yellow('[📝] construindo documento markdown...'));

        const {
            content,
            processedCount
        } = buildMarkdownDocument(packages);

        await fs.ensureDir(config.paths.cliRoot);
		await fs.writeFile(config.paths.output, content);

        // limpa o arquivo temporário
        await fs.remove(licensesJsonPath);

        echo(chalk.green('\n[🎉] geração de licença completada com sucesso!'));
        echo(chalk.green(`[📄] output: ${config.paths.output}`));
        echo(chalk.green(`[📦] pacotes: ${processedCount}`));
    } catch (error) {
        echo(chalk.red(`\n[❌] geração falhou: ${error.message}`));

        process.exit(1);
    }
}

generateThirdPartyLicenses();