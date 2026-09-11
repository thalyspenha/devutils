# Módulos

> O projeto não tem "módulos" no sentido de backend/pacotes. Esta página lista as **unidades de código** existentes: processo Electron, bootstrap do renderer, navegação, command palette, error boundary, hooks compartilhados e os 15 componentes-ferramenta.

## Processo Electron

| Arquivo | Responsabilidade |
|---|---|
| `app/main.cjs` | Processo principal. Cria a `BrowserWindow`, decide dev vs prod, redireciona links externos para o navegador do sistema, trata ciclo de vida do app. |
| `app/preload.cjs` | Preload. Tenta preencher spans de versão no DOM (elementos inexistentes no HTML atual — efeito nulo). |

## Renderer — núcleo

| Arquivo | Responsabilidade |
|---|---|
| `app/src/main.tsx` | Monta `<App/>` em `#root` via `createRoot`, dentro de `<StrictMode>`. |
| `app/src/App.tsx` | Define `<HashRouter>`, renderiza `<Sidebar/>`, `<CommandPalette/>` e `<ToolRoutes/>`. `ToolRoutes` envolve as 15 `<Route>` num `<ErrorBoundary resetKey={location.pathname}>`. Importa todos os componentes-ferramenta estaticamente. |
| `app/src/tools.ts` | Fonte única da lista de ferramentas: array `TOOLS` (`id`, `name`, `icon` do `lucide-react`, `path`) + interface `Tool`. Consumido por `Sidebar` e `CommandPalette`. |
| `app/src/components/Sidebar.tsx` | Navegação lateral. Itera `TOOLS` (de `src/tools.ts`) com `<NavLink>`. Cabeçalho fixo "DevUtils Linux". |
| `app/src/components/CommandPalette.tsx` | Overlay de busca de ferramentas (atalho `Ctrl`/`Cmd`+`K`, listener global em `window`). Match fuzzy inline sobre `tool.name` (bônus para caracteres consecutivos / início de palavra), lista derivada em `useMemo`. Navegação por teclado (`↑`/`↓`/`Enter`/`Esc`), fecha ao clicar fora. `useNavigate` para ir à rota. |
| `app/src/components/ErrorBoundary.tsx` | Class component. Captura erros de render de qualquer ferramenta (`getDerivedStateFromError`) e mostra uma tela de recuperação (`.error-boundary`) com a mensagem + botão "Tentar de novo", em vez de tela branca. Reseta sozinho quando `resetKey` muda (troca de rota). |
| `app/src/index.css` | Único stylesheet global. Variáveis de tema (dark fixo), classes utilitárias, componentes de layout (`.sidebar`, `.tool-header`, `.tool-body`, `.glass-panel`, `.command-palette`, `.error-boundary`). |

| `app/src/hooks/useClipboardData.ts` | Hook `useClipboardData(onData)`. Retorna uma função `paste()` que lê o clipboard via `navigator.clipboard.readText()` **só quando chamada** (nunca sozinha no mount) e passa o texto para `onData`. Falha silenciosa (`console.warn`) se sem permissão. |
| `app/src/hooks/useCopy.ts` | Hook `useCopy(timeout = 1500)`. Retorna `{ copy, copiedKey, copied }`. `copy(text, key?)` escreve no clipboard e marca `copiedKey` por `timeout` ms (feedback "Copiado!" nos botões). Telas com um botão usam `copied`; telas com vários (RSA, Hash) passam uma `key` e comparam com `copiedKey`. Falha silenciosa se o clipboard estiver indisponível. |

### `useClipboardData` — consumidores

Todas têm um botão "Colar da área de transferência" (ícone `ClipboardPaste`) perto do campo de input, que chama a função retornada pelo hook: `JsonFormatterTool`, `Base64Tool` (detecta Base64 no texto colado e muda para modo decode), `JwtDecoderTool`, `BackslashEscapeTool`, `SqlFormatterTool`.

### `useCopy` — consumidores

Todos os botões de copiar do app: `JsonFormatterTool`, `Base64Tool`, `JwtDecoderTool` (aba Gerar), `SqlFormatterTool`, `BackslashEscapeTool`, `CaseConverterTool`, `UuidGeneratorTool`, `PasswordGeneratorTool`, `RsaGeneratorTool` (2 botões, `key` `public`/`private`), `HashGeneratorTool` (`key` = algoritmo).

## Componentes-ferramenta

Todos em `app/src/components/`. Colunas: rota, bibliotecas externas além de React/lucide-react, resumo, estado principal.

