# Arquitetura

> Documento atualizado a mão para refletir o estado do código em 2026-09-11 (segurança do Electron, code-split de rotas, `ToolLayout`/`ToolPanel`).
> O que não pôde ser determinado pelo código está marcado como **Não identificado**.

## Visão geral

**DevUtils** é uma aplicação **desktop** construída com **Electron**. É composta por:

- **Processo principal (main process)** — `app/main.cjs`, roda em Node.js, cria a janela e carrega o conteúdo.
- **Preload** — `app/preload.cjs`, script mínimo executado antes do renderer.
- **Renderer (interface)** — SPA em **React 19 + TypeScript**, empacotada por **Vite**, código em `app/src/`.

Todo o processamento das ferramentas acontece **localmente no renderer** (no navegador Chromium embutido). Não há servidor, backend, chamadas de rede de negócio, nem persistência.

```
┌─────────────────────────────────────────────────────────────┐
│ Electron (app/main.cjs)                                      │
│  - app.whenReady() → createWindow()                          │
│  - BrowserWindow 1000x700 (min 800x600), autoHideMenuBar     │
│  - webPreferences: nodeIntegration:false, contextIsolation:true,│
│    sandbox:true                                               │
│  - CSP via <meta> em index.html (default-src 'self', etc.)    │
│  - setWindowOpenHandler → shell.openExternal (links externos) │
│                                                             │
│  dev  → loadURL('http://localhost:1234')                     │
│  prod → loadFile('dist/index.html')                          │
│                                                             │
│   ┌───────────────────────────────────────────────────────┐ │
│   │ Renderer — React SPA (app/src)                         │ │
│   │  main.tsx → <StrictMode><App/></StrictMode>            │ │
│   │  App.tsx → <HashRouter>                                │ │
│   │     ├── <Sidebar/>  (nav fixa, itera TOOLS de tools.ts)│ │
│   │     ├── <CommandPalette/>  (Ctrl/Cmd+K, busca fuzzy)   │ │
│   │     └── <Routes>  15 rotas → 1 componente-ferramenta   │ │
│   │         (cada componente é React.lazy, dentro de       │ │
│   │          <Suspense>, dentro do <ErrorBoundary>)         │ │
│   │                                                       │ │
│   │  Estado: useState/useEffect/useMemo por componente     │ │
│   │  Hook compartilhado: useClipboardData                  │ │
│   │  APIs de browser: navigator.clipboard, window.crypto   │ │
│   └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Processo principal (`app/main.cjs`)

- Detecta ambiente por `process.env.NODE_ENV === 'development'`.
- Cria uma única `BrowserWindow` (1000×700, mínimo 800×600), com `autoHideMenuBar: true` e `backgroundColor: '#0f172a'`.
- `webPreferences`:
  - `preload: app/preload.cjs`
  - `nodeIntegration: false`
  - `contextIsolation: true`
  - `sandbox: true`
- `index.html` define uma `Content-Security-Policy` restritiva via `<meta http-equiv>` (`default-src 'self'`, `object-src 'none'`, `form-action 'none'`; `style-src` inclui `'unsafe-inline'` por causa do uso extensivo de `style={{}}` inline nas tools; `connect-src` libera `localhost:1234` — http/ws — só para o HMR do Vite em dev).
- `setWindowOpenHandler`: qualquer `window.open` / link externo é aberto no navegador do sistema via `shell.openExternal` e negado dentro da janela.
- Ciclo de vida:
  - `activate` (macOS) recria a janela se não houver nenhuma.
  - `window-all-closed` encerra o app exceto em `darwin`.
- **Não há** `ipcMain`, menu customizado, tray, auto-updater ou handlers de IPC.

## Preload (`app/preload.cjs`)

Script mínimo — hoje é só um comentário. Com `contextIsolation: true` + `sandbox: true`, não expõe nenhuma API ao renderer via `contextBridge` (o app não usa IPC — ver seção 3 do `CLAUDE.md`). Antes rodava com `nodeIntegration: true`/`contextIsolation: false` e tentava preencher elementos com id `chrome-version`/`node-version`/`electron-version` a partir de `process.versions`; esses elementos nunca existiram no `index.html`, então esse código era efetivamente morto e foi removido junto do endurecimento de segurança (ver `docs/decisions.md` D3).

## Renderer

### Bootstrap

- `app/index.html` → `<div id="root">` + `app/src/main.tsx`.
- `main.tsx` monta `<App/>` dentro de `<StrictMode>` com `createRoot`.

### Roteamento

- `App.tsx` usa **`HashRouter`** do `react-router-dom` v7.
- Uso de hash routing é coerente com o carregamento via `file://` em produção (`loadFile`), onde history routing quebraria.
- 15 rotas mapeando 1:1 para um componente-ferramenta (ver `docs/api.md` e `docs/modules.md`).
- A rota `/` renderiza `JsonFormatterTool` (ferramenta padrão).
- Cada componente-ferramenta é importado com `React.lazy(() => import(...))` e as `<Routes>` ficam dentro de um `<Suspense fallback={<RouteFallback />}>` (fallback simples "Carregando...", inline). Resultado: o bundle deixou de ser um chunk único de ~835 KB — cada tool (e as libs pesadas usadas só por uma tool, como `sql-formatter` e `cronstrue`) vira um chunk próprio, carregado sob demanda ao abrir a rota.
- **Não há** rota 404 / fallback de navegação (só o fallback de carregamento do `Suspense`).
- `<CommandPalette/>` (irmão de `<Sidebar/>`, dentro do `HashRouter`) abre com `Ctrl`/`Cmd`+`K` e navega via `useNavigate`.
- As rotas ficam dentro de um `<ErrorBoundary>` (wrapper `ToolRoutes` em `App.tsx`), que também envolve o `<Suspense>`: um erro de render numa ferramenta (ou falha ao carregar o chunk lazy) mostra uma tela de recuperação em vez de derrubar o app. O boundary reseta ao trocar de rota (`resetKey={location.pathname}`).

