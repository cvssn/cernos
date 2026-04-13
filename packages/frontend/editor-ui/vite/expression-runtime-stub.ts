/**
 * stub de navegador para @cernos/expression-runtime
 * 
 * a implementação real utiliza isolated-vm (um módulo nativo
 * do node.js)
 * 
 * as guardas de is_frontend em expression.ts previnem de
 * nunca serem instanciadas
 */

export class ExpressionEvaluator {
    constructor(_config?: unknown) {
        throw new Error('expressionevaluator não está disponível nos ambientes de navegador');
    }
}

export class IsolatedVmBridge {
    constructor(_config?: unknown) {
        throw new Error('isolatedvmbridge não está disponível nos ambientes de navegador');
    }
}

export class ExpressionError extends Error {
    constructor(message: string, public context: Record<string, unknown> = {}) {
        super(message);
    }
}

export class MemoryLimitError extends Error {}
export class TimeoutError extends Error {}
export class SecurityViolationError extends Error {}

// nota: syntaxerror não re-exporta para isolar shadowing

export class RuntimeError extends Error {}

export function extend() {}
export function extendOptional() {}
export const EXTENSION_OBJECTS: unknown[] = [];
export class ExpressionExtensionError extends Error {}
export class IsolateError extends Error {}

export const DEFAULT_BRIDGE_CONFIG = {};

// exports type-only (resolvidos pelo typescript, apagados na runtime)
export type IExpressionEvaluator = never;
export type EvaluatorConfig = never;
export type WorkflowData = Record<string, unknown>;
export type EvaluateOptions = never;
export type RuntimeBridge = never;
export type BridgeConfig = never;
export type ObservabilityProvider = never;
export type MetricsAPI = never;
export type TracesAPI = never;
export type Span = never;
export type LogsAPI = never;
export type ExecuteOptions = never;