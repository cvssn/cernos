# agents.md

este arquivo fornece orientações sobre como trabalhar com o repositório cernos

## overview do projeto

cernos é uma plataforma de automação de fluxos de trabalho escrita em typescript, utilizando uma estrutura de monorepo gerenciada por workspaces do pnpm. consiste em um backend em node.js, um frontend em vue.js e um mecanismo de fluxo de trabalho extensível baseado em node.js

## guidelines gerais

- sempre use o pnpm
- utiliza-se linear como sistema de rastreamento de ingressos
- utiliza-se posthog para sinalizadores de recursos
- ao começar a trabalhar em um novo ticket - crie uma nova branch a partir da branch master com o nome especificado no ticket linear
- ao criar uma nova branch para um ticket em linear - use o nome da branch sugerido pelo linear
- use diagramas mermaid em arquivos md quando precisar visualizar algo

## comandos essenciais

### building

use `pnpm build` para construir todos os pacotes. sempre redirecione o output do comando build para um arquivo:

```bash
pnpm build > build.log 2>&1
```

você pode inspecionar as últimas linhas do arquivo log da build para checar erros:

```bash
tail -n 20 build.log
```

### testing

- `pnpm test` - roda todos os testes
- `pnpm test:affected` - roda os testes baseado no que foi alterado desde o último commit

para executar um determinado arquivo de teste, é necessário acessar o diretório desse teste e executar o seguinte comando: `pnpm test <arquivo-teste>`

ao mudar de diretório, use `pushd` para navegar até o diretório desejado e `popd` para retornar ao diretório anterior. em caso de dúvida, use `pwd` para verificar o diretório atual

### qualidade de código

- `pnpm lint` - verifica o código
- `pnpm typecheck` - roda checks de escrita

sempre execute o lint e o typecheck antes de enviar o código para garantir a qualidade. execute esses comandos dentro do diretório do pacote específico em que você está trabalhando (por exemplo, `cd packages/cli && pnpm lint`). execute a verificação completa do repositório somente ao preparar o pr final. quando suas alterações afetarem definições de tipo, interfaces em `@cernos/api-types` ou dependências entre pacotes, compile o sistema antes de executar o lint e o typecheck

## overview de arquitetura

**estrutura de monorepo**: workspaces pnpm com orquestração de build turbo

### estrutura de pacote

- **`packages/@cernos/api-types`**: interfaces typescript compartilhadas entre frontend e backend
- **`packages/workflow`**: interfaces e types de workflow core
- **`packages/core`**: engine de execução de workflow
- **`packages/cli`**: servidor express, rest api e comandos cli
- **`packages/editor-ui`**: aplicativo frontend vue 3
- **`packages/@cernos/i18n`**: intercionalização para texto da ui
- **`packages/nodes-base`**: nodes nativos para integrações
- **`packages/@cernos/nodes-langchain`**: nodes de ai/langchain
- **`@cernos/design-system`**: biblioteca de componentes vue para consistência da ui
- **`@cernos/config`**: gerenciamento de configuração centralizada

### stack de tecnologia

- **frontend**: vue 3 + typescript + vite + pinia + storybook ui library
- **backend**: node.js + typescript + express + typeorm
- **testing**: jest (unidade) + playwright (e2e)
- **banco de dados**: typeorm com suporte sqlite/postgresql
- **qualidade de código**: biome (para formatação) + eslint + lefthook git hooks

### padrões arquitetônicos principais

1. **injeção de dependência**: utiliza `@cernos/di` para container ioc
2. **repositório de serviços do controlador**: backend segue o padrão mvc
3. **orientado a eventos**: barramento de eventos internos para comunicação desacoplada
4. **execução baseada em contexto**: contextos diferentes para diferentes tipos de nodes
5. **gerenciamento de estado**: frontend utiliza pinia
6. **sistema de design**: compontentes reutilizáveis e tokens de design são centralizados em `@cernos/design-system`, onde todos os componentes vue puros devem estar armazenados para manter consistência e reutilização

### padrões de desenvolvimento principais

