# CLAUDE.md

## 1. Contexto essencial

**DevUtils** é um aplicativo **desktop (Electron)** com uma coleção de utilitários offline para desenvolvedores (formatador de JSON/SQL, Base64, JWT, hash, RSA, UUID, senha, cron, regex, diff, conversor de case, etc.).

- Todo o processamento é **local**, no renderer. Não há backend, banco de dados, API de rede, autenticação, filas ou persistência.
- O código-fonte da aplicação fica em **`app/`** (a raiz do repositório não tem `package.json`). **Rode todos os comandos npm dentro de `app/`.**
- **Node `^24` é obrigatório** (`app/.node-version`, `engines.node` em `app/package.json`) — Node 26 quebra silenciosamente a extração do binário do Electron no `npm install` (ver `docs/infrastructure.md` e `docs/decisions.md` D18).
- Idioma: a UI mistura PT-BR e inglês; **novas strings de UI devem ser em PT-BR**.

## 2. Stack

| Camada | Tecnologia |
|---|---|
| Shell desktop | Electron `^41` (`app/main.cjs`, `app/preload.cjs`) |
| UI | React `19` + TypeScript `~5.9`, `react-router-dom` `7` (`HashRouter`) |
| Build | Vite `^8` + `@vitejs/plugin-react` (`npm run build` = `tsc -b && vite build`); empacotamento `electron-builder -l` via `npm run dist` |
| Ícones | `lucide-react` |
| Libs de domínio | `crypto-js` (hash/HMAC), `cronstrue` (cron), `sql-formatter` (SQL), `diff` (texto), `qrcode.react` (QR) |
| Estilo | `app/src/index.css` único: CSS vars (tema dark fixo) + classes utilitárias próprias. **Sem Tailwind.** Fonte Inter via `@fontsource/inter` (empacotada, offline) — importada em `src/main.tsx`. |
| Testes | `vitest` (`npm test`) só para funções puras sem React, extraídas em `app/src/lib/` — cobertura pontual, não geral. Fora isso, `npm run lint` + verificação manual (`npm run dev`). |

## 3. Arquitetura resumida

```
Electron main (app/main.cjs)  ──cria──►  BrowserWindow única
   dev  → http://localhost:1234 (Vite)
   prod → app/dist/index.html (loadFile)
        │
        └─► Renderer: React SPA (app/src)
              main.tsx → App.tsx (<HashRouter>)
                 ├── <Sidebar/>         — nav a partir do array TOOLS[] (app/src/tools.ts)
                 ├── <CommandPalette/>  — busca fuzzy (Ctrl/Cmd+K), mesmo array TOOLS[]
                 └── <Routes>           — 1 rota → 1 componente-ferramenta (app/src/components/*Tool.tsx),
                                           envolvidas por <ErrorBoundary resetKey={rota}>
```

- **Sem IPC** entre main e renderer. **Sem estado global** — cada ferramenta usa `useState`/`useEffect`/`useMemo`.
- Código compartilhado de comportamento (`app/src/hooks/`): `useClipboardData.ts` (retorna um `paste()` chamado pelo botão "Colar da área de transferência" — nunca lê o clipboard sozinho) e `useCopy.ts` (feedback "Copiado!" nos botões de copiar).
- Padrão de ferramenta: input controlado → cálculo derivado ao vivo → output read-only, dentro de `.tool-header` + `.tool-body`.

## 4. Regras importantes

- **Não** adicionar backend, chamadas de rede, banco ou persistência. O app é offline por design (privacidade: dados do usuário nunca saem da máquina).
- **Não** introduzir Tailwind, CSS-in-JS ou biblioteca de estado global.
- Preferir **biblioteca pronta** a implementar lógica complexa de parsing/formatação (padrão do projeto).
- `webPreferences` do Electron usa `contextIsolation: false` / `nodeIntegration: true` (decisão de MVP — ver `docs/decisions.md`). Não depender disso para expor APIs novas sem antes revisar segurança.
- Produção roda sob `file://` → manter `HashRouter` (não trocar por `BrowserRouter`).
- Ao mexer em erros de libs, truncar mensagens ruidosas (ex.: SQL Formatter mostra só a 1ª linha do erro).