### Layout

- `Sidebar` (largura fixa 260px) + `main-content` flexível.
- `Sidebar` itera o array `TOOLS` de `app/src/tools.ts` (id, name, icon `lucide-react`, path — ordenado alfabeticamente por `name`) com `<NavLink>`. O mesmo array alimenta a `CommandPalette`.
- Cada ferramenta segue o padrão visual: `.tool-header` (título + descrição) + `.tool-body` (conteúdo), hoje encapsulado no componente compartilhado `<ToolLayout title description>` (`src/components/ToolLayout.tsx`). Onde o padrão de painel duplo input/output se repete (JSON, Base64, Backslash, SQL, JWT), as tools também usam `<ToolPanel label actions?>` (`src/components/ToolPanel.tsx`) — um `glass-panel` com label e botões de ação opcionais.

### Estado e fluxo de dados

- **Sem store global** (sem Redux/Zustand/Context de estado). Cada componente gerencia o próprio estado com `useState` / `useEffect` / `useMemo`.
- Padrão dominante: input controlado → recálculo derivado (em `useEffect` ou `useMemo`) → output read-only.
- Código compartilhado de comportamento: `app/src/hooks/useClipboardData.ts` — `useClipboardData(onData)` retorna uma função `paste()` que só lê `navigator.clipboard.readText()` quando chamada (botão "Colar da área de transferência" em cada ferramenta); nunca lê sozinho no mount. `app/src/hooks/useCopy.ts` cobre o lado de escrita (feedback "Copiado!").
- Lógica não-trivial e sem dependência de React (tokenização, parsing, heurísticas) vive em `app/src/lib/` como funções puras, importadas pelo componente-ferramenta correspondente — só para o que precisa de teste de unidade (ver `docs/modules.md` e `docs/testing.md`). O padrão default continua lógica inline no componente.
- **Sem IPC**: o renderer não se comunica com o processo main em runtime.

### Estilização

- CSS único global: `app/src/index.css` (208 linhas).
- Sem Tailwind, CSS Modules ou CSS-in-JS de biblioteca. Usa:
  - Variáveis CSS (`--app-bg`, `--accent-color`, `--text-primary`, `--error-color`, etc.) — tema dark fixo.
  - Classes utilitárias artesanais (`.flex`, `.flex-col`, `.flex-1`, `.glass-panel`, `.tool-header`, `.tool-body`, …).
  - Estilos inline (`style={{…}}`) para ajustes pontuais em quase todos os componentes.
- Fonte `Inter` empacotada via `@fontsource/inter` (importada em `src/main.tsx`, subset `latin` 400–700). O app não faz nenhuma requisição de rede externa (ver `docs/integrations.md`).

## Build / empacotamento

`app/package.json` scripts:

