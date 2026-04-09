import { combineScopes } from './combine-scopes.ee';
import type { Scope, ScopeLevels, ScopeOptions, MaskLevels } from '../types.ee';

/**
 * checa se o escopo existe nas permissões do usuário
 * 
 * @param scope - escopo(s) a ser(em) checado(s)
 * @param userScopes - níveis da permissão do usuário
 * @param masks - filtros opcionais de escopo
 * @param options - modo de checagem (padrão: oneof)
 */
export const hasScope = (
    scope: Scope | Scope[],
	userScopes: ScopeLevels,
	masks?: MaskLevels,
	options: ScopeOptions = { mode: 'oneOf' }
): boolean => {
    if (!Array.isArray(scope))
        scope = [scope];
	
    const userScopeSet = combineScopes(userScopes, masks);
	
    return options.mode === 'allOf'
		? !!scope.length && scope.every((s) => userScopeSet.has(s))
		: scope.some((s) => userScopeSet.has(s));
};