| Componente | Rota | Libs | Resumo | Estado |
|---|---|---|---|---|
| `JsonFormatterTool` | `/` | — | Valida e identa JSON (`JSON.parse` + `JSON.stringify(…, 2)`). Fallback: tenta corrigir backslashes não escapados antes de falhar. | `input` (+ `output`/`error` via `useMemo`) |
| `Base64Tool` | `/base64` | — | Encode/decode Base64 (`btoa`/`atob` com `escape`/`unescape` para UTF-8). Botão de swap troca input↔output e inverte o modo. | `input`, `mode` (+ `output`/`error` via `useMemo`) |
| `JwtDecoderTool` | `/jwt` | `crypto-js` | Abas **Decodificar** (split por `.`, base64url-decode de header/payload) e **Gerar** (assina HS256 com `CryptoJS.HmacSHA256`). Não verifica assinatura na aba decode. | decode: `input` (+ `header`/`payload`/`error` via `useMemo`); generate: `payloadText`,`secret`,`generatedToken`,`genError`; `activeTab` |
| `UnixTimeConverterTool` | `/unix-time` | — | Relógio Unix ao vivo (`setInterval` 1s). Timestamp→data (heurística: `>1e12` = ms, senão s; local + UTC). Data→timestamp (`datetime-local`, reativo; init em hora local). | `currentUnix`, `unixInput`, `dateOutput`, `unixError`, `dateInput` (+ `unixOutput` via `useMemo`) |
| `RegExpTesterTool` | `/regexp` | — | Testa regex ao vivo (`new RegExp(pattern, flags)`). Destaca matches no texto, lista matches + capture groups (limite de exibição: 50). Guarda contra loop de match zero-width. | `pattern`, `flags`, `testString` (+ `matchResult`/`error` via `useMemo`) |
| `CronParserTool` | `/cron` | `cronstrue/i18n` | Traduz expressão cron para texto em `pt_BR`. Cálculo síncrono no render (sem `useState` de output). Lista de exemplos estática. | `expression` |
| `QrCodeGeneratorTool` | `/qrcode` | `qrcode.react` (`QRCodeSVG`) | Gera QR em SVG (nível de correção `L`). Controles: texto, tamanho (128–512, step 16), cor de código, cor de fundo. Botão baixa o SVG via `Blob` + `<a download>`. | `text`, `size`, `fgColor`, `bgColor` |
| `UuidGeneratorTool` | `/uuid` | — | Gera UUID v4 via `crypto.randomUUID()`. Opções: quantidade (1–1000, sanitizada), maiúsculas, sem hífens. Copiar todos. | `uuids[]`, `count`, `uppercase`, `noHyphens` |
| `PasswordGeneratorTool` | `/password` | — | Gera senha com `window.crypto.getRandomValues` (`Uint32Array`, módulo sobre o charset). Opções: tamanho (4–64), maiúsc./minúsc./números/símbolos. Regenera a cada mudança de opção. | `password`, `length`, 4× flags de charset |
| `RsaGeneratorTool` | `/rsa` | — (WebCrypto) | Gera par RSA via `window.crypto.subtle.generateKey({name:'RSA-OAEP', hash:'SHA-256'}, …, ['encrypt','decrypt'])`. Exporta SPKI/PKCS8 → PEM manual (base64 + wrap 64). Tamanhos: 1024/2048/4096. `alert()` em erro. | `keySize`, `publicKey`, `privateKey`, `isGenerating` |
| `TextDiffTool` | `/diff` | `diff` (`Diff.diffLines`) | Compara dois textos linha a linha; renderiza `+`/`-`/contexto com cores. | `original`, `modified` (+ `diffResult` via `useMemo`) |
| `CaseConverterTool` | `/case` | — | Converte o texto entre camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, UPPERCASE, lowercase. **Sobrescreve o próprio input** com o resultado (in-place). Tokenização por regex (`a-z`→`A-Z`, espaços, `_`, `-`). | `input` |
| `BackslashEscapeTool` | `/backslash` | — | Escapa/desescapa sequências (`\\`, `\n`, `\r`, `\t`, `\0`, `\"`, `\'`, `\b`, `\f`, `\v`) via mapas + regex. Swap input↔output. Legenda de sequências suportadas. | `input`, `mode` (+ `output` via `useMemo`) |
| `SqlFormatterTool` | `/sql` | `sql-formatter` (`format`) | Formata SQL ao vivo. Dropdown de dialeto (`sql`/`mysql`/`postgresql`/`mariadb` → opção `language`). `tabWidth: 2`, `keywordCase: 'upper'` fixos. Em erro, exibe **só a primeira linha** da mensagem. | `input`, `dialect` (+ `output`/`error` via `useMemo`) |

### Observações por componente

- **`JwtDecoderTool`** — o export continua `JwtDecoderTool` (o spec `docs/superpowers/specs/2026-06-09-jwt-generator-design.md` previa renomear para `JwtTool`; não foi feito). O título exibido e o item do menu são "JWT Tool".
- **`CaseConverterTool`** — não tem campo de saída separado; cada botão transforma `input` no lugar. Converter duas vezes pode perder informação (ex.: `UPPERCASE` depois `camelCase`).
- **`RsaGeneratorTool`** — as chaves têm uso `encrypt`/`decrypt` (RSA-OAEP), não servem para assinatura. Descrição na UI: "chaves temporárias para testes".
- **`UnixTimeConverterTool`** — "Date to Timestamp" interpreta o valor de `datetime-local` como horário **local** (`new Date(dateInput)`).
- **`QrCodeGeneratorTool`** — usa a prop `includeMargin` do `qrcode.react`; em `qrcode.react` v4 essa prop foi substituída por `marginSize` (a antiga pode ser ignorada). Ver `docs/dependencies.md`.

## Recursos estáticos

| Arquivo | Uso |
|---|---|
| `app/public/favicon.svg` | Favicon referenciado em `index.html`. |
| `app/public/icons.svg` | Sprite SVG (ícones de redes sociais: bluesky, etc.). **Não referenciado** em nenhum componente. |
| `app/src/assets/hero.png`, `app/src/assets/vite.svg` | **Não referenciados** no código. |
| `app/build/icon.png` (+ `icon.svg` fonte) | Ícone do app (512×512), consumido pelo electron-builder no empacotamento. |

## O que não foi identificado

- **Módulos backend, workers, jobs, CLIs**: não existem.
- **Barrel files / índices de módulo**: Não identificado (imports diretos por arquivo).
- **Feature flags / plugins**: Não identificado.
