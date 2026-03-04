# configuração do claude code

este diretório contém as configurações compartilhadas do claude code para o cernos

## setup

### servidor mcp linear

o servidor mcp linear utilizar a autenticação oauth. para conectar:

1. inicie o claude code nesse repositório
2. rode o comando `/mcp`
3. clique no link de autenticação linear no seu navegador
4. autorize com a sua conta do linear

você apenas precisa fazer isso uma vez por máquina

### permissões

configure as permissões da ferramenta nas suas configurações globais do claude code (`~/.claude/settings.json`), e não neste repositório. isso permite que cada desenvolvedor personalize suas próprias preferências de aprovação

para auto-aprovar as ferramentas de mcp linear, adicione as suas próprias configurações:

```json
{
    "permissions": {
        "allow": [
            "mcp__linear-server__*"
        ]
    }
}
```

**nota**: para operações github/git, utilizamos o cli `gh` e comandos `git` em vez do github mcp

## comandos disponíveis

- `/cernos-triage pay-xxx` - analisa e prioriza um problema linear
- `/cernos-plan pay-xxx` - cria o plano de implementação

## rápida referência

- `/cernos-conventions` - carrega os guias de convenções detalhadas (opcional - os agentes já sabem dos padrões do cernos)

## workflow

### abordagem recomendada

1. `/cernos-triage pay-123` → investiga a causa do root e sua gravidade (opcional)
2. `/cernos-plan pay-123` → cria um plano de implementação detalhado
3. reveja o plano no chat
4. diga "implemente isso" ou "vá em frente" → irá lançar o agente `cernos-developer`
5. implementação procede com contexto completo para o plano

## agentes

- **cernos-developer** - desenvolvimento cernos full-stack (frontend/backend/nodes)
- **cernos-linear-issue-triager** - investigação e análise de erros

## habilidades

- **cernos-conventions** - rápida referência apontando para `/AGENTS.md` (opcional - os agentes já possui conhecimento embutido)
    - use `/cernos-conventions` quando precisar de padrões detalhados
    - referências para docs do root em vez de duplicar (~95 linhas)
