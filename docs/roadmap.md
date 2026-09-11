# Roadmap / Backlog

> Lista priorizada de melhorias e ideias. **Não é compromisso com datas** — é de onde puxar a próxima coisa.
> Origem: revisão do código em 2026-09-10 (após a branch `fix/build-lint-green`, que destravou `lint`/`build`, empacotou o electron-builder e deixou a fonte offline).

## Como usar

- 3 fases sugeridas, na ordem: **UX/robustez → qualidade/infra → ferramentas novas**. A Fase 2 (testes + CI) faz a Fase 3 ficar barata e segura.
- Cada item tem: **O quê** · **Por quê** · **Esforço** (P = <½ dia, M = 1–2 dias, G = maior) · **Toca em** · **Pronto quando**.
- Respeitar sempre as restrições do `CLAUDE.md`: sem backend/rede/persistência remota, sem Tailwind/CSS-in-JS/state global, manter `HashRouter`, strings novas em PT-BR, `useMemo` para derivação.

---

## Fase 1 — Base de UX e robustez

### 1.1 Command palette (Ctrl/Cmd+K) · P–M · ✅ feito
- **O quê:** overlay de busca fuzzy sobre `TOOLS[]`; Enter navega. Fecha no Esc / clique fora.
- **Por quê:** com 15+ ferramentas, achar a tool na sidebar é o gargalo. Maior impacto de UX do projeto.
- **Entregue:** `src/tools.ts` (array `TOOLS` extraído, consumido por `Sidebar` + palette), `src/components/CommandPalette.tsx` (listener global, match fuzzy inline, `useMemo`, navegação `↑`/`↓`/`Enter`/`Esc`, clique fora), montado em `App.tsx` dentro do `HashRouter`, estilos `.command-palette-*` em `index.css`.
- **Follow-ups opcionais:** `scrollIntoView` do item selecionado em listas longas; hint visual do atalho na sidebar.

### 1.2 Persistência leve por ferramenta · P
- **O quê:** salvar em `localStorage` o último input de cada tool e a última rota aberta; restaurar no mount / no boot.
- **Por quê:** reabrir o app onde parou. Continua 100% local (nada sai da máquina).
- **Toca em:** novo hook `src/hooks/usePersistentState.ts` (wrapper de `useState` + `localStorage`), adotado nas tools; `App.tsx` para a última rota.
- **Cuidado:** não persistir campos sensíveis por padrão (secret do JWT, chave privada RSA, senha gerada). Opt-out explícito nesses.
- **Pronto quando:** fechar e reabrir mantém input e tool; limpar o campo limpa o storage.

### 1.3 Error boundary global · P · ✅ feito
- **O quê:** `<ErrorBoundary>` em volta das `<Routes>` com tela de "essa ferramenta quebrou" + botão de reset.
- **Por quê:** hoje um `throw` em qualquer componente apaga o app inteiro (tela branca, sem recuperação).
- **Entregue:** `src/components/ErrorBoundary.tsx` (class component, `getDerivedStateFromError`, reseta ao mudar `resetKey`); `App.tsx` envolve as rotas com `<ErrorBoundary resetKey={location.pathname}>` no wrapper `ToolRoutes`; estilos `.error-boundary` em `index.css`. Reseta sozinho ao navegar + botão "Tentar de novo".

### 1.4 Feedback de "copiado" · P · ✅ feito
- **O quê:** feedback curto ("Copiado!") ao clicar nos botões de copiar.
- **Por quê:** todos os `navigator.clipboard.writeText` eram silenciosos — o usuário não sabia se funcionou.
- **Entregue:** `src/hooks/useCopy.ts` (`{ copy, copiedKey, copied }`, timeout 1.5s, suporta várias `key` por tela); adotado nos 10 componentes com botão de copiar. Botão de texto troca para "Copiado!" (verde nos `.secondary`); botão de ícone troca `<Copy>` por `<Check>` verde. Sem toast/portal novo.

### 1.5 Consistência de idioma e identidade · P
- **O quê:** padronizar a UI em PT-BR (hoje JSON/Base64/RegExp/Unix/Backslash estão em inglês); unificar o nome: `<title>` = "Devtools", sidebar = "DevUtils Linux", `productName` = "DevUtils".
- **Por quê:** `CLAUDE.md` já manda PT-BR; a inconsistência de nome aparece em 4 lugares (ver `docs/decisions.md`).
- **Toca em:** todos os `*Tool.tsx` (títulos/descrições/placeholders), `index.html`, `Sidebar.tsx`.

