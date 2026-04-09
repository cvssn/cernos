import type { z } from 'zod';

import type { RESOURCES, API_KEY_RESOURCES } from './constants.ee';

import type {
    assignableGlobalRoleSchema,
	credentialSharingRoleSchema,
	globalRoleSchema,
	Role,
	systemProjectRoleSchema,
	roleNamespaceSchema,
	teamRoleSchema,
	workflowSharingRoleSchema,
	secretsProviderConnectionSharingRoleSchema,
	assignableProjectRoleSchema
} from './schemas.ee';

import { PROJECT_OWNER_ROLE_SLUG } from './constants.ee';
import { ALL_API_KEY_SCOPES } from './scope-information';

export type ScopeInformation = {
    displayName: string;
    description?: string | null;
};

/** representa um recurso que pode ter permissões aplicadas nele */
export type Resource = keyof typeof RESOURCES;

/** um escopo de uma permissão para um recurso específico + combinação de operação */
type ResourceScope<
    R extends Resource,

    Operation extends (typeof RESOURCES)[R][number] = (typeof RESOURCES)[R][number]
> = `${R}:${Operation}`;

/** um escopo curinga se aplica a todas as operações em um recurso ou a todos os recursos*/
type WildcardScope = `${Resource}:*` | '*';

// isso é puramente um tipo intermediário
type AllScopesObject = {
    [R in Resource]: ResourceScope<R>;
};

/** um escopo de permissão no sistema */
export type Scope = AllScopesObject[Resource] | WildcardScope;

export type ScopeLevels = {
    global: Scope[];
    project?: Scope[];
    resource?: Scope[];
};

export type MaskLevels = {
    sharing: Scope[];
};

export type ScopeOptions = { mode: 'oneOf' | 'allOf' };

export type RoleNamespace = z.infer<typeof roleNamespaceSchema>;
export type GlobalRole = z.infer<typeof globalRoleSchema>;
export type AssignableGlobalRole = z.infer<typeof assignableGlobalRoleSchema>;
export type CredentialSharingRole = z.infer<typeof credentialSharingRoleSchema>;
export type WorkflowSharingRole = z.infer<typeof workflowSharingRoleSchema>;
export type SecretsProviderConnectionSharingRole = z.infer<typeof secretsProviderConnectionSharingRoleSchema>;
export type TeamProjectRole = z.infer<typeof teamRoleSchema>;
export type ProjectRole = z.infer<typeof systemProjectRoleSchema>;
export type AssignableProjectRole = z.infer<typeof assignableProjectRoleSchema>;

/**
 * proteção de tipo para slugs de funções de projeto atribuíveis
 * 
 * funções de projeto personalizadas são suportadas. se
 * considera qualquer slug que:
 * 
 * - inicia com o prefixo `project:`, e
 * - não é um cargo personal owner
 * 
 * para ser um cargo de projeto atribuível
 */
export function isAssignableProjectRoleSlug(slug: string): slug is AssignableProjectRole {
    return slug.startsWith('project:') && slug !== PROJECT_OWNER_ROLE_SLUG;
}

/** união de todos os tipos de cargos possíveis no sistema */
export type AllRoleTypes =
    | GlobalRole
    | ProjectRole
    | WorkflowSharingRole
    | CredentialSharingRole
    | SecretsProviderConnectionSharingRole;

export type AllRolesMap = {
    global: Role[];
    project: Role[];
	credential: Role[];
	workflow: Role[];
	secretsProviderConnection: Role[];
};

export type DbScope = {
    slug: Scope;
};

export type DbRole = {
    slug: string;
    scopes: DbScope[];
};

/**
 * representa uma entidade autenticada no sistema que pode
 * possuir permissões específicas
 * 
 * @property role - o cargo global
 */
export type AuthPrincipal = {
    role: DbRole
};

// #region api pública

type PublicApiKeyResources = keyof typeof API_KEY_RESOURCES;

type ApiKeyResourceScope<
    R extends PublicApiKeyResources,

    Operation extends (typeof API_KEY_RESOURCES)[R][number] = (typeof API_KEY_RESOURCES)[R][number]
> = `${R}:${Operation}`;

// isso é puramente um tipo intermediário
type AllApiKeyScopesObject = {
    [R in PublicApiKeyResources]: ApiKeyResourceScope<R>;
};

export type ApiKeyScope = AllApiKeyScopesObject[PublicApiKeyResources];

export function isApiKeyScope(scope: Scope | ApiKeyScope): scope is ApiKeyScope {
	// estamos utilizando o operador de conversão de tipo
    // para verificação de tipo em tempo de execução
    
	return ALL_API_KEY_SCOPES.has(scope as ApiKeyScope);
}

// #endregion