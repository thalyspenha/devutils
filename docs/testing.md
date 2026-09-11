# Testes

## Resumo

**Não há testes automatizados.** Nenhum framework de teste, nenhum arquivo `*.test.*` / `*.spec.*`, nenhum runner configurado.

Evidências:

- `app/package.json` não tem script `test` e não declara `jest`, `vitest`, `mocha`, `@testing-library/*`, `playwright`, `cypress`, `spectron`, etc.
- Busca no repositório não encontra arquivos de teste nem diretório `__tests__`.
- O `.gitignore` inclui `test/` (herança de template) — qualquer pasta `test/` seria ignorada pelo git.
- Os planos em `docs/superpowers/` afirmam explicitamente: *"Sem testes automatizados no projeto — verificação de cada task é manual, via `npm run dev` + `npm run lint`"*.

## Verificação existente

### 1. Lint (`npm run lint`)

- `eslint .` sobre `app/`, config em `app/eslint.config.js` (flat config).
- Extends: `@eslint/js` recommended, `typescript-eslint` recommended, `eslint-plugin-react-hooks` (flat recommended), `eslint-plugin-react-refresh` (vite).
- `globalIgnores(['dist'])`.
- `languageOptions`: `ecmaVersion: 2020`, `globals.browser`.
- Observação: `PasswordGeneratorTool.tsx` tem um `// eslint-disable-next-line react-hooks/exhaustive-deps` — indica que o lint roda e foi ajustado pontualmente.

### 2. Type-check (`tsc -b`, dentro de `npm run build`)

- `tsconfig.app.json`: `strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `erasableSyntaxOnly`, `verbatimModuleSyntax`, `jsx: react-jsx`, `moduleResolution: bundler`.
- `npm run build` = `tsc -b && vite build` (o empacotamento saiu para `npm run dist`).
- Estado: **`npm run lint`, `tsc -b` e `vite build` passam (exit 0)** — verificado. Antes falhavam (imports/`setState`-em-efeito/tipo de `crypto.randomUUID`); corrigido nos commits `7a24379` / `eaf847b`.
- O `eslint-plugin-react-hooks` v7 traz regras do React Compiler (`set-state-in-effect`, `set-state-in-render`, `purity`, `immutability`) — foram o motivo da maior parte dos ajustes.

### 3. Teste manual documentado

O plano `docs/superpowers/plans/2026-07-14-sql-query-formatter.md` descreve um roteiro manual de verificação (rodar `npm run dev`, colar SQL, trocar dialeto, testar SQL inválido, testar botão copiar, conferir console do DevTools). É o padrão de QA do projeto.

### 4. Verificação via `electron .` com captura de tela e log do console

Usada em mudanças de maior risco (segurança do Electron/CSP, code-split de rotas, refatoração de layout): rodar `npx electron .` (dev ou apontando para `dist/`, com `--no-sandbox` quando o ambiente não suporta o sandbox do Chromium) escutando `webContents.on('console-message', …)` para capturar erros do renderer (violação de CSP, falha ao carregar chunk `lazy`, etc.) e usando `webContents.capturePage()` para tirar screenshot de rotas específicas e conferir visualmente o resultado. É um roteiro **temporário**: o código de captura/log é adicionado a `main.cjs` só durante a verificação e removido antes de finalizar a mudança — nunca fica commitado.

## Vitest (`item 2.1` do roadmap — ainda não implementado)

`docs/roadmap.md` item 2.1 propõe testes de unidade nas partes com lógica não-trivial (`CaseConverterTool`, `BackslashEscapeTool`, `JwtDecoderTool`, `UnixTimeConverterTool`, `RegExpTesterTool`). Nenhum trabalho foi feito ainda — ver o roadmap para escopo e critério de pronto.

## `app/test-forge.js` (removido)

Existia um script Node ad-hoc (`app/test-forge.js`) que testava a lib `node-forge` para geração de par RSA + export PEM — resíduo de uma abordagem anterior ao `RsaGeneratorTool` atual, que usa `window.crypto.subtle` (WebCrypto). O script e a dependência `node-forge` (+ `@types/node-forge`) foram removidos por serem código/dependência morta, sem uso pelo app real. Ver `docs/dependencies.md` e `docs/decisions.md` (D7).

## Cobertura

**0%** — não aplicável (sem testes).

## Recomendações não implementadas

Não há nenhuma infraestrutura de teste a documentar. Qualquer estratégia de teste (unitário nas funções puras de `CaseConverterTool`/`BackslashEscapeTool`, integração dos componentes com Testing Library, e2e com Playwright para o Electron) seria trabalho novo — fora do escopo desta documentação.
