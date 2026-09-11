# Módulos

> O projeto não tem "módulos" no sentido de backend/pacotes. Esta página lista as **unidades de código** existentes: processo Electron, bootstrap do renderer, navegação, command palette, error boundary, shell de ferramenta compartilhado (`ToolLayout`/`ToolPanel`), hooks compartilhados, funções puras testáveis (`src/lib/`) e os 17 componentes-ferramenta.

## Processo Electron

| Arquivo | Responsabilidade |
|---|---|
| `app/main.cjs` | Processo principal. Cria a `BrowserWindow`, decide dev vs prod, redireciona links externos para o navegador do sistema, trata ciclo de vida do app. |
| `app/preload.cjs` | Preload. Roda em contexto isolado (`contextIsolation: true`, `sandbox: true`); hoje não expõe nenhuma API ao renderer via `contextBridge` (o app não usa IPC). |

## Renderer — núcleo

| Arquivo | Responsabilidade |
|---|---|
| `app/src/main.tsx` | Monta `<App/>` em `#root` via `createRoot`, dentro de `<StrictMode>`. |
| `app/src/App.tsx` | Define `<HashRouter>`, renderiza `<Sidebar/>`, `<CommandPalette/>` e `<ToolRoutes/>`. `ToolRoutes` envolve as 17 `<Route>` num `<ErrorBoundary resetKey={location.pathname}>` + `<Suspense fallback={<RouteFallback/>}>`. Cada componente-ferramenta é `React.lazy(() => import(...))` — code-split por rota, chunk carregado sob demanda. |
| `app/src/tools.ts` | Fonte única da lista de ferramentas: array `TOOLS` (`id`, `name`, `icon` do `lucide-react`, `path`), ordenado alfabeticamente por `name` + interface `Tool`. Consumido por `Sidebar` e `CommandPalette`. |
| `app/src/components/Sidebar.tsx` | Navegação lateral. Itera `TOOLS` (de `src/tools.ts`) com `<NavLink>`. Cabeçalho fixo "DevUtils" (igual ao `<title>` e ao `productName` do electron-builder). |
| `app/src/components/CommandPalette.tsx` | Overlay de busca de ferramentas (atalho `Ctrl`/`Cmd`+`K`, listener global em `window`). Match fuzzy inline sobre `tool.name` (bônus para caracteres consecutivos / início de palavra), lista derivada em `useMemo`. Navegação por teclado (`↑`/`↓`/`Enter`/`Esc`), fecha ao clicar fora. `useNavigate` para ir à rota. |
| `app/src/components/ErrorBoundary.tsx` | Class component. Captura erros de render de qualquer ferramenta (`getDerivedStateFromError`) — inclusive falha ao carregar o chunk `lazy` de uma tool — e mostra uma tela de recuperação (`.error-boundary`) com a mensagem + botão "Tentar de novo", em vez de tela branca. Reseta sozinho quando `resetKey` muda (troca de rota). |
| `app/src/components/ToolLayout.tsx` | Shell padrão de uma ferramenta: `<div className="main-content">` + `.tool-header` (título/descrição). `children` fica livre para ter 1+ `.tool-body` — necessário pro `JwtDecoderTool`, que tem uma barra de abas entre o header e dois `.tool-body` condicionais. Usado pelas 17 tools. |
| `app/src/components/ToolPanel.tsx` | Painel `.glass-panel` com um label (e, opcionalmente, botões de ação alinhados à direita). Reúne o que seriam `<PanelInput>`/`<PanelOutput>` num componente só — a diferença entre os dois é só o `readOnly` da textarea e o conjunto de botões, resolvidos via `children`/`actions`. Usado em `JsonFormatterTool`, `Base64Tool`, `BackslashEscapeTool`, `SqlFormatterTool` e `JwtDecoderTool` (painéis "Encoded JWT"/"Header"/"Payload"). |
| `app/src/index.css` | Único stylesheet global. Variáveis de tema (dark fixo), classes utilitárias, componentes de layout (`.sidebar`, `.tool-header`, `.tool-body`, `.glass-panel`, `.command-palette`, `.error-boundary`). |

| `app/src/hooks/useClipboardData.ts` | Hook `useClipboardData(onData)`. Retorna uma função `paste()` que lê o clipboard via `navigator.clipboard.readText()` **só quando chamada** (nunca sozinha no mount) e passa o texto para `onData`. Falha silenciosa (`console.warn`) se sem permissão. |
| `app/src/hooks/useCopy.ts` | Hook `useCopy(timeout = 1500)`. Retorna `{ copy, copiedKey, copied }`. `copy(text, key?)` escreve no clipboard e marca `copiedKey` por `timeout` ms (feedback "Copiado!" nos botões). Telas com um botão usam `copied`; telas com vários (RSA, Hash) passam uma `key` e comparam com `copiedKey`. Falha silenciosa se o clipboard estiver indisponível. |

