# SQL Query Formatter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adiciona uma ferramenta de formatação de queries SQL (`/sql`) ao devutils, com suporte a dialetos SQL genérico/MySQL/PostgreSQL/MariaDB.

**Architecture:** Componente React único (`SqlFormatterTool.tsx`) seguindo o padrão de duas colunas já usado em `Base64Tool.tsx` (input editável à esquerda, output read-only à direita), com um `<select>` de dialeto acima (padrão de `RsaGeneratorTool.tsx`). A formatação em si é delegada à lib `sql-formatter`, chamada em um `useEffect` que reage a mudanças de `input`/`dialect`.

**Tech Stack:** React 19 + TypeScript, `sql-formatter` (nova dependência), `lucide-react` (ícones), hook local `useClipboardData`.

## Global Constraints

- Sem Tailwind — só CSS vars (`var(--text-primary)`, `var(--text-secondary)`, `var(--border-color)`, `var(--app-bg)`, `var(--error-color)`) e classes utilitárias já existentes (`glass-panel`, `flex`, `flex-col`, `flex-1`, `gap-4`, `items-center`, `justify-between`, `secondary`).
- Sem testes automatizados no projeto (`CLAUDE.md`) — verificação de cada task é manual, via `npm run dev` + `npm run lint`, não via test runner.
- Textos de UI em PT-BR.
- Export nomeado (não default) no componente, igual às outras tools.
- Não criar hook novo nem abstração nova — lógica inline no componente, igual ao padrão do projeto.
- Paste de clipboard segue o padrão real já usado em `Base64Tool.tsx`/`JsonFormatterTool.tsx`: auto-preenche `input` no mount via `useClipboardData()` se o clipboard tiver conteúdo e o input estiver vazio — **não** é um botão "Colar" explícito (nenhuma tool do projeto tem esse botão hoje).

---

### Task 1: Instalar `sql-formatter` e criar `SqlFormatterTool.tsx`

**Files:**
- Modify: `app/package.json` (nova dependência, via `npm install`)
- Create: `app/src/components/SqlFormatterTool.tsx`

**Interfaces:**
- Produces: `export function SqlFormatterTool()` — componente React sem props, consumido pelo `App.tsx` na Task 2.

- [ ] **Step 1: Instalar a dependência**

Run: `cd app && npm install sql-formatter`

Expected: `package.json` ganha `"sql-formatter": "^15.8.2"` (ou versão mais recente compatível) em `dependencies`; `package-lock.json` atualizado.

- [ ] **Step 2: Verificar a instalação**

Run: `grep sql-formatter app/package.json`

Expected: uma linha tipo `"sql-formatter": "^15.8.2",`

- [ ] **Step 3: Criar o componente `SqlFormatterTool.tsx`**

Criar `app/src/components/SqlFormatterTool.tsx` com o conteúdo exato abaixo:

