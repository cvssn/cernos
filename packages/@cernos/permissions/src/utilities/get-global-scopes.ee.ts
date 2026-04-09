import type { AuthPrincipal } from '../types.ee';

/**
 * obtém escopos globais para um cargo principal
 * 
 * @param principal - contém o cargo para visualizar
 * 
 * @returns array dos escopos para o cargo, ou um array vazio caso não encontrado
 */
export const getGlobalScopes = (principal: AuthPrincipal) =>
    principal.role.scopes.map((scope) => scope.slug) ?? [];