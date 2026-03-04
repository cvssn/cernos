import { Flags } from "@oclif/core";

export const testScenariosPath = Flags.string({
	description: "o path para os scenarios",
	default: "scenarios",
});
