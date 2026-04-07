# agents.md

informação extra, especificar para o codebase do frontend.

### regras de review de estilo

para mudanças de estilos css/scss/vue e updates tocando `@cernos/design-system`, seguir `.agents/design-system-style-rules.md`.

### referência de variáveis css

utilize as seguintes variáveis css para manter consistência entre o aplicativo. essas variáveis cobrem cores, espaçamento, tipografia, e bordas.

#### cores

```css
/* cores primárias */
--color--primary--shade-1
--color--primary
--color--primary--tint-1
--color--primary--tint-2
--color--primary--tint-3

/* cores secundárias */
--color--secondary--shade-1
--color--secondary
--color--secondary--tint-1
--color--secondary--tint-2

/* cores de sucesso */
--color--success--shade-1
--color--success
--color--success--tint-1
--color--success--tint-2
--color--success--tint-3
--color--success--tint-4

/* cores de aviso */
--color--warning--shade-1
--color--warning
--color--warning--tint-1
--color--warning--tint-2

/* cores de perigo */
--color--danger--shade-1
--color--danger
--color--danger--tint-3
--color--danger--tint-4

/* cores de texto */
--color--danger--shade-1
--color--danger
--color--danger--tint-1
--color--danger--tint-2
--color--danger--tint-3
--color--text-danger

/* cores de foreground */
--color--foreground--shade-2
--color--foreground--shade-1
--color--foreground
--color--foreground--tint-1
--color--foreground--tint-2

/* cores de background */
--color--background--shade-2
--color--background--shade-1
--color--background
--color--background--light-2
--color--background--light-3
```

#### espaçamento

```css
--spacing--5xs: 2px
--spacing--4xs: 4px
--spacing--3xs: 6px
--spacing--2xs: 8px
--spacing--xs: 12px
--spacing--sm: 16px
--spacing--md: 20px
--spacing--lg: 24px
--spacing--xl: 32px
--spacing--2xl: 48px
--spacing--3xl: 64px
--spacing--4xl: 128px
--spacing--5xl: 256px
```

#### tipografia

```css
--font-size--3xs: 10px
--font-size--2xs: 12px
--font-size--xs: 13px
--font-size--sm: 14px
--font-size--md: 16px
--font-size--lg: 18px
--font-size--xl: 20px
--font-size--2xl: 28px

--line-height--sm: 1.25
--line-height--md: 1.3
--line-height--lg: 1.35
--line-height--xl: 1.5

--font-weight--regular: 400
--font-weight--bold: 600
--font-family: InterVariable, sans-serif
```

#### bordas

```css
--radius--sm: 2px
--radius: 4px
--radius--lg: 8px
--radius--xl: 12px

--border-width: 1px
--border-style: solid
--border: var(--border-width) var(--border-style) var(--color--foreground)
```

### ícones (cernosicon)

nomes de ícones disponíveis em `packages/frontend/@cernos/design-system/src/components/cernosicon/icons.ts`. utilize chaves de `updatediconset` apenas - entradas `deprecatediconset` não devem ser utilizadas em código novo.

### timing de debounce

utilize constantes centralizadas de `@/app/constants/durations` em vez de hardcoding:

```typescript
import { debounce_time, getdebouncetime } from '@/app/constants';

usedebouncefn(() => { ... }, getdebouncetime(debounce_time.input.search));
```

categorias: `ui`, `input`, `api`, `telemetry`, `collaboration`, `connection`.
