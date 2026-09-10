# Banco de dados

## Resumo

**Não aplicável.** O projeto **não possui banco de dados** de nenhum tipo.

Evidências no código:

- Nenhuma dependência de banco/ORM/driver em `app/package.json` (sem `pg`, `mysql`, `sqlite`, `better-sqlite3`, `prisma`, `typeorm`, `sequelize`, `mongoose`, `knex`, `drizzle`, etc.).
- Nenhum arquivo de schema, migration, seed ou `.sql` no repositório.
- Nenhuma string de conexão, variável de ambiente de DB ou arquivo `.env`.
- O processo Electron (`app/main.cjs`) não abre nenhum recurso de armazenamento.

## Persistência de dados

**Nenhuma.** O estado das ferramentas vive apenas em memória (`useState` do React) enquanto a janela está aberta e é perdido ao fechar/navegar.

- **Sem** `localStorage` / `sessionStorage` / `IndexedDB` — nenhum componente lê ou grava esses stores (verificado por busca no código).
- **Sem** arquivos de configuração de usuário gravados em disco.
- **Sem** cache persistente da aplicação.

O único dado externo que entra no app é o **conteúdo do clipboard do sistema**, lido em tempo de execução por `useClipboardData` (`navigator.clipboard.readText()`) e nunca gravado em lugar nenhum.

## Entidades

**Não identificado / inexistente.** Não há entidades de domínio persistidas.

As únicas "estruturas de dados" relevantes são objetos de UI em memória, por exemplo:

| Estrutura | Onde | Forma |
|---|---|---|
| `TOOLS[]` | `Sidebar.tsx` | `{ id: string, name: string, icon: Component, path: string }` (array estático, 15 itens) |
| `DIALECTS[]` | `SqlFormatterTool.tsx` | `{ value: Dialect, label: string }` |
| `ESCAPE_MAP` / `UNESCAPE_MAP` | `BackslashEscapeTool.tsx` | `Record<string, string>` |
| `dateOutput` | `UnixTimeConverterTool.tsx` | `{ local: string, utc: string } | null` |

## Relacionamentos

**Não aplicável** — não há entidades nem armazenamento.

## Migrações

**Não aplicável.**
