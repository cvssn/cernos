import { ESLintUtils } from "@typescript-eslint/utils";

export const MisplacedCernosTypeormImportRule =
	ESLintUtils.RuleCreator.withoutDocs({
		meta: {
			type: "problem",

			docs: {
				description:
					"certifique-se de que `@cernos/typeorm` esteja importado apenas com o pacote `@cernos/db`.",
			},

			messages: {
				moveImport: "mova este import para `@cernos/db`.",
			},

			schema: [],
		},

		defaultOptions: [],

		create(context) {
			return {
				ImportDeclaration(node) {
					if (
						node.source.value === "@cernos/typeorm" &&
						!context.filename.includes("@cernos/db")
					) {
						context.report({
							node,

							messageId: "moveImport",
						});
					}
				},
			};
		},
	});
