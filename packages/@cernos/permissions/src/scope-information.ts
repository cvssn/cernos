import { API_KEY_RESOURCES, RESOURCES } from './constants.ee';
import type { ApiKeyScope, Scope, ScopeInformation } from './types.ee';

function buildResourceScopes() {
    const resourceScopes = Object.entries(RESOURCES).flatMap(([resource, operations]) => [
        ...operations.map((op) => `${resource}:${op}` as const),
        `${resource}:*` as const
    ]) as Scope[];

    resourceScopes.push('*' as const); // curinga global

    return resourceScopes;
}

function buildApiKeyScopes() {
    const apiKeyScopes = Object.entries(API_KEY_RESOURCES).flatMap(([resource, operations]) => [
        ...operations.map((op) => `${resource}:${op}` as const)
    ]) as ApiKeyScope[];

    return new Set(apiKeyScopes);
}

export const ALL_SCOPES = buildResourceScopes();
export const ALL_API_KEY_SCOPES = buildApiKeyScopes();

export const scopeInformation: Partial<Record<Scope, ScopeInformation>> = {
    'aiAssistant:manage': {
		displayName: 'gerenciar uso de ia',
		description: 'permite gerenciar as configurações de uso de ia.'
	},
	
    'annotationTag:create': {
		displayName: 'criar tag de anotação',
		description: 'permite a criação de novas tags de anotação.'
	},
	
    'workflow:publish': {
		displayName: 'publicar workflow',
		description: 'permite a publicação de workflows.'
	},
	
    'workflow:unpublish': {
		displayName: 'despublicar workflow',
		description: 'permite a despublicação de workflows.'
	},
	
    'workflow:unshare': {
		displayName: 'cancelar compartilhamento de workflow',
		description: 'permite remover o compartilhamento de workflow.'
	},
	
    'credential:unshare': {
		displayName: 'cancelar compartilhamento de credencial',
		description: 'permite remover o compartilhamento de credencial.'
	},

	'insights:read': {
		displayName: 'ler insights',
		description: 'permite a leitura de dados de insights.'
	}
};