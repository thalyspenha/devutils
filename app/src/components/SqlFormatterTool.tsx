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
      const message = err instanceof Error ? err.message : 'Erro ao formatar SQL';
      setError(message.split('\n')[0]);
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
