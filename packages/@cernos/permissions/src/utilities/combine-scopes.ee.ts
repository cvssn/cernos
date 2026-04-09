import type { Scope, ScopeLevels, MaskLevels } from '../types.ee';

/**
 * combina os escopos de diferentes níveis em um set deduplicado
 * 
 * @param userScopes - escopos organizados por nível (global, projeto, recurso)
 * @param masks - filtros opcionais para escopos não-globais
 * 
 * @returns set contendo todos os escopos permitidos
 * 
 * @example
 * combinescopes({
 *     global: ['user:list'],
 *     project: ['workflow:read']
 * }, { sharing: ['workflow:read'] });
 */
export function combineScopes(userScopes: ScopeLevels, masks?: MaskLevels): Set<Scope> {
    const maskedScopes: ScopeLevels = Object.fromEntries(
		Object.entries(userScopes).map((e) => [e[0], [...e[1]]])
	) as ScopeLevels;

	if (masks?.sharing) {
		if (maskedScopes.project) {
			maskedScopes.project = maskedScopes.project.filter((v) => masks.sharing.includes(v));
		}
        
		if (maskedScopes.resource) {
			maskedScopes.resource = maskedScopes.resource.filter((v) => masks.sharing.includes(v));
		}
	}

	return new Set(Object.values(maskedScopes).flat());
}