```tsx
import { useState, useEffect } from 'react';
import { Copy, Trash2 } from 'lucide-react';
import { format } from 'sql-formatter';
import { useClipboardData } from '../hooks/useClipboardData';

type Dialect = 'sql' | 'mysql' | 'postgresql' | 'mariadb';

const DIALECTS: { value: Dialect; label: string }[] = [
  { value: 'sql', label: 'SQL (Genérico)' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mariadb', label: 'MariaDB' },
];

export function SqlFormatterTool() {
  const [input, setInput] = useState('');
  const [dialect, setDialect] = useState<Dialect>('sql');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const clipboardData = useClipboardData();

  useEffect(() => {
    if (clipboardData && !input) {
      setInput(clipboardData);
    }
  }, [clipboardData]);

  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setError('');
      return;
    }

    try {
      const formatted = format(input, {
        language: dialect,
        tabWidth: 2,
        keywordCase: 'upper',
      });
      setOutput(formatted);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao formatar SQL');
    }
  }, [input, dialect]);

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output);
    }
  };

  const handleClear = () => {
    setInput('');
  };

  return (
    <div className="main-content">
      <div className="tool-header">
        <h2>Formatador de SQL</h2>
        <p>Formata queries SQL com indentação e quebra de linha.</p>
      </div>

      <div className="tool-body">
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
          <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Dialeto:</label>
          <select
            value={dialect}
            onChange={(e) => setDialect(e.target.value as Dialect)}
            style={{
              padding: '8px 12px',
              background: 'var(--app-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
            }}
          >
            {DIALECTS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 flex gap-4" style={{ gap: '16px' }}>
          <div className="flex-1 flex-col glass-panel" style={{ padding: '16px' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '12px' }}>
              <span style={{ fontWeight: 500 }}>Input</span>
              <button className="secondary" style={{ padding: '6px' }} onClick={handleClear} title="Limpar">
                <Trash2 size={16} />
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Cole a query SQL aqui..."
            />
          </div>

          <div className="flex-1 flex-col glass-panel" style={{ padding: '16px' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '12px' }}>
              <span style={{ fontWeight: 500 }}>Output</span>
              <button className="secondary" style={{ padding: '6px' }} onClick={handleCopy} title="Copiar">
                <Copy size={16} />
              </button>
            </div>
            {error ? (
              <div style={{ color: 'var(--error-color)', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                {error}
              </div>
            ) : (
              <textarea
                value={output}
                readOnly
                placeholder="SQL formatado aparece aqui..."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Lint**

Run: `cd app && npm run lint`

Expected: sem erros novos relacionados a `SqlFormatterTool.tsx` (o lint roda sobre `app/` inteiro; garanta que nenhum erro aponte para o arquivo novo).

- [ ] **Step 5: Commit**

```bash
git add app/package.json app/package-lock.json app/src/components/SqlFormatterTool.tsx
git commit -m "feat: adiciona componente SqlFormatterTool com sql-formatter"
```

---

### Task 2: Registrar rota e item no Sidebar

**Files:**
- Modify: `app/src/App.tsx`
- Modify: `app/src/components/Sidebar.tsx`

**Interfaces:**
- Consumes: `SqlFormatterTool` de `app/src/components/SqlFormatterTool.tsx` (Task 1), assinatura `export function SqlFormatterTool(): JSX.Element`.

- [ ] **Step 1: Adicionar import e rota em `App.tsx`**

Em `app/src/App.tsx`, adicionar o import junto aos demais (logo após a linha do `BackslashEscapeTool`):

```tsx
import { SqlFormatterTool } from './components/SqlFormatterTool';
```

E adicionar a rota dentro de `<Routes>`, após a rota `/backslash`:

```tsx
<Route path="/sql" element={<SqlFormatterTool />} />
```

- [ ] **Step 2: Adicionar ícone e item no `Sidebar.tsx`**

Em `app/src/components/Sidebar.tsx`, adicionar `Database` ao import de ícones do `lucide-react` (linha 2-17):

```tsx
import {
  Code,
  Braces,
  Lock,
  Clock,
  Regex,
  CalendarClock,
  QrCode,
  Fingerprint,
  KeyRound,
  Hash,
  Shield,
  FileDiff,
  Type,
  Slash,
  Database
} from 'lucide-react';
```

E adicionar a entrada no array `TOOLS`, após o item `backslash`:

```tsx
{ id: 'sql', name: 'Formatador de SQL', icon: Database, path: '/sql' },
```

- [ ] **Step 3: Verificação manual — dev server**

Run: `cd app && npm run dev`

No app Electron que abrir:
1. Clicar em "Formatador de SQL" no menu lateral — deve navegar para a tela nova sem erro no console.
2. Colar `select * from users where id=1 and status='active'` no Input.
3. Confirmar que o Output mostra o SQL formatado (keywords em maiúsculo, quebra de linha por cláusula).
4. Trocar o Dialeto para "PostgreSQL" — confirmar que o Output reformata automaticamente (sem precisar reeditar o input).
5. Apagar o Input e digitar algo claramente inválido, ex: `select * frooom (((` — confirmar que aparece mensagem de erro em vermelho no painel de Output, e que o Input não é apagado.
6. Clicar no botão de copiar (ícone `Copy`) no Output — colar em outro lugar (ex: editor de texto) e confirmar que o conteúdo copiado bate com o Output exibido.
7. Fechar o app (`Ctrl+C` no terminal do `npm run dev`).

Expected: todos os 6 passos acima se comportam como descrito, sem erro no console do DevTools (`Ctrl+Shift+I` dentro do app Electron).

- [ ] **Step 4: Lint final**

Run: `cd app && npm run lint`

Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add app/src/App.tsx app/src/components/Sidebar.tsx
git commit -m "feat: registra rota /sql e item Formatador de SQL no menu"
```