### `useClipboardData` — consumidores

Todas têm um botão "Colar da área de transferência" (ícone `ClipboardPaste`) perto do campo de input, que chama a função retornada pelo hook: `JsonFormatterTool`, `Base64Tool` (detecta Base64 no texto colado e muda para modo decode), `JwtDecoderTool`, `BackslashEscapeTool`, `SqlFormatterTool`.

## Renderer — lógica pura (`app/src/lib/`)

Funções sem dependência de React, extraídas dos componentes correspondentes para poderem ser testadas com Vitest sem montar a árvore (ver `docs/testing.md`, item 2.1 do roadmap). Cada arquivo tem um `*.test.ts` irmão.

| Arquivo | Usado por | Responsabilidade |
|---|---|---|
| `app/src/lib/caseConverter.ts` | `CaseConverterTool` | `getWords`/`toCamelCase`/`toPascalCase`/`toSnakeCase`/`toKebabCase`/`toConstantCase`/`convertCase`. |
| `app/src/lib/backslashEscape.ts` | `BackslashEscapeTool` | `escape`/`unescape` de sequências `\n`, `\t`, `\\`, `\"`, etc. |
| `app/src/lib/jwt.ts` | `JwtDecoderTool` | `encodeBase64Url`/`decodeBase64Url`, `signHS256` (HMAC-SHA256 via `crypto-js`, usada tanto para verificar quanto para gerar). |
| `app/src/lib/unixTime.ts` | `UnixTimeConverterTool` | `parseUnixInput` — heurística ms vs segundos (`> 1e12`). |
| `app/src/lib/regexTester.ts` | `RegExpTesterTool` | `execAllMatches` — roda `RegExp.exec` em loop com guarda contra matches de largura zero (evita loop infinito). |

### `useCopy` — consumidores

Todos os botões de copiar do app: `JsonFormatterTool`, `Base64Tool`, `JwtDecoderTool` (aba Gerar), `SqlFormatterTool`, `BackslashEscapeTool`, `CaseConverterTool`, `UuidGeneratorTool`, `PasswordGeneratorTool`, `RsaGeneratorTool` (2 botões, `key` `public`/`private`), `HashGeneratorTool` (`key` = algoritmo).

## Componentes-ferramenta

Todos em `app/src/components/`. Colunas: rota, bibliotecas externas além de React/lucide-react, resumo, estado principal.