---

## Fase 2 — Qualidade e infraestrutura

### 2.1 Testes com Vitest nas funções puras · M
- **O quê:** `vitest` + testes de unidade nas partes com lógica não-trivial:
  - `CaseConverterTool` — `getWords`/`toCamelCase`/… (tokenização é frágil)
  - `BackslashEscapeTool` — `escape`/`unescape` (round-trip)
  - `JwtDecoderTool` — `encodeBase64Url`/`decodeBase64Url`, assinatura HS256
  - `UnixTimeConverterTool` — heurística ms vs s (`> 1e12`)
  - `RegExpTesterTool` — guarda contra match zero-width
- **Por quê:** essa lógica é onde moram os bugs sutis e hoje não há rede de segurança nenhuma.
- **Toca em:** `app/package.json` (dep + script `test`), `vitest.config.ts`, `*.test.ts` ao lado dos componentes. Idealmente extrair as funções puras para fora do componente para testar sem React.
- **Pronto quando:** `npm test` roda no CI; cobre os 5 itens acima.

### 2.2 CI no GitHub Actions · P
- **O quê:** workflow que roda `npm ci && npm run lint && npm run build && npm test` em PR; e `npm run dist` + upload da AppImage em push de tag `v*`.
- **Por quê:** hoje nada valida uma mudança antes do merge (ver `docs/infrastructure.md` — "CI/CD: não existe").
- **Toca em:** `.github/workflows/ci.yml`. Runner `ubuntu-latest`, Node 24 (casar com `engines.node` em `app/package.json`).

### 2.3 Limpeza de dependências mortas · P · ✅ parcialmente feito
- **O quê:** remover `node-forge`, `@types/node-forge`, `@types/qrcode.react` (v4 traz tipos), avaliar `@types/diff`; apagar `app/test-forge.js`.
- **Por quê:** resíduo da abordagem antiga de RSA (ver `docs/decisions.md` D7); ruído no `package.json`.
- **Entregue:** `node-forge`, `@types/node-forge` removidos de `app/package.json`/`package-lock.json`; `app/test-forge.js` apagado.
- **Falta:** avaliar/remover `@types/qrcode.react` (tipos da v1 para lib na v4) e `@types/diff` (possível redundância).

### 2.4 Endurecer a segurança do Electron · M
- **O quê:** `contextIsolation: true` + `nodeIntegration: false` + `contextBridge` no `preload.cjs` expondo só o necessário (hoje: nada); adicionar `<meta http-equiv="Content-Security-Policy">` no `index.html`.
- **Por quê:** é a maior dívida de segurança do projeto (`docs/decisions.md` D3). Como nenhum componente usa API de Node hoje, a migração é de baixo risco.
- **Toca em:** `main.cjs`, `preload.cjs`, `index.html`. Revisar se algum componente quebra (não deve).

### 2.5 Code-split das rotas · P
- **O quê:** `React.lazy` + `<Suspense>` por rota em `App.tsx`.
- **Por quê:** bundle único de ~825 KB; cada tool vira um chunk sob demanda.
- **Toca em:** `App.tsx`.

### 2.6 Extrair o "shell de ferramenta" e reduzir estilo inline · M
- **O quê:** um `<ToolLayout title description>` + componentes de painel (`<PanelInput>`, `<PanelOutput>`) que hoje são copiados em quase todo `*Tool.tsx`; mover o `style={{}}` repetido para classes em `index.css`.
- **Por quê:** manutenção — mudar o visual de um painel hoje é editar 15 arquivos. Muito `inline-style soup`.
- **Cuidado:** manter o padrão `.tool-header` + `.tool-body`; sem lib nova.

### 2.7 Ícone e metadados do pacote · P
- **O quê:** já existe `app/build/icon.png`; falta `.desktop` decente / `synopsis` / `maintainer` no bloco `build`; avaliar targets além de AppImage (`deb`).
- **Toca em:** `app/package.json` (`build.linux`).

---

## Fase 3 — Ferramentas novas

