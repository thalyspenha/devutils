# Decisões de arquitetura

> Registro das decisões observáveis no código. Quando o **motivo** não está documentado (commit, comentário, spec), isso é marcado como **Racional: Não identificado** — a decisão é fato, a justificativa é inferência.

## Documentos de design pré-existentes

O projeto mantém specs e planos em `docs/superpowers/`:

- `specs/2026-06-09-jwt-generator-design.md` — adição da aba "Gerar" ao JWT (HS256).
- `specs/2026-07-14-sql-query-formatter-design.md` — ferramenta de formatação de SQL.
- `plans/2026-07-14-sql-query-formatter.md` — plano de implementação passo a passo do SQL Formatter.

Esses documentos referenciam um `CLAUDE.md` e um "padrão de componente" do projeto.

---

## D1 — Aplicação desktop com Electron

- **Decisão:** distribuir como app desktop Electron, não como web app ou PWA.
- **Evidência:** `app/main.cjs`, `electron` + `electron-builder` nas deps, `main: main.cjs`.
- **Racional:** Não identificado explicitamente. Inferência: acesso a clipboard/crypto com UX de app nativo e distribuição de binário. O nome exibido "DevUtils Linux" e `electron-builder -l` sugerem alvo Linux desktop.

## D2 — Renderer React 19 + Vite, sem plugin de integração Electron

- **Decisão:** o renderer é um projeto Vite/React "comum"; a integração com Electron é feita à mão (dois `package.json`? não — um só, em `app/`; `main.cjs` na raiz de `app/`).
- **Evidência:** `vite.config.ts` mínimo (só `@vitejs/plugin-react`), sem `vite-plugin-electron` / `electron-vite`.
- **Racional:** Não identificado. Inferência: manter o setup simples ("MVP").

## D3 — `contextIsolation: false` + `nodeIntegration: true`

- **Decisão:** desabilitar o isolamento de contexto e habilitar Node no renderer.
- **Evidência:** `app/main.cjs`, com o comentário `// For simpler MVP setup`.
- **Racional:** simplicidade de MVP (declarado no comentário).
- **Trade-off:** é a configuração **menos segura** do Electron. Como o app não carrega conteúdo remoto (só `localhost` em dev e `file://` em prod) e não há entrada não confiável executada como código, o risco prático é baixo — mas é uma dívida de segurança conhecida. O `preload.cjs` não usa `contextBridge`.

## D4 — `HashRouter` em vez de `BrowserRouter`

- **Decisão:** roteamento por hash (`#/rota`).
- **Evidência:** `App.tsx`.
- **Racional:** Não identificado no código, mas é a escolha correta para SPA servida via `file://` (produção usa `loadFile('dist/index.html')`), onde history routing não funciona.

## D5 — Sem gerenciamento de estado global

- **Decisão:** cada ferramenta é um componente autocontido com estado local; nenhuma store, Context de dados ou cache compartilhado.
- **Evidência:** ausência de Redux/Zustand/Jotai/React Query; único hook compartilhado é `useClipboardData`.
- **Racional:** Não identificado. Inferência: as ferramentas são independentes e não compartilham dados, então estado global seria overhead.

## D6 — "Bibliotecas prontas para tarefas complexas"

- **Decisão:** delegar lógica não-trivial a libs de terceiros em vez de implementar.
- **Evidência:** `cronstrue`, `sql-formatter`, `diff`, `qrcode.react`, `crypto-js`. O spec do SQL Formatter afirma isso explicitamente: *"Segue o padrão já usado no projeto de trazer libs prontas para tarefas complexas (`crypto-js`, `node-forge`, `cronstrue`)"*.
- **Racional:** documentado no spec — reduzir esforço e risco de implementação.

## D7 — WebCrypto para RSA (abandono de `node-forge`)

- **Decisão:** `RsaGeneratorTool` usa `window.crypto.subtle` (WebCrypto), não `node-forge`.
- **Evidência:** o componente. Até esta limpeza, `node-forge` só aparecia em `app/test-forge.js` (script ad-hoc).
- **Racional:** Não identificado. Inferência a partir do extinto `test-forge.js`: houve uma tentativa com `node-forge` (`publicKeyToRSAPublicKeyPem`) que foi substituída por WebCrypto.
- **Consequência:** as chaves geradas são RSA-OAEP com uso `encrypt`/`decrypt` — não servem para assinatura.
- **Atualização:** `node-forge`, `@types/node-forge` e `app/test-forge.js` foram removidos do projeto (dependência morta, sem uso pelo app real). Ver `docs/dependencies.md` e `docs/testing.md`.

