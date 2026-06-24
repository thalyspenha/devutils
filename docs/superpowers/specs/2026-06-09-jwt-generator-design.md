# JWT Generator — Design Spec
**Date:** 2026-06-09  
**Status:** Approved

## Overview

Adiciona geração de JWT à ferramenta `/jwt` existente. A rota permanece a mesma; o componente ganha duas abas: **Decodificar** (código existente inalterado) e **Gerar** (novo).

## Escopo

**In scope:**
- Tab "Gerar" com algoritmo HS256 (HMAC-SHA256)
- Payload editável (textarea JSON)
- Campo secret (string)
- Output readonly com botão Copiar
- Payload padrão com `sub`, `iat`, `exp` ao montar

**Out of scope:**
- RS256 / RS384 / RS512
- Expiração automática / validação de claims
- Persistência de payloads anteriores

## Arquitetura

### Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `app/src/components/JwtDecoderTool.tsx` | Renomeia export para `JwtTool`; adiciona estado `activeTab`; implementa aba Gerar com lógica HS256 |
| `app/src/App.tsx` | Atualiza import: `JwtDecoderTool` → `JwtTool` |
| `app/src/components/Sidebar.tsx` | Atualiza label do item `/jwt` para `JWT Tool` |

### Nenhuma dependência nova
`crypto-js` (já instalado) fornece `CryptoJS.HmacSHA256`.

## Implementação HS256

```
header  = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))
payload = base64url(JSON.stringify(userPayload))
sig     = base64url(CryptoJS.HmacSHA256(header + "." + payload, secret))
token   = header + "." + payload + "." + sig
```

`base64url` = `btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')`

## Estado do componente

```typescript
activeTab: 'decode' | 'generate'

// aba decode (existente, inalterado)
input: string
header: string
payload: string
error: string | null

// aba generate (novo)
payloadText: string
secret: string
generatedToken: string
genError: string | null
```

## Payload padrão

```json
{
  "sub": "1234567890",
  "iat": <unix timestamp agora>,
  "exp": <unix timestamp agora + 3600>
}
```

Calculado em runtime no `useState` inicial.

## Validação

- `payloadText` deve ser JSON válido → erro inline com `AlertCircle` se não for
- `secret` pode ser vazio (JWT válido com secret vazio é tecnicamente permitido)
- Geração dispara no clique do botão, não reativa

## UI Layout

```
[ Decodificar ]  [ Gerar ]

─── aba Gerar ───────────────────
Payload (JSON)
┌──────────────────────────────┐
│ { "sub": "...", ...         }│
└──────────────────────────────┘

Secret
┌──────────────────────────────┐
│ your-256-bit-secret          │
└──────────────────────────────┘

[ Gerar JWT ]

JWT Gerado
┌──────────────────────────────┐
│ eyJhbGc...          [Copiar] │
└──────────────────────────────┘
```

Estilo: `glass-panel` + CSS vars do projeto (`--text-primary`, `--border-color`, etc.), sem CSS novo.

## Critérios de aceitação

1. Tab "Decodificar" funciona exatamente igual ao atual
2. Tab "Gerar" produz JWT válido verificável em jwt.io
3. JSON inválido no payload mostra erro, não gera token
4. Botão Copiar copia o token para clipboard
5. Sidebar mostra "JWT Tool" como label