Cada uma segue o padrão de 3 pontos do `CLAUDE.md` (componente + rota + item no `TOOLS[]`). Ordenadas por utilidade percebida.

| Ferramenta | Rota | Lib sugerida | Nota |
|---|---|---|---|
| Conversor JSON ↔ YAML ↔ TOML | `/convert` | `yaml`, `smol-toml` | Bidirecional; erro na 1ª linha (padrão D12) |
| Cores: hex/rgb/hsl + contraste WCAG | `/color` | — (cálculo puro) | Mostra ratio AA/AAA |
| URL parser / query string | `/url` | — (`URL`, `URLSearchParams`) | Decodifica cada parâmetro |
| Conversor de base numérica + bitwise | `/base` | — | bin/oct/dec/hex, operações AND/OR/XOR/shift |
| JSONPath / mini-jq playground | `/jsonpath` | `jsonpath-plus` | Sobre um JSON colado |
| Decoder de PEM / certificado X.509 | `/cert` | `@peculiar/x509` | Validade, SAN, issuer — complementa RSA/JWT |
| Ferramentas de linha | `/lines` | — | Ordenar, deduplicar, contar, numerar, reverter, `trim` |
| `.env` ↔ JSON | `/dotenv` | — | Parser simples |
| Slugify | `/slug` | — | Reusa a tokenização do CaseConverter |
| HTML entities encode/decode | `/html-entities` | — | |
| Calculadora de chmod / permissões Unix | `/chmod` | — | rwx ↔ octal, checkboxes |
| Lorem ipsum / dados fake | `/lorem` | `@faker-js/faker` (grande — avaliar) | |
| ULID / nanoid (junto do UUID) | — | `ulid`, `nanoid` | Estender `UuidGeneratorTool` |

---

## Correções pontuais conhecidas (dívida técnica)

Levantadas na revisão; não bloqueiam nada mas valem um PR de "faxina":

- **RSA (`/rsa`):** ainda oferece **1024 bits** (inseguro); as chaves são `RSA-OAEP` uso `encrypt`/`decrypt` — não servem para assinatura. Ao menos tirar o 1024 e explicar o uso na UI. Erros via `alert()` (fora do padrão inline).
- **JWT decode:** mostra "Valid JWT" só checando que há 3 partes — **não verifica assinatura**. Renomear o rótulo para "Decodificado" ou adicionar verificação opcional com secret.
- **CaseConverter (`/case`):** sobrescreve o próprio input (destrutivo, sem campo de saída separado). Converter duas vezes perde informação.
- ~~**UuidGenerator (`/uuid`):** `count` não tem clamp real...~~ **Corrigido** — `onChange` agora faz `Math.min(Math.max(raw, 1), 1000)`; o `max="1000"` do HTML sozinho não impedia digitar valores maiores.
- ~~**`react-router-dom`:** `npm audit` aponta 2 CVEs high...~~ **Corrigido** — atualizado `^7.13.1` → `^7.18.3` (instalado `7.18.3`); zero avisos de `react-router`/`react-router-dom` no `npm audit`.
- **QrCode (`/qrcode`):** prop `includeMargin` foi trocada por `marginSize` no `qrcode.react` v4 (a antiga é ignorada); export só em SVG — adicionar PNG seria útil.
- ~~**`<title>Devtools</title>`** no `index.html`~~ **Corrigido** — `<title>` agora é `DevUtils`, consistente com `productName` do electron-builder. A Sidebar ainda mostra "DevUtils Linux" — unificar esse rótulo continua no item 1.5.
- ~~**`useClipboardData`:** lê o clipboard automaticamente em toda montagem de tool...~~ **Corrigido** — hook reescrito para expor um `paste()` sob demanda; cada tool ganhou um botão "Colar da área de transferência" (ícone `ClipboardPaste`) e o clipboard não é mais lido sozinho no mount.

---

## Fora de escopo (por design — não fazer)

- Backend, chamadas de rede de negócio, banco, persistência remota, telemetria/analytics.
- Tailwind, CSS-in-JS, biblioteca de estado global (Redux/Zustand/…).
- Trocar `HashRouter` por `BrowserRouter` (quebra sob `file://`).
- Depender de `nodeIntegration` para expor APIs novas sem revisar segurança antes.
