# Integrações externas

## Resumo

O aplicativo é **offline-first**. Não há integração com serviços de terceiros, APIs remotas, bancos, brokers de mensagem, provedores de identidade, gateways de pagamento ou SDKs de nuvem.

## Requisições de rede

**O app não dispara nenhuma requisição de rede por conta própria.** A fonte Inter é empacotada localmente via `@fontsource/inter` (subset `latin`, pesos 400–700, importada em `src/main.tsx`) — os `.woff2` vão no bundle. Antes havia um `@import` de `fonts.googleapis.com` no `index.css`; foi removido.

| Origem | Destino | Quando | Observação |
|---|---|---|---|
| `main.cjs` → `shell.openExternal(url)` | Navegador do sistema | Quando o usuário clica em um link que tentaria abrir nova janela | O app não faz a requisição; delega ao SO. Não há links externos nos componentes atuais, então na prática isso raramente dispara. |

Nenhum componente usa `fetch`, `XMLHttpRequest`, WebSocket ou `axios`.

## Integrações com o sistema operacional

| Recurso | API | Uso |
|---|---|---|
| Área de transferência (leitura) | `navigator.clipboard.readText()` | `useClipboardData(onData)` — lê o clipboard uma vez após o mount e entrega via callback; as tools auto-preenchem o input se estiver vazio |
| Área de transferência (escrita) | `navigator.clipboard.writeText()` | Botões "Copiar" |
| Navegador padrão | Electron `shell.openExternal` | Abrir links fora da janela |
| Download de arquivo | `<a download>` + `Blob` | Salvar QR Code como SVG (`QrCodeGeneratorTool`) |
| Gerador de aleatoriedade do SO | Web Crypto (`crypto.getRandomValues`, `crypto.subtle`, `crypto.randomUUID`) | Senha, RSA, UUID |

## Bibliotecas que substituem integrações

Em vez de chamar serviços, o app embute bibliotecas que fazem o trabalho localmente:

| Necessidade | Biblioteca | Ferramenta |
|---|---|---|
| Tradução de cron para linguagem natural | `cronstrue` | Cron Parser |
| Formatação de SQL | `sql-formatter` | SQL Formatter |
| Hash / HMAC | `crypto-js` | Hash Generator, JWT (gerar) |
| Diff de texto | `diff` | Text Diff |
| Geração de QR Code | `qrcode.react` | QR Code Generator |

## Autenticação de terceiros / SSO / OAuth

**Não identificado / inexistente.**

## Webhooks, filas externas, eventos

**Não identificado / inexistente.**

## Serviços de observabilidade (APM, Sentry, analytics)

**Não identificado / inexistente.** Não há Sentry, Datadog, Google Analytics, PostHog, etc. Logs vão apenas para o console do DevTools (`console.warn` / `console.error` em alguns pontos).