| Script | Comando | Função |
|---|---|---|
| `dev` | `concurrently -k "vite" "npm run electron:dev"` | Sobe Vite + Electron juntos |
| `electron:dev` | `wait-on tcp:1234 && cross-env NODE_ENV=development electron .` | Espera o dev server e abre o Electron |
| `build` | `tsc -b && vite build` | Type-check + bundle do renderer para `dist/` |
| `dist` | `npm run build && electron-builder -l` | Build + empacota AppImage em `release/` |
| `lint` | `eslint .` | Lint |
| `test` | `vitest run` | Testes de unidade (`app/src/lib/*.test.ts`) — ver `docs/testing.md` |
| `preview` | `vite preview` | Preview do bundle Vite |

- `main` do `package.json` = `main.cjs`.
- `vite.config.ts`: `base: './'` (assets sob `file://`) e `server.port: 1234` (casa com o fluxo dev).
- `electron-builder -l` empacota para **Linux** (target `AppImage`). Config no bloco `build` do `package.json` (`appId`, `productName`, `directories.output: release`, `files` sem `node_modules`, ícone `app/build/icon.png`). Ver `docs/infrastructure.md`.

## Estrutura de diretórios

```
devutils/
├── package-lock.json          # stub vazio ("packages": {}) — raiz não tem package.json
├── README.md                  # template padrão Vite (não descreve o projeto)
├── docs/
│   ├── superpowers/            # specs e planos de features (pré-existentes)
│   │   ├── specs/2026-06-09-jwt-generator-design.md
│   │   ├── specs/2026-07-14-sql-query-formatter-design.md
│   │   └── plans/2026-07-14-sql-query-formatter.md
│   └── *.md                    # esta documentação
└── app/                        # a aplicação de fato
    ├── main.cjs                # processo principal Electron
    ├── preload.cjs
    ├── index.html
    ├── vite.config.ts
    ├── vitest.config.ts        # config do Vitest (plugin React, ambiente node)
    ├── tsconfig*.json
    ├── eslint.config.js
    ├── package.json            # inclui o bloco "build" do electron-builder
    ├── build/                  # icon.png (512x512) + icon.svg — recursos do electron-builder
    ├── public/                 # favicon.svg, icons.svg
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── tools.ts            # array TOOLS + interface Tool (Sidebar + CommandPalette)
        ├── assets/             # hero.png, vite.svg (não referenciados no código)
        ├── hooks/
        │   ├── useClipboardData.ts
        │   └── useCopy.ts
        ├── lib/                 # funções puras testáveis (sem React), cada uma com *.test.ts ao lado
        │   ├── caseConverter.ts
        │   ├── backslashEscape.ts
        │   ├── jwt.ts
        │   ├── unixTime.ts
        │   └── regexTester.ts
        └── components/
            ├── Sidebar.tsx
            ├── CommandPalette.tsx
            ├── ErrorBoundary.tsx
            ├── ToolLayout.tsx   # shell `.main-content` + `.tool-header`, usado pelas 15 tools
            ├── ToolPanel.tsx    # painel glass-panel com label + ações, usado onde há par input/output
            └── *Tool.tsx        # 15 componentes-ferramenta
```

## Padrões arquiteturais utilizados

- **Electron main/renderer** com renderer web puro (sem framework de integração tipo electron-vite plugin).
- **SPA client-side** com roteamento por hash.
- **Component-per-feature**: cada utilitário é um componente React autocontido em `src/components/`, registrado em dois lugares (`App.tsx` rota + `src/tools.ts` item, que alimenta `Sidebar` e `CommandPalette`).
- **Lógica inline no componente** — sem camada de serviços/domínio; bibliotecas prontas (`crypto-js`, `cronstrue`, `sql-formatter`, `diff`, `qrcode.react`) fazem o trabalho pesado. Exceção pontual: as poucas funções puras cobertas por teste de unidade vivem em `src/lib/` (ver item acima e `docs/testing.md`), não uma camada de domínio de verdade.
- **Derivação de estado** via `useEffect`/`useMemo` a cada mudança de input (formatação "ao vivo", sem botão "processar" na maioria das ferramentas).
- **Shell de ferramenta compartilhado**: `ToolLayout`/`ToolPanel` (`src/components/`) extraem a estrutura visual repetida (cabeçalho, painel input/output) sem introduzir CSS novo — reusam as classes já existentes em `index.css`.
- **Code-split por rota**: cada componente-ferramenta é `React.lazy`, então o bundle principal só carrega a tool ativa (ver seção Roteamento).

## O que não se aplica / não foi identificado

- **Camadas de aplicação (controllers/services/repositories)**: não existem — não há backend.
- **Microserviços / múltiplos projetos**: apenas um app (`app/`).
- **Injeção de dependência / IoC**: Não identificado (não usado).
- **Padrão de configuração por ambiente** além de `NODE_ENV`: Não identificado.
