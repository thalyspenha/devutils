# Integrações externas

## Resumo

O aplicativo é **offline-first**. Não há integração com serviços de terceiros, APIs remotas, bancos, brokers de mensagem, provedores de identidade, gateways de pagamento ou SDKs de nuvem.

## Requisições de rede

| Origem | Destino | Quando | Observação |
|---|---|---|---|
| `app/src/index.css` linha 1 | `https://fonts.googleapis.com` (+ `fonts.gstatic.com`) | No carregamento da UI | `@import` da fonte **Inter**. Única requisição de rede que o app dispara por conta própria. Se offline, cai para a stack de fallback (`-apple-system`, `Segoe UI`, `Roboto`, …). |
| `main.cjs` → `shell.openExternal(url)` | Navegador do sistema | Quando o usuário clica em um link que tentaria abrir nova janela | O app não faz a requisição; delega ao SO. Não há links externos nos componentes atuais, então na prática isso raramente dispara. |

Nenhum componente usa `fetch`, `XMLHttpRequest`, WebSocket ou `axios`.

## Integrações com o sistema operacional

| Recurso | API | Uso |
|---|---|---|
| Área de transferência (leitura) | `navigator.clipboard.readText()` | `useClipboardData` auto-preenche inputs |
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