- cada pacote possui configuração de compilação isolada e pode ser desenvolvido independentemente
- o hot reload funciona em toda a pilha durante o desenvolvimento
- o desenvolvimento em node utiliza a ferramenta cli dedicada `node-dev`
- os testes de workflows são baseados em json para testes de integração
- os recursos de ia possuem um workflow de desenvolvimento dedicado (`pnpm dev:ai`)

### utilitários de percurso de workflow

o pacote `cernos-workflow` exporta utilitários de percurso em gráficos a partir de `packages/workflow/src/common/`. use-os em vez de lógica de percurso personalizada

**conceito-chave**: `workflow.connections` é indexado pelo **node de origem**. para encontrar os nodes parent, utilize `mapconnectionsbydestination()` para inverter a ordem primeiro

```typescript
import { getParentNodes, getChildNodes, mapConnectionsByDestination } from 'n8n-workflow';

// encontrando parent nodes (antecessores) - requer conexões invertidas
const connectionsByDestination = mapConnectionsByDestination(workflow.connections);
const parents = getParentNodes(connectionsByDestination, 'NodeName', 'main', 1);

// encontrando child nodes (successores) - usa conexões diretamente
const children = getChildNodes(workflow.connections, 'NodeName', 'main', 1);
```

### melhores práticas de typescript

- **nunca use o tipo `any`** - use tipos apropriados ou então `unknown`
- **evite type casting com `as`** - use verificações de tipo ou predicados de tipo (exceto em código de teste, onde `as` é aceitável)
- **defina as interfaces compartilhadas no pacote `@cernos/api-types`** para comunicação fe/be

### lidando com erros

- não use a classe `applicationerror` no cli e nos nodes para jogar os erros, porque isso foi descontinuado. em vez disso, utilize `unexpectederror`, `operationalerror` ou `usererror`
- importe das classes de erro apropriadas em cada pacote

### desenvolvimento frontend

- **todo o texto da ui deve usar i18n** - adicione traduções no pacote `@cernos/i18n`
- **use as variáveis css diretamente** - nunca faça espaçamento hardcode como valores `px`
- **`data-testid` deve ser um valor único** (sem espaços ou múltiplos valores)

ao implementar o css, consulte `@packages/frontend/claude.md` para obter as diretrizes sobre variáveis css e convenções de estilo

### guidelines de testing

- **trabalhe sempre a partir do diretório do pacote** ao executar testes
- **simule todas as dependências externas** nos testes unitários
- **confirme os casos de teste com o usuário** antes de escrever os testes unitários
- **typecheck é crucial antes do committing** - execute sempre o comando `pnpm typecheck`
- **ao modificar os armazenamentos pinia**, verifique se há propriedades computadas não utilizadas

o que é utilizado para testar e escrever testes:

- para testar nodes e outros componentes do backend, se utiliza o jest para testes unitários. exemplos podem ser encontrados em `packages/nodes-base/nodes/**/*test*`
- se utiliza o `nock` para mocking de servidor
- se utiliza o `vitest` para o frontend
- para testes e2e, se utiliza o playwright. execute com `pnpm --filter=cernos-playwright test:local`. veja `packages/testing/playwright/README.md` para mais detalhes
- **para manutenção/limpeza de testes do playwright**, consulte `@packages/testing/playwright/AGENTS.md` (inclui ferramenta de limpeza para análise estática, remoção de código morto, aplicação de arquitetura e workflows tcr)

### tasks de desenvolvimento comuns

ao implementar recursos:

1. defina os tipos de api em `packages/@cernos/api-types`
2. implemente a lógica de backend no módulo `packages/cli`, seguindo as instruções em `@packages/cli/scripts/backend-module/backend-module-guide.md`
3. adicione endpoints de api por meio de controladores
4. atualize o frontend em `packages/editor-ui` com suporte a i18n
5. escreva os testes com os mocks adequados
6. rode `pnpm typecheck` para verificar as tipagens

### guidelines do github

- ao criar um pr, utilize as convenções em `.github/pull_request_template.md` e `.github/pull_request_title_conventions.md`
- use `gh pr create --draft` para criar drafts dos prs
- sempre faça as referências do ticket linear na descrição do pr, por exempo: `https://linear.app/cernos/issue/[id-ticket]`
- sempre conecte com a github issue caso mencionada no ticket linear
