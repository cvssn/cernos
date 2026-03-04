import { Command } from "@oclif/core";

import { testScenariosPath } from "@/config/common-flags";
import { ScenarioLoader } from "@/scenario/scenario-loader";

export default class ListCommand extends Command {
	static description = "lista todos os scenarios disponíveis";

	static flags = {
		testScenariosPath,
	};

	async run() {
		const { flags } = await this.parse(ListCommand);
		const scenarioLoader = new ScenarioLoader();
		const allScenarios = scenarioLoader.loadAll(flags.testScenariosPath);

		console.log("scenarios de teste disponíveis:");
		console.log("");

		for (const scenario of allScenarios) {
			console.log("\t", scenario.name, ":", scenario.description);
		}
	}
}
