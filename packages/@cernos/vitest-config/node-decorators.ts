import swc from "unplugin-swc";

import { mergeConfig } from "vitest/config";
import type { InlineConfig } from "vitest/node";

import { createVitestConfig } from "./node.js";

const swcPlugin = swc.vite({
	jsc: {
		parser: {
			syntax: "typescript",

			decorators: true,
		},

		transform: {
			legacyDecorator: true,
			decoratorMetadata: true,
		},

		target: "es2022",
	},

	// inclui arquivos typescript de node_modules
	exclude: [],
});

export const createVitestConfigWithDecorators = (
	options: InlineConfig = {},
) => {
	const baseConfig = createVitestConfig(options);

	return mergeConfig(baseConfig, {
		plugins: [swcPlugin],

		esbuild: false,

		server: {
			deps: {
				// inlinear todas as dependências para transformação de swc
				inline: [/.*/],
			},
		},
	});
};

export const vitestConfigWithDecorators = createVitestConfigWithDecorators();
