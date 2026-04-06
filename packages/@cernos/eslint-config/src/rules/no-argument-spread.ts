import { ESLintUtils } from "@typescript-eslint/utils";

export const NoArgumentSpreadRule = ESLintUtils.RuleCreator.withoutDocs({
	meta: {
		type: "problem",

		docs: {
			description:
				"evitar espalhar arrays potencialmente grandes em chamadas de funções ou construtores — isso pode causar estouro de pilha. use `.apply` ou `reflect.construct` em vez disso.",
		},

		fixable: "code",

		messages: {
			noUnboundedSpread:
				"evitar espalhar um array em chamadas de função ou construtor, a menos que se saiba que ele é pequeno.",
			replaceWithApply:
				"substituir `array.push(...largearray)` por `array.push.apply(array, largearray)` para evitar possíveis estouros de pilha.",
			replaceWithReflect:
				"substituir `new constructor(...args)` por `reflect.construct(constructor, args)` para evitar possíveis estouros de pilha.",
		},

		schema: [],
	},

	defaultOptions: [],

	create(context) {
		return {
			CallExpression(node) {
				for (const arg of node.arguments) {
					if (arg.type !== "SpreadElement") continue;

					const spreadArg = arg.argument;

					// permite o spread de arrays inline
					if (spreadArg.type === "ArrayExpression") return;

					// apenas autofix caso seja o argumento solo
					const canFix = node.arguments.length === 1;

					context.report({
						node,

						messageId: "replaceWithApply",

						fix: canFix
							? (fixer) => {
									const source = context.sourceCode;

									if (node.callee.type === "MemberExpression") {
										// preservar `this`
										const thisText = source.getText(node.callee.object);
										const calleeText = source.getText(node.callee);
										const argText = source.getText(spreadArg);

										return fixer.replaceText(
											node,
											`${calleeText}.apply(${thisText}, ${argText})`,
										);
									} else {
										// não é memberexpression, utilizar undefined como thisarg
										const calleeText = source.getText(node.callee);
										const argText = source.getText(spreadArg);

										return fixer.replaceText(
											node,
											`${calleeText}.apply(undefined, ${argText})`,
										);
									}
								}
							: null,
					});
				}
			},

			NewExpression(node) {
				for (const arg of node.arguments || []) {
					if (arg.type !== "SpreadElement") continue;

					const spreadArg = arg.argument;

					if (spreadArg.type === "ArrayExpression") return;

					const canFix = node.arguments.length === 1;

					context.report({
						node,

						messageId: "replaceWithReflect",

						fix: canFix
							? (fixer) => {
									const source = context.sourceCode;
									const ctorText = source.getText(node.callee);
									const argText = source.getText(spreadArg);

									return fixer.replaceText(
										node,
										`reflect.construct(${ctorText}, ${argText})`,
									);
								}
							: null,
					});
				}
			},
		};
	},
});
