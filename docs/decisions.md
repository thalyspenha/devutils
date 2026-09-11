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
- **Racional:** Não identificado explicitamente. Inferência: acesso a clipboard/crypto com UX de app nativo e distribuição de binário. `electron-builder -l` (target `AppImage`) sugere alvo Linux desktop.

## D2 — Renderer React 19 + Vite, sem plugin de integração Electron

- **Decisão:** o renderer é um projeto Vite/React "comum"; a integração com Electron é feita à mão (dois `package.json`? não — um só, em `app/`; `main.cjs` na raiz de `app/`).
- **Evidência:** `vite.config.ts` mínimo (só `@vitejs/plugin-react`), sem `vite-plugin-electron` / `electron-vite`.
- **Racional:** Não identificado. Inferência: manter o setup simples ("MVP").

## D3 — `contextIsolation: true` + `nodeIntegration: false` + CSP (revertido de D3 original)

- **Decisão:** endurecer o `webPreferences` do renderer (`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`) e adicionar `Content-Security-Policy` no `index.html`.
- **Evidência:** `app/main.cjs`, `app/preload.cjs`, `app/index.html`; item 2.4 do `docs/roadmap.md`.
- **Racional:** a configuração original (`contextIsolation: false` + `nodeIntegration: true`, ver histórico deste arquivo) era a menos segura do Electron, declarada como MVP. Como nenhum componente do renderer usa API de Node (confirmado via grep em `src/` — sem `require`, `process.*`, `ipcRenderer`, etc.) e o app não carrega conteúdo remoto, a migração foi de baixo risco.
- **Trade-off:** `preload.cjs` não expõe nenhuma API via `contextBridge` hoje (o app não usa IPC — ver seção 3 do `CLAUDE.md`). A CSP inclui `style-src 'self' 'unsafe-inline'` porque as tools usam `style={{}}` inline extensivamente (padrão do projeto, ver seção 5 do `CLAUDE.md`); apertar isso exigiria migrar para CSS/classes, fora de escopo aqui. `connect-src` libera `localhost:1234` (http/ws) só para o HMR do Vite em dev — inofensivo em produção (`file://`). Validado manualmente rodando `electron .` em prod e em dev (HMR), sem violações de CSP no console do renderer.

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

## D15 — `useClipboardData` com API de callback (versão original — ver D19)

- **Decisão:** `useClipboardData(onData, enabled?)` — hook chama o callback com o texto do clipboard; o `setState` do auto-preenchimento acontece no callback, não em `useEffect`.
- **Evidência:** `src/hooks/useClipboardData.ts`, commit `7a24379`.
- **Racional:** o `eslint-plugin-react-hooks` v7 (`set-state-in-effect`) barra `setState` sincronizado dentro de efeito; a API de callback resolve isso e ainda cancela o timer no unmount.
- **Superada pela D19:** essa versão ainda lia o clipboard sozinha ~100ms após o mount de cada ferramenta. O formato do hook (retornar callback) segue válido; o comportamento automático foi removido.

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

## D19 — `useClipboardData` deixa de ler o clipboard sozinho no mount

- **Decisão:** o hook não dispara mais `navigator.clipboard.readText()` automaticamente ~100ms após montar uma ferramenta (comportamento da D15). Agora `useClipboardData(onData)` retorna uma função `paste()`, ligada a um botão visível "Colar da área de transferência" (ícone `ClipboardPaste` do `lucide-react`) em cada uma das 5 ferramentas que usam o hook (`JsonFormatterTool`, `Base64Tool`, `JwtDecoderTool`, `BackslashEscapeTool`, `SqlFormatterTool`).
- **Evidência:** `src/hooks/useClipboardData.ts` reescrito; botão adicionado no header do painel de input de cada tool consumidora.
- **Racional:** item 8 da lista de dívida técnica em `docs/roadmap.md` — ler o clipboard do sistema sem nenhuma ação do usuário é um comportamento discreto mas surpreendente do ponto de vista de privacidade/UX, mesmo sem enviar o dado pra fora da máquina.
- **Consequência:** os filtros que antes decidiam se auto-colava (JSON precisa parsear, JWT precisa ter 3 partes, etc.) foram removidos — agora o botão sempre cola o texto bruto, e a validação normal de cada ferramenta mostra o erro se o conteúdo não servir (mesmo comportamento de digitar/colar manualmente com Ctrl+V). A detecção automática de Base64 no `Base64Tool` (troca pro modo decode) foi mantida, agora rodando no clique do botão.

## D20 — Code-split das rotas (`React.lazy` + `Suspense`)

- **Decisão:** cada componente-ferramenta passou a ser importado com `React.lazy(() => import(...))` em `App.tsx`; as `<Routes>` ficam dentro de `<Suspense fallback={<RouteFallback/>}>`, por sua vez dentro do `<ErrorBoundary>` já existente.
- **Evidência:** `src/App.tsx`; item 2.5 do `docs/roadmap.md`.
- **Racional:** o bundle de produção era um chunk único de ~835 KB (aviso do Vite: "chunk maior que 500 KB"). Boa parte do peso vinha de libs usadas por uma única tool (`sql-formatter` em `SqlFormatterTool`, `cronstrue` em `CronParserTool`). Com `React.lazy`, cada tool (e suas libs exclusivas) vira um chunk carregado só quando a rota é aberta.
- **Consequência:** bundle principal caiu para ~238 KB; `SqlFormatterTool` (~265 KB) e `CronParserTool` (~184 KB) viraram chunks próprios. Validado manualmente com `electron .` sob `file://`, navegando por várias rotas (screenshot confirmando o carregamento do chunk sob demanda) — sem violação de CSP nem erro no console do renderer.