## 5. Convenções de desenvolvimento

- **Adicionar uma ferramenta nova** (3 pontos):
  1. Criar `app/src/components/NomeTool.tsx` com **export nomeado** (`export function NomeTool()`), sem props.
  2. Registrar a rota em `app/src/App.tsx` (`<Route path="/x" element={<NomeTool />} />`).
  3. Adicionar item no array `TOOLS[]` de `app/src/tools.ts` (`id`, `name` em PT-BR, `icon` do `lucide-react`, `path`) — fonte única consumida por `Sidebar` e `CommandPalette`.
- Estilo: usar CSS vars (`var(--text-primary)`, `var(--accent-color)`, `var(--error-color)`, `var(--border-color)`, `var(--app-bg)`…), classes utilitárias existentes (`flex`, `flex-col`, `flex-1`, `glass-panel`, `secondary`) e `style={{}}` inline para ajustes. Sem CSS novo global salvo necessidade real.
- Lógica **inline no componente** — não criar hooks/abstrações novas sem motivo. Exceção já estabelecida: funções puras sem React que precisam de teste de unidade vivem em `app/src/lib/` (ver `docs/decisions.md` D22) — não vire regra geral, só para o que já tem `*.test.ts`.
- Cálculo derivado em `useMemo` (preferir sobre `useEffect` + estado espelho — o `eslint-plugin-react-hooks` v7 barra `setState` dentro de efeito/render); try/catch em volta de parsers, erro em `var(--error-color)` sem apagar o input.
- `useClipboardData(onData)`: retorna uma função `paste()` para ligar num botão explícito ("Colar da área de transferência") — não ler o clipboard automaticamente no mount de uma ferramenta.
- Commits: mensagens curtas em PT-BR, prefixo `feat:` / `fix:` / `docs:` (padrão observável no histórico recente).
- Verificação antes de commitar: `cd app && npm run lint && npm test && npm run build` (lint + Vitest + `tsc -b` + `vite build`, todos verdes) e teste manual com `cd app && npm run dev`. Se `node -v` não mostrar `24.x` (ex.: `mise` resolvendo a versão global), prefixar com `mise exec node@24 --` — Node 26 quebra a extração do binário do Electron no `npm install` (ver `docs/infrastructure.md`, D18).
- ⚠️ `tsc -b` roda com `noUnusedLocals`/`noUnusedParameters`: nada de imports/vars/params não usados (ex.: `import React` sem uso quebra o build). `catch (e)` sem uso → usar `catch {}`.

## 6. Documentação

Documentação detalhada em **`/docs`**:

| Arquivo | Conteúdo |
|---|---|
| [`docs/architecture.md`](docs/architecture.md) | Processos Electron, renderer, roteamento, build, estrutura de pastas |
| [`docs/modules.md`](docs/modules.md) | Núcleo do renderer + tabela dos 18 componentes-ferramenta |
| [`docs/database.md`](docs/database.md) | (Não aplicável — sem banco / sem persistência) |
| [`docs/api.md`](docs/api.md) | Rotas do renderer + APIs de plataforma (Web/Electron). Sem API HTTP. |
| [`docs/business-rules.md`](docs/business-rules.md) | Regras e heurísticas de cada ferramenta |
| [`docs/integrations.md`](docs/integrations.md) | Integrações externas (nenhuma — app 100% offline, fonte Inter empacotada localmente) |
| [`docs/infrastructure.md`](docs/infrastructure.md) | Build/empacotamento, scripts, versão de Node exigida, ausência de Docker/CI |
| [`docs/testing.md`](docs/testing.md) | Estratégia de verificação (lint + manual) |
| [`docs/dependencies.md`](docs/dependencies.md) | Todas as dependências e para que servem |
| [`docs/decisions.md`](docs/decisions.md) | Decisões de arquitetura e divergências código × specs |
| [`docs/roadmap.md`](docs/roadmap.md) | Backlog priorizado: melhorias de UX/infra, ferramentas novas, dívida técnica conhecida |

Specs/planos de features pré-existentes: `docs/superpowers/`.
