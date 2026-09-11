# API / Endpoints

## Resumo

**Não há API HTTP.** O projeto não expõe nem consome nenhuma API REST, GraphQL, gRPC, WebSocket ou similar. Não há servidor, controllers, rotas HTTP nem um cliente HTTP (`fetch`/`axios`/`got` não aparecem no código de negócio).

O que existe de "roteamento" é a **navegação client-side** do `react-router-dom`, e o que existe de "API" são **APIs de plataforma** (navegador Chromium + Electron).

## "Endpoints" internos — rotas do renderer

Definidas em `app/src/App.tsx` com `<HashRouter>` (URLs reais têm o prefixo `#`, ex.: `index.html#/jwt`).

| Rota | Componente | Descrição |
|---|---|---|
| `/` | `JsonFormatterTool` | Formatador/validador de JSON (rota padrão) |
| `/base64` | `Base64Tool` | Encoder/decoder Base64 |
| `/jwt` | `JwtDecoderTool` | Decodificador e gerador (HS256) de JWT |
| `/unix-time` | `UnixTimeConverterTool` | Conversor de Unix timestamp ↔ data |
| `/regexp` | `RegExpTesterTool` | Testador de expressões regulares |
| `/cron` | `CronParserTool` | Tradutor de expressão cron (pt-BR) |
| `/qrcode` | `QrCodeGeneratorTool` | Gerador de QR Code (SVG) |
| `/uuid` | `UuidGeneratorTool` | Gerador de UUID v4 |
| `/password` | `PasswordGeneratorTool` | Gerador de senha forte |
| `/hash` | `HashGeneratorTool` | Gerador de hash MD5/SHA-1/SHA-256/SHA-512 |
| `/rsa` | `RsaGeneratorTool` | Gerador de par de chaves RSA |
| `/diff` | `TextDiffTool` | Comparador de texto (diff por linha) |
| `/case` | `CaseConverterTool` | Conversor de "case" (camel/snake/…) |
| `/backslash` | `BackslashEscapeTool` | Escape/unescape de sequências backslash |
| `/sql` | `SqlFormatterTool` | Formatador de SQL |

- Sem rota curinga / página 404.
- Sem parâmetros de rota, query strings ou route guards.

## APIs de plataforma consumidas

### Web APIs (navegador / Chromium)

| API | Onde é usada | Finalidade |
|---|---|---|
| `navigator.clipboard.readText()` | `hooks/useClipboardData.ts` | Colar no input sob clique do botão "Colar da área de transferência" |
| `navigator.clipboard.writeText()` | quase todas as ferramentas | Botões "Copiar" |
| `window.crypto.getRandomValues()` | `PasswordGeneratorTool` | Aleatoriedade da senha |
| `crypto.randomUUID()` | `UuidGeneratorTool` | Geração de UUID v4 |
| `window.crypto.subtle.generateKey / exportKey` | `RsaGeneratorTool` | Geração e export de chaves RSA-OAEP (SPKI/PKCS8) |
| `btoa` / `atob` | `Base64Tool`, `JwtDecoderTool`, `RsaGeneratorTool` | Base64 |
| `escape` / `unescape` (globais, legados) | `Base64Tool`, `JwtDecoderTool` | Ponte UTF-8 ↔ Latin-1 para `btoa`/`atob` |
| `XMLSerializer` + `Blob` + `URL.createObjectURL` + `<a download>` | `QrCodeGeneratorTool` | Download do QR Code em SVG |
| `setInterval` / `clearInterval` | `UnixTimeConverterTool` | Relógio ao vivo |

### Electron APIs (processo principal)

| API | Onde | Finalidade |
|---|---|---|
| `app` (`whenReady`, `on('activate')`, `on('window-all-closed')`, `quit`) | `main.cjs` | Ciclo de vida |
| `BrowserWindow` | `main.cjs` | Janela única |
| `webContents.setWindowOpenHandler` | `main.cjs` | Interceptar links |
| `shell.openExternal` | `main.cjs` | Abrir links no navegador do sistema |

- **Sem** `ipcMain` / `ipcRenderer` / `contextBridge` — não há canal de comunicação main↔renderer em runtime.

## Autenticação de API

**Não aplicável** (não há API). Ver `docs/business-rules.md` para o único uso de segredo (secret do HS256 no gerador de JWT, que nunca sai da máquina).
