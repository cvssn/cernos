import { globalIgnores } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import VuePlugin from "eslint-plugin-vue";
import globals from "globals";
import tseslint from "typescript-eslint";

import { baseConfig } from "./base.js";

const isCI = process.env.CI === "true";
const extraFileExtensions = [".vue"];

const allGlobals = {
	NodeJS: true,

	...globals.node,
	...globals.browser,
};

export const frontendConfig = tseslint.config(
	globalIgnores(["**/*.js", "**/*.d.ts", "vite.config.ts", "**/*.ts.snap"]),

	baseConfig,

	VuePlugin.configs["flat/recommended"],
	{
		rules: {
			"no-console": "warn",
			"no-debugger": isCI ? "error" : "off",

			semi: [2, "always"],

			"comma-dangle": ["error", "always-multiline"],

			"@typescript-eslint/no-use-before-define": "warn",
			"@typescript-eslint/no-explicit-any": "error",
		},
	},
	{
		files: ["**/*.ts"],

		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",

			globals: allGlobals,

			parser: tseslint.parser,

			parserOptions: {
				projectService: true,

				extraFileExtensions,
			},
		},
	},
	{
		files: [
			"**/*.test.ts",
			"**/test/**/*.ts",
			"**/__tests__/**/*.ts",
			"**/*.stories.ts",
		],

		rules: {
			"import-x/no-extraneous-dependencies": "warn",
			"vue/one-component/per-file": "off",

			// todo: remover esses
			"cernos-local-rules/no-internal-package-import": "warn",
		},
	},
	{
		files: ["**/*.vue"],

		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",

			globals: allGlobals,

			parserOptions: {
				parser: tseslint.parser,

				extraFileExtensions,
			},
		},

		rules: {
			"vue/no-deprecated-slot-attribute": "error",
			"vue/no-deprecated-slot-scope-attribute": "error",
			"vue/no-multiple-template-root": "error",
			"vue/v-slot-style": "error",
			"vue/no-unused-components": "error",

			"vue/no-undef-components": [
				"error",
				{
					ignorePatterns: [
						"RouterLink", // componente global do vue router
						"RouterView", // componente global do vue router

						"Teleport", // integrado no vue 3
						"Transition", // integrado no vue 3
						"TransitionGroup", // integrado no vue 3
						"KeepAlive", // integrado no vue 3
						"Suspense", // integrado no vue 3
					],
				},
			],

			"vue/multi-word-component-names": "off",

			"vue/component-name-in-template-casing": [
				"error",

				"PascalCase",
				{
					registeredComponentsOnly: false,
				},
			],

			"vue/no-reserved-component-names": [
				"error",

				{
					disallowVueBuiltInComponents: true,
					disallowVue3BuiltInComponents: false,
				},
			],

			"vue/prop-name-casing": ["error", "camelCase"],
			"vue/attribute-hyphenation": ["error", "always"],
			"vue/define-emits-declaration": ["error", "type-literal"],

			"vue/require-macro-variable-name": [
				"error",

				{
					defineProps: "props",
					defineEmits: "emit",
					defineSlots: "slots",

					useSlots: "slots",
					useAttrs: "attrs",
				},
			],

			"vue/block-order": [
				"error",

				{
					order: ["script", "template", "style"],
				},
			],

			"vue/no-v-html": "error",

			// todo: remover isto
			"vue/no-mutating-props": "warn",
			"vue/no-side-effects-in-computed-properties": "warn",
			"vue/no-v-text-v-html-on-component": "warn",
			"vue/return-in-computed-property": "warn",
			"cernos-local-rules/no-internal-package-import": "warn",
		},
	},

	eslintConfigPrettier,
);
