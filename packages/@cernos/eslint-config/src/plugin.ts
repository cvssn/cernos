import type { ESLint } from "eslint";
import { rules } from "./rules/index.js";

const plugin = {
	meta: {
		name: "cernos-local-rules",
	},

	configs: {},

	// @ts-expect-error tipo de regras não batem com o typescript-eslint nem eslint
	rules: rules as ESLint.Plugin["rules"],
} satisfies ESLint.Plugin;

export const localRulesPlugin = {
	...plugin,

	configs: {
		recommended: {
			plugins: {
				"cernos-local-rules": plugin,
			},

			rules: {
				"cernos-local-rules/no-uncaught-json-parse": "error",
				"cernos-local-rules/no-json-parse-json-stringify": "error",
				"cernos-local-rules/no-unneeded-backticks": "error",
				"cernos-local-rules/no-interpolation-in-regular-string": "error",
				"cernos-local-rules/no-unused-param-in-catch-clause": "error",
				"cernos-local-rules/no-useless-catch-throw": "error",
				"cernos-local-rules/no-internal-package-import": "error",
				"cernos-local-rules/no-type-only-import-in-di": "error",
			},
		},
	},
} satisfies ESLint.Plugin;
