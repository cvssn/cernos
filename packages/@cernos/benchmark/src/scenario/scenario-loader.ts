import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "path";

import type { Scenario, ScenarioManifest } from "@/types/scenario";

export class ScenarioLoader {
	/**
	 * carrega todos os scenarios do path fornecido
	 */
	loadAll(pathToScenarios: string, filter?: string): Scenario[] {
		pathToScenarios = path.resolve(pathToScenarios);

		const scenarioFolders = fs
			.readdirSync(pathToScenarios, { withFileTypes: true })
			.filter((dirent) => dirent.isDirectory())
			.map((dirent) => dirent.name);

		const scenarios: Scenario[] = [];

		for (const folder of scenarioFolders) {
			if (filter && folder.toLowerCase() !== filter.toLowerCase()) {
				continue;
			}

			const scenarioPath = path.join(pathToScenarios, folder);
			const manifestFileName = `${folder}.manifest.json`;
			const scenarioManifestPath = path.join(
				pathToScenarios,
				folder,
				manifestFileName,
			);

			if (!fs.existsSync(scenarioManifestPath)) {
				console.warn(
					`scenario em ${scenarioPath} está com o arquivo ${manifestFileName} ausente`,
				);

				continue;
			}

			// carrega o arquivo de manifesto do scenario
			const [scenario, validationErrors] =
				this.loadAndValidateScenarioManifest(scenarioManifestPath);

			if (validationErrors) {
				console.warn(
					`scenario em ${scenarioPath} possui os seguintes erros de validação: ${validationErrors.join(", ")}`,
				);

				continue;
			}

			scenarios.push({
				...scenario,

				id: this.formScenarioId(scenarioPath),
				scenarioDirPath: scenarioPath,
			});
		}

		return scenarios;
	}

	private loadAndValidateScenarioManifest(
		scenarioManifestPath: string,
	): [ScenarioManifest, null] | [null, string[]] {
		const [scenario, error] = this.loadScenarioManifest(scenarioManifestPath);

		if (!scenario) {
			return [null, [error]];
		}

		const validationErrors: string[] = [];

		if (!scenario.name) {
			validationErrors.push(
				`scenario em ${scenarioManifestPath} está com o nome ausente`,
			);
		}

		if (!scenario.description) {
			validationErrors.push(
				`scenario em ${scenarioManifestPath} está com a descrição ausente`,
			);
		}

		return validationErrors.length === 0
			? [scenario, null]
			: [null, validationErrors];
	}

	private loadScenarioManifest(
		scenarioManifestPath: string,
	): [ScenarioManifest, null] | [null, string] {
		try {
			const scenario = JSON.parse(
				fs.readFileSync(scenarioManifestPath, "utf8"),
			) as ScenarioManifest;

			return [scenario, null];
		} catch (error) {
			const message =
				error instanceof Error ? error.message : JSON.stringify(error);

			return [
				null,
				`falha ao analisar o manifesto ${scenarioManifestPath}: ${message}`,
			];
		}
	}

	private formScenarioId(scenarioPath: string): string {
		return createHash("sha256").update(scenarioPath).digest("hex");
	}
}
