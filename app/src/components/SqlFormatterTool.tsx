import { useState, useMemo } from 'react';
import { Copy, Check, Trash2, ClipboardPaste } from 'lucide-react';
import { format } from 'sql-formatter';
import { useClipboardData } from '../hooks/useClipboardData';
import { useCopy } from '../hooks/useCopy';
import { ToolLayout } from './ToolLayout';
import { ToolPanel } from './ToolPanel';

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
  const { copy, copied } = useCopy();
  const pasteFromClipboard = useClipboardData(setInput);

  const { output, error } = useMemo<{ output: string; error: string }>(() => {
    if (!input.trim()) return { output: '', error: '' };

    try {
      const formatted = format(input, {
        language: dialect,
        tabWidth: 2,
        keywordCase: 'upper',
      });
      return { output: formatted, error: '' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao formatar SQL';
      return { output: '', error: message.split('\n')[0] };
    }
  }, [input, dialect]);

  const handleClear = () => {
    setInput('');
  };

  return (
    <ToolLayout title="Formatador de SQL" description="Formata queries SQL com indentação e quebra de linha.">
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
          <ToolPanel
            label="Input"
            actions={
              <>
                <button className="secondary" style={{ padding: '6px' }} onClick={pasteFromClipboard} title="Colar da área de transferência">
                  <ClipboardPaste size={16} />
                </button>
                <button className="secondary" style={{ padding: '6px' }} onClick={handleClear} title="Limpar">
                  <Trash2 size={16} />
                </button>
              </>
            }
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Cole a query SQL aqui..."
            />
          </ToolPanel>

          <ToolPanel
            label="Output"
            actions={
              <button className="secondary" style={{ padding: '6px' }} onClick={() => copy(output)} title={copied ? 'Copiado!' : 'Copiar'}>
                {copied ? <Check size={16} color="var(--success-color)" /> : <Copy size={16} />}
              </button>
            }
          >
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
          </ToolPanel>
        </div>
      </div>
    </ToolLayout>
  );
}
