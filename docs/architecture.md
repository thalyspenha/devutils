# Arquitetura

> Documento baseado no código em `main` (último commit analisado: `874267f`).
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
│  - webPreferences: nodeIntegration:true, contextIsolation:false│
│  - setWindowOpenHandler → shell.openExternal (links externos) │
│                                                             │
│  dev  → loadURL('http://localhost:1234')                     │
│  prod → loadFile('dist/index.html')                          │
│                                                             │
│   ┌───────────────────────────────────────────────────────┐ │
│   │ Renderer — React SPA (app/src)                         │ │
│   │  main.tsx → <StrictMode><App/></StrictMode>            │ │
│   │  App.tsx → <HashRouter>                                │ │
│   │     ├── <Sidebar/>  (nav fixa, lista TOOLS[])          │ │
│   │     └── <Routes>  15 rotas → 1 componente-ferramenta   │ │
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
  - `nodeIntegration: true`
  - `contextIsolation: false` — comentado no código como *"For simpler MVP setup"*.
- `setWindowOpenHandler`: qualquer `window.open` / link externo é aberto no navegador do sistema via `shell.openExternal` e negado dentro da janela.
- Ciclo de vida:
  - `activate` (macOS) recria a janela se não houver nenhuma.
  - `window-all-closed` encerra o app exceto em `darwin`.
- **Não há** `ipcMain`, menu customizado, tray, auto-updater ou handlers de IPC.

## Preload (`app/preload.cjs`)

Script mínimo. No `DOMContentLoaded`, tenta preencher elementos com id `chrome-version` / `node-version` / `electron-version` a partir de `process.versions`. **Esses elementos não existem no `index.html` atual**, portanto o preload é efetivamente inócuo. Não usa `contextBridge`.

## Renderer

### Bootstrap

- `app/index.html` → `<div id="root">` + `app/src/main.tsx`.
- `main.tsx` monta `<App/>` dentro de `<StrictMode>` com `createRoot`.

### Roteamento

- `App.tsx` usa **`HashRouter`** do `react-router-dom` v7.
- Uso de hash routing é coerente com o carregamento via `file://` em produção (`loadFile`), onde history routing quebraria.
- 15 rotas mapeando 1:1 para um componente-ferramenta (ver `docs/api.md` e `docs/modules.md`).
- A rota `/` renderiza `JsonFormatterTool` (ferramenta padrão).
- **Não há** rota 404 / fallback, nem lazy loading (todos os componentes são importados estaticamente).

### Layout

- `Sidebar` (largura fixa 260px) + `main-content` flexível.
- `Sidebar` renderiza um array estático `TOOLS[]` (id, name, icon `lucide-react`, path) com `<NavLink>`.
- Cada ferramenta segue o padrão visual: `.tool-header` (título + descrição) + `.tool-body` (conteúdo).

### Estado e fluxo de dados

- **Sem store global** (sem Redux/Zustand/Context de estado). Cada componente gerencia o próprio estado com `useState` / `useEffect` / `useMemo`.
- Padrão dominante: input controlado → recálculo derivado (em `useEffect` ou `useMemo`) → output read-only.
- Único código compartilhado de comportamento: `app/src/hooks/useClipboardData.ts` — `useClipboardData(onData, enabled?)` lê `navigator.clipboard.readText()` uma vez após o mount (delay de 100ms) e chama `onData(texto)`; várias ferramentas usam para auto-preencher o input (só se estiver vazio). O `setState` acontece no callback, não em efeito.
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
    ├── tsconfig*.json
    ├── eslint.config.js
    ├── test-forge.js           # script manual ad-hoc (ver docs/testing.md)
    ├── package.json            # inclui o bloco "build" do electron-builder
    ├── build/                  # icon.png (512x512) + icon.svg — recursos do electron-builder
    ├── public/                 # favicon.svg, icons.svg
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── assets/             # hero.png, vite.svg (não referenciados no código)
        ├── hooks/
        │   └── useClipboardData.ts
        └── components/
            ├── Sidebar.tsx
            └── *Tool.tsx        # 15 componentes-ferramenta
```

## Padrões arquiteturais utilizados

- **Electron main/renderer** com renderer web puro (sem framework de integração tipo electron-vite plugin).
- **SPA client-side** com roteamento por hash.
- **Component-per-feature**: cada utilitário é um componente React autocontido em `src/components/`, registrado em dois lugares (`App.tsx` rota + `Sidebar.tsx` item).
- **Lógica inline no componente** — sem camada de serviços/domínio; bibliotecas prontas (`crypto-js`, `cronstrue`, `sql-formatter`, `diff`, `qrcode.react`) fazem o trabalho pesado.
- **Derivação de estado** via `useEffect`/`useMemo` a cada mudança de input (formatação "ao vivo", sem botão "processar" na maioria das ferramentas).

## O que não se aplica / não foi identificado

- **Camadas de aplicação (controllers/services/repositories)**: não existem — não há backend.
- **Microserviços / múltiplos projetos**: apenas um app (`app/`).
- **Injeção de dependência / IoC**: Não identificado (não usado).
- **Padrão de configuração por ambiente** além de `NODE_ENV`: Não identificado.
