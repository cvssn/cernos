import { z } from 'zod';

import { ALL_SCOPES } from './scope-information';

export const roleNamespaceSchema = z.enum([
    'global',
    'project',
    'credential',
    'workflow',
    'secretsProviderConnection'
]);

export const globalRoleSchema = z.enum([
    'global:owner',
    'global:admin',
    'global:member',
    'global:chatUser'
]);

const customGlobalRoleSchema = z
    .string()
    .nonempty()
    .refine((val) => !globalRoleSchema.safeParse(val).success, {
        message: 'este valor de função global não pode ser atribuído.'
    });

export const assignableGlobalRoleSchema = z.union([
    globalRoleSchema.exclude([
        'global:owner' // o owner não pode ser alterado
    ]),

    customGlobalRoleSchema
]);

export const personalRoleSchema = z.enum([
    'project:personalOwner' // personalowner é apenas utilizado para projetos pessoais
]);

// esses são os cargos de sistema para projetos que podem ser
// atribuídos a um usuário
export const teamRoleSchema = z.enum([
    'project:admin',
	'project:editor',
	'project:viewer',
	'project:chatUser'
]);

// cargo de projeto customizado pode ser qualquer coisa a
// não ser cargos de sistema
export const customProjectRoleSchema = z
    .string()
    .nonempty()
    .refine((val) => !systemProjectRoleSchema.safeParse(val).success, {
        message: 'este valor de função global não pode ser atribuído.'
    });

// esses são todos os cargos de sistema para os projetos
export const systemProjectRoleSchema = z.union([personalRoleSchema, teamRoleSchema]);

// esses são os cargos que podem ser atribuídos a um usuário
// em um projeto (todos os cargos, exceto personalowner)
export const assignableProjectRoleSchema = z.union([teamRoleSchema, customProjectRoleSchema]);
export const projectRoleSchema = z.union([systemProjectRoleSchema, customProjectRoleSchema]);

export const credentialSharingRoleSchema = z.enum(['credential:owner', 'credential:user']);
export const workflowSharingRoleSchema = z.enum(['workflow:owner', 'workflow:editor']);

export const secretsProviderConnectionSharingRoleSchema = z.enum([
	'secretsProviderConnection:owner',
	'secretsProviderConnection:user'
]);

const ALL_SCOPES_LOOKUP_SET = new Set(ALL_SCOPES as string[]);

export const scopeSchema = z.string().refine((val) => ALL_SCOPES_LOOKUP_SET.has(val), {
	message: 'Invalid scope'
});

export const roleSchema = z.object({
	slug: z.string().min(1),
	displayName: z.string().min(1),
	description: z.string().nullable(),
	systemRole: z.boolean(),
	roleType: roleNamespaceSchema,
	licensed: z.boolean(),
	scopes: z.array(scopeSchema),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
	usedByUsers: z.number().optional(),
	usedByProjects: z.number().optional()
});

export type Role = z.infer<typeof roleSchema>;