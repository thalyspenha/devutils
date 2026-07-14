# SQL Query Formatter — Design Spec
**Date:** 2026-07-14
**Status:** Approved

## Overview

Nova ferramenta de formatação de queries SQL. Adiciona rota `/sql`, componente `SqlFormatterTool`, item novo no Sidebar. Usa a lib `sql-formatter` (npm) para indentar/quebrar linhas de queries SQL/MySQL/PostgreSQL/MariaDB.

## Escopo

**In scope:**
- Formatação de SQL com dropdown de dialeto: SQL genérico, MySQL, PostgreSQL, MariaDB
- Layout em duas colunas: input (textarea editável) → output (textarea read-only)
- Botão "Colar" no input (usa `useClipboardData`, mesmo padrão de outras tools)
- Botão "Copiar" no output
- Formatação automática (on-change, sem botão "Formatar" explícito)
- Indentação fixa de 2 espaços, keywords em uppercase (sem toggle na UI)
- Mensagem de erro inline se `sql-formatter` lançar exceção, mantendo input intacto

**Out of scope:**
- Formatação de queries MongoDB (formato JS/objeto, muito diferente de SQL — merece design próprio depois)
- Configuração de indent size / keyword case na UI
- Validação semântica de SQL (só formatação sintática, delegada à lib)
- Highlight de sintaxe colorido

## Arquitetura

### Dependência nova

`sql-formatter` — pacote npm puro JS, sem deps nativas, suporta múltiplos dialects via `language` option. Segue o padrão já usado no projeto de trazer libs prontas para tarefas complexas (`crypto-js`, `node-forge`, `cronstrue`).

```bash
npm install sql-formatter
```

### Arquivos

| Arquivo | Mudança |
|---|---|
| `app/src/components/SqlFormatterTool.tsx` | Novo componente |
| `app/src/App.tsx` | Importa `SqlFormatterTool`, adiciona `<Route path="/sql" element={<SqlFormatterTool />} />` |
| `app/src/components/Sidebar.tsx` | Adiciona item ao array `TOOLS[]` (rota `/sql`, label "Formatar SQL") |
| `app/package.json` | Nova dependência `sql-formatter` |

## Implementação

```typescript
import { format } from 'sql-formatter';

format(input, {
  language: dialect, // 'sql' | 'mysql' | 'postgresql' | 'mariadb'
  tabWidth: 2,
  keywordCase: 'upper',
});
```

Dialetos expostos no dropdown mapeiam 1:1 para o parâmetro `language` da lib.

## Estado do componente

```typescript
input: string
dialect: 'sql' | 'mysql' | 'postgresql' | 'mariadb'  // default 'sql'
output: string
error: string | null
```

Formatação roda em `useEffect` (ou direto no `onChange`) sempre que `input` ou `dialect` mudam. Try/catch em volta de `format()`: sucesso → seta `output` e limpa `error`; exceção → seta `error` e mantém o último `output` válido exibido (não limpa o painel de output).

## UI Layout

```
Formatar SQL
Formata queries SQL com indentação e quebra de linha.

Dialeto: [ SQL ▾ ]

┌─ Input ──────────────┐  ┌─ Output ──────────────┐
│ select * from users  │  │ SELECT                │
│ where id=1           │  │   *                    │
│                       │  │ FROM                   │
│ [Colar]               │  │   users                │
│                       │  │ WHERE                  │
│                       │  │   id = 1               │
│                       │  │              [Copiar]  │
└───────────────────────┘  └────────────────────────┘

(erro, se houver, aparece abaixo do output em --error-color)
```

Estilo: `glass-panel` + CSS vars do projeto, sem CSS novo. Segue padrão de componente do `CLAUDE.md` (`tool-header` + `tool-body`).

## Critérios de aceitação

1. Colar SQL cru na esquerda formata automaticamente na direita, sem clique em botão
2. Trocar o dialeto reformata o SQL já digitado
3. SQL malformado mostra erro sem quebrar a UI nem apagar o input
4. Botão "Copiar" copia o conteúdo formatado
5. Item "Formatar SQL" aparece no Sidebar e navega para `/sql`