## D21 — Extração de `ToolLayout`/`ToolPanel`

- **Decisão:** dois componentes compartilhados em `src/components/`: `ToolLayout` (shell `.main-content` + `.tool-header`, título/descrição) e `ToolPanel` (painel `.glass-panel` com label + botões de ação opcionais). As 15 tools usam `ToolLayout`; as 5 com padrão de painel duplo input/output (`JsonFormatterTool`, `Base64Tool`, `BackslashEscapeTool`, `SqlFormatterTool`, `JwtDecoderTool`) também usam `ToolPanel`.
- **Evidência:** `src/components/ToolLayout.tsx`, `src/components/ToolPanel.tsx`; item 2.6 do `docs/roadmap.md`.
- **Racional:** as 15 tools tinham o mesmo cabeçalho (`.tool-header` com `<h2>`/`<p>`) copiado à mão, e 12 delas usavam o wrapper externo `h-full flex-col` (sem `flex-grow` explícito) contra 3 com `main-content` (que tem `flex:1` explícito) — inconsistência sem motivo. `ToolLayout` unificou o wrapper (agora todas usam `main-content`) e o cabeçalho. `ToolPanel` juntou o que seriam `<PanelInput>`/`<PanelOutput>` num componente só, já que a única diferença real entre os dois é o `readOnly` da textarea e o conjunto de botões — ambos resolvidos via `children`/`actions`, sem precisar de dois componentes.
- **Trade-off:** as outras 10 tools (campo único ou múltiplos campos, sem par input/output) só adotaram `ToolLayout` — forçar `ToolPanel` nelas seria abstração sem motivo real (contra a seção 5 do `CLAUDE.md`). Nenhum CSS novo: os dois componentes reusam classes já existentes em `index.css` (`main-content`, `tool-header`, `glass-panel`, `flex-*`).
- **Consequência:** `ToolLayout` não força um único `.tool-body` — `children` fica livre, o que permite o `JwtDecoderTool` (barra de abas entre o header e dois `.tool-body` condicionais) usar o mesmo componente sem gambiarra.

## D22 — Testes de unidade com Vitest + extração de `src/lib/`

- **Decisão:** `vitest` adicionado como `devDependency` (script `npm test` = `vitest run`, config em `app/vitest.config.ts`). As 5 funções com lógica não-trivial listadas no item 2.1 do `docs/roadmap.md` foram movidas dos componentes `*Tool.tsx` para `src/lib/{caseConverter,backslashEscape,jwt,unixTime,regexTester}.ts`, cada uma com um `*.test.ts` irmão.
- **Evidência:** `src/lib/*.ts` + `src/lib/*.test.ts`; `app/package.json`, `app/vitest.config.ts`; item 2.1 do `docs/roadmap.md`.
- **Racional:** essa lógica (tokenização de case, heurística ms/s, base64url/HS256, guarda contra match zero-width) é onde moram bugs sutis, e o projeto não tinha rede de segurança nenhuma além de lint/manual. A extração para fora do componente foi necessária, não só "ideal": o `eslint-plugin-react-refresh` (regra `only-export-components`) barra exportar função + componente React do mesmo arquivo, então manter os testes sem essa extração quebraria o lint.
- **Trade-off:** `src/lib/` é uma exceção pontual à regra "lógica inline no componente" da seção 5 do `CLAUDE.md` — só existe para o que precisa de teste de unidade sem montar React; não virou uma camada de domínio geral, e novas ferramentas continuam com lógica inline por padrão.
- **Consequência:** a extração eliminou duas duplicações que já existiam: `signHS256` (HMAC-SHA256 calculado 2x em `JwtDecoderTool`, na verificação e na geração) e `execAllMatches` (o mesmo loop de `RegExp.exec` existia 2x em `RegExpTesterTool`, uma vez para contar/detalhar matches e outra para o highlight — agora o highlight reaproveita o resultado já calculado).
- **Ver também:** `docs/testing.md`, `docs/modules.md` (nova seção "Renderer — lógica pura").

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
- Mistura de idiomas nos **títulos** (`<h2>`) das tools, que continuam em inglês ("JSON Formatter", "RegExp Tester", "Base64 Encoder/Decoder"…) para bater com o nome em `TOOLS[]`/Sidebar — decisão implícita ao resolver o item 1.5 do roadmap, nunca declarada explicitamente. O restante da UI (descrições, labels, botões, placeholders, mensagens de erro/estado) já é PT-BR em todas as 15 tools.
- Ausência de CI e Dockerfile — avaliado e descartado deliberadamente (CI chegou a entrar no `docs/roadmap.md` como item 2.2 e foi removido a pedido: não considerado necessário para um app desktop de uso pessoal sem colaboradores).

**Resolvidos** (constavam aqui antes): `contextBridge`/IPC — decisão registrada em D3/D21 (o app segue sem IPC, mas agora por escolha explícita de segurança, com `contextIsolation`/`sandbox` ligados, não por "MVP simples"); nome do produto — Sidebar, `<title>` e `productName` do electron-builder hoje batem, todos "DevUtils" (item 1.5 do roadmap); `engines`/`.node-version` — ver D18.