## D8 — Estilização com CSS único + variáveis + utilitários artesanais

- **Decisão:** um `index.css` global, tema dark fixo por CSS vars, classes utilitárias próprias (`.flex`, `.glass-panel`, `.tool-header`…), e `style={{}}` inline para o resto. Sem Tailwind.
- **Evidência:** `index.css`; os planos reforçam *"Sem Tailwind — só CSS vars e classes utilitárias já existentes"*.
- **Racional:** documentado nos planos como restrição do projeto.
- **Fonte:** Inter empacotada via `@fontsource/inter` (importada em `src/main.tsx`). Antes vinha de `fonts.googleapis.com` por `@import` no CSS — trocado para manter o app 100% offline (ver D14).

## D9 — Formatação "ao vivo" (sem botão "processar")

- **Decisão:** recalcular output a cada mudança de input, derivando com `useMemo`.
- **Evidência:** padrão em JSON, Base64, Hash, RegExp, Cron, SQL, Backslash, Diff.
- **Racional:** Não identificado; consistente com UX de "ferramenta instantânea". Exceções são operações caras / com ação explícita (RSA, senha, geração de UUID em lote, geração de JWT, timestamp→data).
- **Nota de implementação:** originalmente algumas tools sincronizavam o output em `useState` via `useEffect`; migrado para `useMemo` derivado puro (o `eslint-plugin-react-hooks` v7 barra `setState` dentro de efeito/render).

## D10 — Registro de ferramenta em dois (hoje, três) pontos

- **Decisão:** adicionar uma ferramenta = criar o componente + adicionar `<Route>` em `App.tsx` + adicionar item no array `TOOLS[]`.
- **Evidência:** os planos descrevem exatamente esses passos; o histórico do SQL Formatter (commits `9ae9c28`, `c423920`) segue isso.
- **Racional:** Não identificado (não há mecanismo de registro automático/derivado).
- **Atualização (pós-D17):** `TOOLS[]` morava em `Sidebar.tsx` na época desta decisão; foi extraído para `src/tools.ts` (ver D17) para ser compartilhado com `CommandPalette`. O passo 3 do fluxo de "adicionar ferramenta" hoje é editar `src/tools.ts`, não `Sidebar.tsx`.

## D11 — Sem testes automatizados

- **Decisão:** verificação só por `npm run lint` + `npm run dev` manual.
- **Evidência:** ausência de runner; declaração explícita nos planos.
- **Racional:** documentado nos planos ("Sem testes automatizados no projeto").

## D12 — Erro de SQL truncado à primeira linha

- **Decisão:** exibir só `message.split('\n')[0]` do erro do `sql-formatter`.
- **Evidência:** commit `874267f` — *"mostra só a primeira linha do erro de parse SQL, não o dump da gramática"*.
- **Racional:** documentado no commit — a lib joga a gramática inteira na mensagem de erro.

## D13 — Configuração explícita do electron-builder + split `build`/`dist`

- **Decisão:** bloco `build` em `package.json` (antes: só defaults). `npm run build` = só o renderer (`tsc -b && vite build`); `npm run dist` = renderer + `electron-builder -l`.
- **Evidência:** `app/package.json` (`build` field), commit `eaf847b`.
- **Racional:** o `build` antigo embutia `electron-builder` e estava quebrado; separar deixa o type-check/bundle rápido e reutilizável (CI). `directories.output: release` evita colisão com o `dist/` do Vite. `files` sem `node_modules` porque o renderer já é bundizado (asar 51 MB → 1 MB).

## D14 — Fonte empacotada, zero rede

- **Decisão:** `@fontsource/inter` (subset `latin`, 400–700) importado em `src/main.tsx`, em vez de `@import` do Google Fonts.
- **Evidência:** `src/main.tsx`, `src/index.css`, `package.json`, commit `eaf847b`.
- **Racional:** o app se propõe offline-first (privacidade — dados nunca saem da máquina); o `@import` era a única requisição de rede e contradizia isso.

## D15 — `useClipboardData` com API de callback