| Componente | Rota | Libs | Resumo | Estado |
|---|---|---|---|---|
| `JsonFormatterTool` | `/` | — | Valida e identa JSON (`JSON.parse` + `JSON.stringify(…, 2)`). Fallback: tenta corrigir backslashes não escapados antes de falhar. | `input` (+ `output`/`error` via `useMemo`) |
| `Base64Tool` | `/base64` | — | Encode/decode Base64 (`btoa`/`atob` com `escape`/`unescape` para UTF-8). Botão de swap troca input↔output e inverte o modo. | `input`, `mode` (+ `output`/`error` via `useMemo`) |
| `JwtDecoderTool` | `/jwt` | `crypto-js` | Abas **Decodificar** (split por `.`, base64url-decode de header/payload; secret opcional verifica assinatura HS256) e **Gerar** (assina HS256 com `CryptoJS.HmacSHA256`). | decode: `input`, `verifySecret` (+ `header`/`payload`/`headerAlg`/`error` e `signatureStatus` via `useMemo`); generate: `payloadText`,`secret`,`generatedToken`,`genError`; `activeTab` |
| `UnixTimeConverterTool` | `/unix-time` | — | Relógio Unix ao vivo (`setInterval` 1s). Timestamp→data (heurística: `>1e12` = ms, senão s; local + UTC). Data→timestamp (`datetime-local`, reativo; init em hora local). | `currentUnix`, `unixInput`, `dateOutput`, `unixError`, `dateInput` (+ `unixOutput` via `useMemo`) |
| `RegExpTesterTool` | `/regexp` | — | Testa regex ao vivo (`new RegExp(pattern, flags)`). Destaca matches no texto, lista matches + capture groups (limite de exibição: 50). Guarda contra loop de match zero-width. | `pattern`, `flags`, `testString` (+ `matchResult`/`error` via `useMemo`) |
| `CronParserTool` | `/cron` | `cronstrue/i18n` | Traduz expressão cron para texto em `pt_BR`. Cálculo síncrono no render (sem `useState` de output). Lista de exemplos estática. | `expression` |
| `QrCodeGeneratorTool` | `/qrcode` | `qrcode.react` (`QRCodeSVG`, `QRCodeCanvas`) | Gera QR em SVG (nível de correção `L`, `marginSize={0}`). Controles: texto, tamanho (128–512, step 16), cor de código, cor de fundo. Baixa **SVG** (`Blob` + `<a download>`) e **PNG** (via `QRCodeCanvas` oculto + `canvas.toDataURL`, mesmos props do SVG visível). | `text`, `size`, `fgColor`, `bgColor` |
| `UuidGeneratorTool` | `/uuid` | — | Gera UUID v4 via `crypto.randomUUID()`. Opções: quantidade (1–1000, sanitizada), maiúsculas, sem hífens. Copiar todos. | `uuids[]`, `count`, `uppercase`, `noHyphens` |
| `PasswordGeneratorTool` | `/password` | — | Gera senha com `window.crypto.getRandomValues` (`Uint32Array`, módulo sobre o charset). Opções: tamanho (4–64), maiúsc./minúsc./números/símbolos. Regenera a cada mudança de opção. | `password`, `length`, 4× flags de charset |
| `RsaGeneratorTool` | `/rsa` | — (WebCrypto) | Gera par RSA via `window.crypto.subtle.generateKey({name:'RSA-OAEP', hash:'SHA-256'}, …, ['encrypt','decrypt'])`. Exporta SPKI/PKCS8 → PEM manual (base64 + wrap 64). Tamanhos: 2048/4096. Erro exibido inline (não mais `alert()`). | `keySize`, `publicKey`, `privateKey`, `isGenerating`, `error` |
| `TextDiffTool` | `/diff` | `diff` (`Diff.diffLines`) | Compara dois textos linha a linha; renderiza `+`/`-`/contexto com cores. | `original`, `modified` (+ `diffResult` via `useMemo`) |
| `CaseConverterTool` | `/case` | — | Converte o texto entre camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE, UPPERCASE, lowercase. Campo de **Resultado separado e read-only** — o input nunca é sobrescrito. Tokenização por regex (`a-z`→`A-Z`, espaços, `_`, `-`), em funções puras fora do componente. | `input`, `activeCase` (+ `output` via `useMemo`) |
| `BackslashEscapeTool` | `/backslash` | — | Escapa/desescapa sequências (`\\`, `\n`, `\r`, `\t`, `\0`, `\"`, `\'`, `\b`, `\f`, `\v`) via mapas + regex. Swap input↔output. Legenda de sequências suportadas. | `input`, `mode` (+ `output` via `useMemo`) |
| `SqlFormatterTool` | `/sql` | `sql-formatter` (`format`) | Formata SQL ao vivo. Dropdown de dialeto (`sql`/`mysql`/`postgresql`/`mariadb` → opção `language`). `tabWidth: 2`, `keywordCase: 'upper'` fixos. Em erro, exibe **só a primeira linha** da mensagem. | `input`, `dialect` (+ `output`/`error` via `useMemo`) |
| `ChmodCalculatorTool` | `/chmod` | — | Calculadora de permissões Unix. Estado canônico é o octal (3 dígitos); checkboxes rwx (dono/grupo/outros) e campo octal editam o mesmo estado via bitwise (`^` toggle no checkbox, filtro `[0-7]` no campo texto). Simbólico (`rwxr-xr-x`) e comando (`chmod NNN arquivo`) são derivados, read-only, com botão copiar. | `octal` |
| `UrlParserTool` | `/url` | — (`URL`, `URLSearchParams` nativos) | Analisa uma URL colada: painel de componentes (protocolo, usuário/senha, host, hostname, porta, caminho, query string, fragmento, origin) + tabela de parâmetros de query já decodificados via `URLSearchParams.entries()` (preserva chaves duplicadas, ao contrário de um objeto). Erro de URL inválida exibido inline sem apagar o input. Botão "Copiar como JSON" nos parâmetros. | `input` (+ `parsed`/`error` via `useMemo`) |

### Observações por componente

- **`JwtDecoderTool`** — o export continua `JwtDecoderTool` (o spec `docs/superpowers/specs/2026-06-09-jwt-generator-design.md` previa renomear para `JwtTool`; não foi feito). O título exibido e o item do menu são "JWT Tool".
- **`CaseConverterTool`** — cada botão só seleciona o formato (`activeCase`); o resultado vai para um campo de saída read-only separado, derivado com `useMemo`. O input do usuário nunca é sobrescrito, então já não há mais perda de informação ao trocar de formato.
- **`RsaGeneratorTool`** — as chaves têm uso `encrypt`/`decrypt` (RSA-OAEP), não servem para assinatura; a descrição na UI já deixa isso explícito. Opção de 1024 bits removida (insegura); erro de geração agora é uma mensagem inline, não `alert()`.
- **`UnixTimeConverterTool`** — "Date to Timestamp" interpreta o valor de `datetime-local` como horário **local** (`new Date(dateInput)`).
- **`QrCodeGeneratorTool`** — usa `marginSize={0}` (prop atual do `qrcode.react` v4; `includeMargin` está deprecated). Exporta em **SVG** (`QRCodeSVG` + serialização manual) e **PNG** (`QRCodeCanvas` oculto, só para gerar o PNG via `canvas.toDataURL`, com os mesmos props do SVG visível).

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
