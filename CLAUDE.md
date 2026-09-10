# CLAUDE.md

## 1. Contexto essencial

**DevUtils** é um aplicativo **desktop (Electron)** com uma coleção de utilitários offline para desenvolvedores (formatador de JSON/SQL, Base64, JWT, hash, RSA, UUID, senha, cron, regex, diff, conversor de case, etc.).

- Todo o processamento é **local**, no renderer. Não há backend, banco de dados, API de rede, autenticação, filas ou persistência.
- O código-fonte da aplicação fica em **`app/`** (a raiz do repositório não tem `package.json`). **Rode todos os comandos npm dentro de `app/`.**
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
| Testes | Nenhum. Só `npm run lint` + verificação manual (`npm run dev`). |

## 3. Arquitetura resumida

```
Electron main (app/main.cjs)  ──cria──►  BrowserWindow única
   dev  → http://localhost:1234 (Vite)
   prod → app/dist/index.html (loadFile)
        │
        └─► Renderer: React SPA (app/src)
              main.tsx → App.tsx (<HashRouter>)
                 ├── <Sidebar/>  — nav a partir do array TOOLS[]
                 └── <Routes>    — 1 rota → 1 componente-ferramenta (app/src/components/*Tool.tsx)
```

- **Sem IPC** entre main e renderer. **Sem estado global** — cada ferramenta usa `useState`/`useEffect`/`useMemo`.
- Único código compartilhado de comportamento: `app/src/hooks/useClipboardData.ts` (auto-preenche input a partir do clipboard).
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
  3. Adicionar item no array `TOOLS[]` de `app/src/components/Sidebar.tsx` (`id`, `name` em PT-BR, `icon` do `lucide-react`, `path`).
- Estilo: usar CSS vars (`var(--text-primary)`, `var(--accent-color)`, `var(--error-color)`, `var(--border-color)`, `var(--app-bg)`…), classes utilitárias existentes (`flex`, `flex-col`, `flex-1`, `glass-panel`, `secondary`) e `style={{}}` inline para ajustes. Sem CSS novo global salvo necessidade real.
- Lógica **inline no componente** — não criar hooks/abstrações novas sem motivo.
- Cálculo derivado em `useMemo` (preferir sobre `useEffect` + estado espelho — o `eslint-plugin-react-hooks` v7 barra `setState` dentro de efeito/render); try/catch em volta de parsers, erro em `var(--error-color)` sem apagar o input.
- `useClipboardData(onData, enabled?)`: recebe callback; o `setState` do auto-preenchimento roda no callback (fora de efeito), com guarda de "só se o input estiver vazio".
- Commits: mensagens curtas em PT-BR, prefixo `feat:` / `fix:` / `docs:` (padrão observável no histórico recente).
- Verificação antes de commitar: `cd app && npm run lint && npm run build` (lint + `tsc -b` + `vite build`, todos verdes) e teste manual com `cd app && npm run dev`.
- ⚠️ `tsc -b` roda com `noUnusedLocals`/`noUnusedParameters`: nada de imports/vars/params não usados (ex.: `import React` sem uso quebra o build). `catch (e)` sem uso → usar `catch {}`.

## 6. Documentação

Documentação detalhada em **`/docs`**:

| Arquivo | Conteúdo |
|---|---|
| [`docs/architecture.md`](docs/architecture.md) | Processos Electron, renderer, roteamento, build, estrutura de pastas |
| [`docs/modules.md`](docs/modules.md) | Núcleo do renderer + tabela dos 15 componentes-ferramenta |
| [`docs/database.md`](docs/database.md) | (Não aplicável — sem banco / sem persistência) |
| [`docs/api.md`](docs/api.md) | Rotas do renderer + APIs de plataforma (Web/Electron). Sem API HTTP. |
| [`docs/business-rules.md`](docs/business-rules.md) | Regras e heurísticas de cada ferramenta |
| [`docs/integrations.md`](docs/integrations.md) | Integrações externas (praticamente nenhuma; só Google Fonts) |
| [`docs/infrastructure.md`](docs/infrastructure.md) | Build/empacotamento, scripts, inconsistência de porta dev, ausência de Docker/CI |
| [`docs/testing.md`](docs/testing.md) | Estratégia de verificação (lint + manual); `test-forge.js` |
| [`docs/dependencies.md`](docs/dependencies.md) | Todas as dependências e para que servem |
| [`docs/decisions.md`](docs/decisions.md) | Decisões de arquitetura e divergências código × specs |

Specs/planos de features pré-existentes: `docs/superpowers/`.
