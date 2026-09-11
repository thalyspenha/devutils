# Regras de negócio

> "Negócio" aqui = comportamento funcional de cada ferramenta, incluindo heurísticas e limites codificados. Tudo abaixo foi extraído diretamente dos componentes em `app/src/components/`.

## Regras transversais

- **Processamento 100% local.** Nenhum dado inserido nas ferramentas é enviado para fora da máquina. Não há telemetria, analytics ou logging remoto. O app não faz nenhuma requisição de rede (a fonte Inter é empacotada — ver `docs/integrations.md`).
- **Colar do clipboard sob demanda.** Ferramentas que usam `useClipboardData` têm um botão "Colar da área de transferência" — o clipboard só é lido quando o usuário clica nele, nunca automaticamente no mount.
- **Formatação "ao vivo".** A maioria das ferramentas recalcula o output a cada tecla (derivado com `useMemo`), sem botão "processar". Exceções com ação explícita: `UuidGenerator` ("Gerar"), `PasswordGenerator` ("Gerar Outra Senha"), `RsaGenerator` ("Gerar Chaves"), `JwtDecoder` aba Gerar ("Gerar JWT"), `UnixTime` timestamp→data ("Convert").
- **Erros não destroem o input.** Entrada inválida mostra mensagem de erro e zera o output, mas mantém o que o usuário digitou.
- **Tema dark fixo.** Não há troca de tema.
- **Textos de UI majoritariamente PT-BR.** Descrições, labels, botões, placeholders e mensagens de erro/estado são PT-BR nas 15 tools; só os **títulos** (`<h2>`) continuam em inglês, para bater com o nome em `TOOLS[]`/Sidebar (ex.: "JSON Formatter", "RegExp Tester") — ver `docs/decisions.md`.

## JSON Formatter (`/`)