- **Decisão:** `useClipboardData(onData, enabled?)` — hook chama o callback com o texto do clipboard; o `setState` do auto-preenchimento acontece no callback, não em `useEffect`.
- **Evidência:** `src/hooks/useClipboardData.ts`, commit `7a24379`.
- **Racional:** o `eslint-plugin-react-hooks` v7 (`set-state-in-effect`) barra `setState` sincronizado dentro de efeito; a API de callback resolve isso e ainda cancela o timer no unmount.

## D17 — Command palette, error boundary e `useCopy`

- **Decisão:** (1) lista de ferramentas extraída para `src/tools.ts` (consumida por `Sidebar` + `CommandPalette`); (2) `<CommandPalette/>` com busca fuzzy inline (sem lib), atalho `Ctrl`/`Cmd`+`K`; (3) `<ErrorBoundary>` (class component) em volta das rotas, reseta ao trocar de rota; (4) hook `useCopy` para o feedback "Copiado!" em todos os botões de copiar.
- **Evidência:** `src/tools.ts`, `src/components/CommandPalette.tsx`, `src/components/ErrorBoundary.tsx`, `src/hooks/useCopy.ts`; merge `28bbfdd`.
- **Racional:** itens 1.1/1.3/1.4 do `docs/roadmap.md`. Sem lib de estado, sem toast/portal novo, seguindo as restrições do `CLAUDE.md`.

## D18 — Node fixado em `^24` (`engines` + `.node-version`)

- **Decisão:** `app/package.json` ganhou `engines.node: "^24"` e foi criado `app/.node-version` com `24`.
- **Evidência:** diagnosticado numa sessão de troubleshooting (2026-09-11): rodando `npm install` com **Node 26.8.1** (via `mise`), o postinstall do pacote `electron` falha **silenciosamente** — `extract-zip@2.0.1`/`yauzl@2.10.0` não descompacta o zip do binário (~117 MB baixado, contém um executável de ~206 MB): o processo termina com exit code 0, sem nenhum erro impresso, mas `node_modules/electron/dist/` fica incompleto. Sintoma no `npm run dev`: `Error: Electron failed to install correctly, please delete node_modules/electron and try installing again`.
- **Racional:** comparação lado a lado confirmou que **Node 24.21.0 extrai o mesmo zip normalmente** (<1s). O projeto já assumia Node 24 implicitamente (`@types/node: ^24.12.0`), só não estava declarado. Fixar a versão evita esse bug de compatibilidade.
- **Consequência:** fecha a lacuna "versão de Node: Não identificado" que existia em `docs/infrastructure.md`. Causa raiz exata do bug do `extract-zip`/`yauzl` no Node 26 não foi investigada a fundo (biblioteca sem manutenção ativa); a mitigação é não usar Node 26 neste projeto, não um patch na lib.
- **Ver também:** `docs/infrastructure.md` (ressalva sobre o bug).

---

## Divergências entre decisão documentada e código

| # | Documento | Diz | Código |
|---|---|---|---|
| V1 | Spec JWT (2026-06-09) | Renomear export `JwtDecoderTool` → `JwtTool` e atualizar import em `App.tsx` | O export continua `JwtDecoderTool`; `App.tsx` importa `JwtDecoderTool`. Só o título/label viraram "JWT Tool". |
| V2 | Spec SQL (2026-07-14) | Label do Sidebar: "Formatar SQL" | Label real: "Formatador de SQL" (o plano posterior usa "Formatador de SQL" — o plano venceu). |
| V3 | Planos (`superpowers`) | Referenciam um `CLAUDE.md` na raiz com "padrão de componente" | `CLAUDE.md` não existia até esta documentação. |
| ~~V4~~ | ~~Config dev: porta 1234 vs default 5173 do Vite~~ | **Resolvido** no commit `7a24379`: `vite.config.ts` fixa `server.port: 1234`. |

## Itens sem decisão documentada (Racional: Não identificado)

- Escolha das versões de Electron 41 / Vite 8 / React 19.
- Ausência de `contextBridge` / IPC.
- Mistura de idiomas na UI (PT-BR e EN coexistem: "JSON Formatter"/"Format, validate…" vs. "Formatador de SQL"/"Formata queries…").
- Nome do produto: `index.html` `<title>` = "DevUtils" (corrigido — era "Devtools"); Sidebar ainda = "DevUtils Linux"; `productName` do electron-builder = "DevUtils"; diretório = `devutils`. Sidebar e `<title>` agora batem; falta só unificar/remover o "Linux" da Sidebar (ver `docs/roadmap.md` 1.5).
- Ausência de CI, Dockerfile, `engines`/`.nvmrc`.
