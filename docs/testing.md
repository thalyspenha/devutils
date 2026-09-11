# Testes

## Resumo

Há testes de unidade com **Vitest** para as funções puras extraídas para `app/src/lib/` (item 2.1 do roadmap). Fora isso, a verificação continua majoritariamente manual: nenhuma integração de componentes (Testing Library) nem e2e (Playwright/Spectron).

Evidências:

- `app/package.json` declara `vitest` (devDependency) e o script `"test": "vitest run"`.
- `app/vitest.config.ts` (plugin `@vitejs/plugin-react`, ambiente `node` — as funções testadas não tocam DOM).
- 5 arquivos `*.test.ts` em `app/src/lib/`, um por módulo de lógica pura.
- O `.gitignore` inclui `test/` (herança de template) — não afeta os arquivos `*.test.ts`, que ficam dentro de `src/lib/`.
- Os planos em `docs/superpowers/` (anteriores a este item) ainda descrevem o projeto como "sem testes automatizados" — desatualizado após o item 2.1.

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

## Vitest (`item 2.1` do roadmap — ✅ feito)

- **O que:** `npm run test` (`vitest run`) roda 5 suítes, todas sobre funções puras extraídas de componentes para `app/src/lib/` (para testar sem montar React):
  - `src/lib/caseConverter.ts` (`getWords`/`toCamelCase`/`toPascalCase`/`toSnakeCase`/`toKebabCase`/`toConstantCase`/`convertCase`) — usado por `CaseConverterTool`.
  - `src/lib/backslashEscape.ts` (`escape`/`unescape`, round-trip) — usado por `BackslashEscapeTool`.
  - `src/lib/jwt.ts` (`encodeBase64Url`/`decodeBase64Url`, `signHS256`) — usado por `JwtDecoderTool`. `signHS256` também eliminou uma duplicação: antes a assinatura HMAC-SHA256 era calculada com o mesmo bloco de código tanto na verificação (decode) quanto na geração (generate).
  - `src/lib/unixTime.ts` (`parseUnixInput`, heurística ms vs s `> 1e12`) — usado por `UnixTimeConverterTool`.
  - `src/lib/regexTester.ts` (`execAllMatches`, guarda contra loop infinito em match de largura zero) — usado por `RegExpTesterTool`. Também eliminou duplicação: antes a mesma lógica de iteração era escrita duas vezes (uma para contar/detalhar matches, outra para destacar o texto).
- **Por quê:** essa lógica é onde moram os bugs sutis (tokenização frágil, heurística de heurística de timestamp, regex de largura zero) e não havia rede de segurança nenhuma.
- **Cuidado:** os componentes `*Tool.tsx` continuam com toda a lógica de UI/estado inline, como manda `CLAUDE.md`; só a lógica pura e sem dependência de React foi extraída. Isso também corrigiu um problema de lint (`react-refresh/only-export-components`): exportar função + componente do mesmo arquivo quebra o Fast Refresh.
- **Validado:** `npm run test`, `npm run lint` e `npm run build` (`tsc -b && vite build`) passam, todos rodados com Node 24 (`mise exec node@24 --`, já que o shell local por padrão resolve Node 26, que quebra a extração do binário do Electron — ver D18 em `docs/decisions.md`).

## `app/test-forge.js` (removido)

Existia um script Node ad-hoc (`app/test-forge.js`) que testava a lib `node-forge` para geração de par RSA + export PEM — resíduo de uma abordagem anterior ao `RsaGeneratorTool` atual, que usa `window.crypto.subtle` (WebCrypto). O script e a dependência `node-forge` (+ `@types/node-forge`) foram removidos por serem código/dependência morta, sem uso pelo app real. Ver `docs/dependencies.md` e `docs/decisions.md` (D7).

## Cobertura

Sem relatório de cobertura configurado (nenhum `--coverage` no script `test`, nenhum provider como `@vitest/coverage-v8` instalado). 29 testes cobrem as 5 funções/módulos listados em `src/lib/`; o restante do app (componentes, hooks, `main.cjs`/`preload.cjs`) permanece sem teste automatizado.

## Recomendações não implementadas

- Integração dos componentes com React Testing Library (ex.: fluxo de "colar da área de transferência" + "copiar").
- E2e com Playwright (via `_electron`) para cobrir o app empacotado de ponta a ponta.
- Relatório de cobertura (`@vitest/coverage-v8`) se o time quiser medir o que falta.