- Válido → `JSON.stringify(JSON.parse(input), null, 2)` (indent de 2 espaços).
- **Correção automática de backslash**: se o `JSON.parse` falhar, tenta uma vez trocar `\` não seguido de `["\/bfnrtu]` por `\\` (caso de paths Windows tipo `C:\Users\...`) e reparsear. Só então considera inválido.
- Botão "Colar" cola o conteúdo do clipboard no input sem filtro; a validação de JSON acontece depois, como qualquer outra entrada.
- Status visual: "Aguardando entrada..." / "JSON válido" / "JSON inválido".

## Base64 (`/base64`)

- Encode: `btoa(unescape(encodeURIComponent(text)))` (suporta UTF-8).
- Decode: `decodeURIComponent(escape(atob(text)))`.
- Entrada inválida para o modo atual → erro "Entrada inválida para codificação/decodificação".
- Auto-detecção: ao clicar em "Colar", se o texto casar com a regex de Base64 (`^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$`), muda automaticamente para o modo **decode**.
- Botão de swap: troca input↔output **e** inverte o modo.

## JWT Tool (`/jwt`)

### Aba Decodificar

- Exige exatamente **3 partes** separadas por `.`; caso contrário: "Invalid JWT format".
- Decodifica header e payload como **base64url** (`-`→`+`, `_`→`/`, padding `=` reposto) e formata como JSON identado.
- **Verificação de assinatura é opcional**, via campo "Secret" (em branco por padrão): sem secret, o status mostra "Decodificado — assinatura não verificada"; com secret e `alg: HS256` no header, recalcula `HmacSHA256(header.payload, secret)` e compara com a 3ª parte — mostra "Assinatura válida" ou "Assinatura inválida"; para outros algoritmos (`RS256` etc.), mostra "Verificação só suportada para HS256". Não valida `exp`/`nbf` em nenhum caso.
- Botão "Colar" cola o conteúdo do clipboard sem filtro (a validação de 3 partes acontece depois, na decodificação).

### Aba Gerar

- Algoritmo fixo: **HS256** (`CryptoJS.HmacSHA256`).
- Header fixo: `{"alg":"HS256","typ":"JWT"}`.
- Payload padrão gerado no mount: `{ sub: "1234567890", iat: <agora>, exp: <agora + 3600s> }`.
- Secret default: `your-256-bit-secret` (editável; string vazia é permitida).
- Payload precisa ser **JSON válido**; senão: "Payload inválido: JSON mal formatado." e não gera token.
- Token = `base64url(header).base64url(payload).base64url(HMAC-SHA256)`.

## Unix Time Converter (`/unix-time`)

- Relógio ao vivo em segundos, atualizado a cada 1s.
- **Timestamp → data**: heurística — valor `> 1e12` é tratado como **milissegundos**, senão como **segundos**. Saída: horário local (`toLocaleString`) e UTC (`toUTCString`). Valor fora de faixa → "Valor de timestamp fora do intervalo válido."
- Entrada não numérica → "Formato de número inválido."
- **Data → timestamp**: `datetime-local` interpretado como **horário local**; saída em **segundos** (`Math.floor(ms/1000)`). Reativo (sem botão), derivado com `useMemo`. Valor inicial do campo = agora em horário local.

## RegExp Tester (`/regexp`)

- `new RegExp(pattern, flags)`; flag default `g`. Regex inválida → mensagem de erro do runtime.
- Com flag `g`: itera todos os matches; **protege contra loop infinito** em matches de largura zero incrementando `lastIndex` manualmente.
- Destaca os matches no texto de teste.
- Painel "Match Details": mostra índice, texto do match e capture groups; **exibe no máximo os primeiros 50 matches** (o restante é contabilizado, não listado).

## Cron Parser (`/cron`)

- Traduz a expressão via `cronstrue` com `locale: 'pt_BR'`.
- Expressão default: `0 0 * * *`.
- Cálculo síncrono no render; expressão inválida → mensagem de erro da lib.
- Lista de exemplos fixa (a cada minuto / hora / dia à meia-noite / domingo à meia-noite).

## QR Code Generator (`/qrcode`)

- Renderiza `QRCodeSVG` com **nível de correção de erro `L`** (baixo), `marginSize={0}` (prop atual do `qrcode.react` v4).
- Texto default: `https://example.com`. Se o texto ficar vazio, usa `' '` (espaço) para não quebrar.
- Tamanho: **128–512 px**, step 16 (default 256).
- Cores de código e de fundo configuráveis.
- Download em dois formatos: **SVG** (serializa o `<svg>` visível, baixa como `qrcode.svg`) e **PNG** (`QRCodeCanvas` oculto, renderizado com os mesmos props, exportado via `canvas.toDataURL('image/png')` como `qrcode.png`).

## UUID Generator (`/uuid`)

- Gera **UUID v4** com `crypto.randomUUID()`.
- Quantidade: campo aceita **1–1000** (não numéricos são removidos; vazio vira 1). Não há verificação de teto no loop além do que o campo permite digitar.
- Opções pós-processam cada UUID: maiúsculas e/ou remoção de hífens.
- "Copiar Todos" junta os UUIDs com `\n`.
- No mount já exibe 1 UUID.

## Password Generator (`/password`)

- Aleatoriedade criptográfica: `window.crypto.getRandomValues(Uint32Array(length))`, cada caractere = `charset[valor % charset.length]`.
  - **Nota**: o operador módulo introduz leve viés de distribuição quando `charset.length` não divide `2^32`.
- Tamanho: **4–64** (default 16).
- Conjuntos: minúsculas `a-z`, maiúsculas `A-Z`, números `0-9`, símbolos `!@#$%^&*()_+~`|}{[]:;?><,./-=`.
- Se **nenhum** conjunto estiver marcado → senha vazia.
- Regenera automaticamente ao mudar qualquer opção; botão "Gerar Outra Senha" força nova geração.

## Hash Generator (`/hash`)

- Calcula simultaneamente **MD5, SHA-1, SHA-256, SHA-512** via `crypto-js`, saída hex.
- Reativo ao input (`useMemo`). Input vazio → todos os campos vazios.
- Botão "Copiar" por algoritmo.

## RSA Key Pair Generator (`/rsa`)

- `window.crypto.subtle.generateKey` com `name: 'RSA-OAEP'`, `hash: 'SHA-256'`, `publicExponent: 65537`.
- Usos da chave: `['encrypt', 'decrypt']` — **não** serve para assinatura/verificação.
- Tamanhos: **2048 (padrão) / 4096 (lento)**. Opção de 1024 bits (insegura) foi removida.
- Export: `spki` (pública) e `pkcs8` (privada) → PEM montado manualmente (base64 quebrado em linhas de 64).
- Delay artificial de 50ms antes de gerar, para a UI conseguir mostrar "Gerando...".
- Erro → mensagem inline (`var(--error-color)`, padrão do resto do app), não mais `alert()`.
- Descrição na UI enfatiza uso **temporário/para testes** e deixa explícito que as chaves são para criptografar/descriptografar (`RSA-OAEP`), não para assinatura.

## Text Diff (`/diff`)

- `Diff.diffLines(original, modified)` — comparação **por linha**.
- Verde/`+` = adicionado, vermelho/`-` = removido, neutro = contexto.
- Ambos vazios → "Nenhuma diferença para mostrar."

## Case Converter (`/case`)

- Tokenização: insere espaço entre `minúscula→Maiúscula`, divide por espaço/`_`/`-`, descarta vazios, minúscula tudo.
- Alvos: `camelCase`, `PascalCase`, `snake_case`, `kebab-case`, `CONSTANT_CASE`, `UPPERCASE`, `lowercase`.
- Campo de **Resultado separado e read-only** — clicar num formato só atualiza `activeCase`; o input digitado nunca é sobrescrito, então trocar de formato repetidamente não perde informação.
- Input só de espaços em branco (ou nenhum formato escolhido ainda) → resultado vazio.

## Backslash Escape / Unescape (`/backslash`)

- Sequências suportadas: `\\`, `\n`, `\r`, `\t`, `\0`, `\"`, `\'`, `\b`, `\f`, `\v`.
- Escape: regex sobre os caracteres reais → sequência textual.
- Unescape: regex sobre `\\(\\|n|r|t|0|"|'|b|f|v)` → caractere real.
- Swap: troca input↔output e inverte o modo.

## SQL Formatter (`/sql`)

- `format(input, { language: dialect, tabWidth: 2, keywordCase: 'upper' })` da lib `sql-formatter`.
- Dialetos: `sql` (genérico, default), `mysql`, `postgresql`, `mariadb` — mapeiam 1:1 para a opção `language`.
- Indentação (2 espaços) e keywords em maiúsculo são **fixos** (não expostos na UI).
- Trocar o dialeto reformata o SQL já digitado.
- Em erro de parse: exibe **apenas a primeira linha** da mensagem de erro (`message.split('\n')[0]`) — decisão registrada no commit `874267f` para não despejar a gramática inteira. O painel de output passa a mostrar o erro (não mantém mais o último SQL formatado).

## O que não foi identificado

- **Regras de autorização, limites de uso, cobrança, quotas**: não existem.
- **Validações de domínio de negócio** além das heurísticas acima: Não identificado.
