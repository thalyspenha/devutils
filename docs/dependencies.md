# Dependências

> Fonte: `app/package.json` (a raiz do repositório não tem `package.json`). Versões conforme declaradas (semver com `^`/`~`).

## Runtime (`dependencies`)

| Pacote | Versão | Onde é usado | Finalidade |
|---|---|---|---|
| `@fontsource/inter` | `^5.3.0` | `src/main.tsx` | Fonte **Inter** empacotada (subset `latin`, pesos 400/500/600/700). Substitui o `@import` do Google Fonts — app 100% offline. |
| `react` | `^19.2.4` | todo o renderer | Biblioteca de UI |
| `react-dom` | `^19.2.4` | `main.tsx` | Renderização no DOM (`createRoot`) |
| `react-router-dom` | `^7.13.1` | `App.tsx`, `Sidebar.tsx` | Roteamento client-side (`HashRouter`, `Routes`, `Route`, `NavLink`) |
| `lucide-react` | `^0.577.0` | `Sidebar.tsx` e várias ferramentas | Ícones SVG (`Copy`, `Trash2`, `Database`, `AlertCircle`, …) |
| `crypto-js` | `^4.2.0` | `HashGeneratorTool`, `JwtDecoderTool` | MD5/SHA-1/SHA-256/SHA-512 e `HmacSHA256` (assinatura HS256 do JWT) |
| `cronstrue` | `^3.14.0` | `CronParserTool` (`cronstrue/i18n`) | Traduz expressão cron → texto (`locale: 'pt_BR'`) |
| `sql-formatter` | `^15.8.2` | `SqlFormatterTool` | Formatação de SQL multi-dialeto (`format`) |
| `diff` | `^9.0.0` | `TextDiffTool` (`import * as Diff`) | Diff de texto por linha (`diffLines`) |
| `qrcode.react` | `^4.2.0` | `QrCodeGeneratorTool` | Componente `QRCodeSVG` |

## Desenvolvimento (`devDependencies`)

### Build / toolchain

| Pacote | Versão | Finalidade |
|---|---|---|
| `vite` | `^8.0.0` | Dev server + bundler do renderer |
| `@vitejs/plugin-react` | `^6.0.0` | Suporte a React/JSX/Fast Refresh no Vite |
| `typescript` | `~5.9.3` | Compilador / type-check (`tsc -b`) |
| `electron` | `^41.0.2` | Runtime desktop |
| `electron-builder` | `^26.8.1` | Empacotamento Linux/AppImage (`npm run dist`); config no bloco `build` do `package.json` |
| `concurrently` | `^9.2.1` | Roda `vite` + `electron:dev` juntos |
| `cross-env` | `^10.1.0` | Define `NODE_ENV` de forma portável |
| `wait-on` | `^9.0.4` | Espera `tcp:1234` antes de abrir o Electron |

### Lint

| Pacote | Versão | Finalidade |
|---|---|---|
| `eslint` | `^9.39.4` | Linter (flat config) |
| `@eslint/js` | `^9.39.4` | Regras recomendadas base |
| `typescript-eslint` | `^8.56.1` | Parser + regras TS |
| `eslint-plugin-react-hooks` | `^7.0.1` | Regras de hooks |
| `eslint-plugin-react-refresh` | `^0.5.2` | Regras p/ Fast Refresh |
| `globals` | `^17.4.0` | Definições de globais (browser) |

### Tipos

| Pacote | Versão | Observação |
|---|---|---|
| `@types/node` | `^24.12.0` | Tipos Node (usado por `vite.config.ts` / `tsconfig.node.json`) |
| `@types/react` | `^19.2.14` | Tipos React |
| `@types/react-dom` | `^19.2.3` | Tipos ReactDOM |
| `@types/crypto-js` | `^4.2.2` | Tipos para `crypto-js` (a lib não é tipada) |
| `@types/diff` | `^7.0.2` | Tipos para `diff`. Nota: `diff` v9 já embute tipos próprios — este pacote pode ser redundante. |
| `@types/qrcode.react` | `^1.0.5` | Pacote de tipos da **v1** de `qrcode.react`. A dependência instalada é **v4**, que traz tipos próprios. Provavelmente redundante/incorreto. |

## Observações gerais

- **Lockfile:** `app/package-lock.json` (npm, `lockfileVersion: 3`). O `package-lock.json` da raiz é um stub vazio.
- **Sem `overrides`, `resolutions` ou `peerDependencies`** declaradas.
- **Sem dependências nativas** (todas as libs são JS puro), o que simplifica o empacotamento com electron-builder.
- **Pacotes possivelmente desnecessários:** `@types/qrcode.react` (tipos da v1 para uma lib na v4) e possivelmente `@types/diff`. (`node-forge` e `@types/node-forge` já foram removidos — eram dependência morta, usada só pelo extinto `app/test-forge.js`.)
- **Versões pré-lançamento aparente:** `vite ^8.0.0`, `electron ^41`, `react ^19.2` — versões altas; compatibilidade não verificada em execução neste ambiente de análise (sem `node_modules`).
