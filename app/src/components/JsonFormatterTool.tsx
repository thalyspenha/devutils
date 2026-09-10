import { useState, useMemo } from 'react';
import { Trash2, Copy, Check, FileJson, CheckCircle2, AlertCircle } from 'lucide-react';
import { useClipboardData } from '../hooks/useClipboardData';
import { useCopy } from '../hooks/useCopy';

export function JsonFormatterTool() {
  const [input, setInput] = useState('');
  const { copy, copied } = useCopy();

  useClipboardData((text) => {
    if (input) return;
    try {
      JSON.parse(text);
      setInput(text);
    } catch {
      // não é JSON, não cola
    }
  });

  const { output, error } = useMemo<{ output: string; error: string | null }>(() => {
    if (!input.trim()) return { output: '', error: null };

    try {
      return { output: JSON.stringify(JSON.parse(input), null, 2), error: null };
    } catch (err) {
      // Try to fix unescaped backslashes (e.g. Windows paths like C:\Users\...)
      try {
        const fixed = input.replace(/\\(?!["\\/bfnrtu])/g, '\\\\');
        return { output: JSON.stringify(JSON.parse(fixed), null, 2), error: null };
      } catch {
        return { output: '', error: err instanceof Error ? err.message : 'Invalid JSON format' };
      }
    }
  }, [input]);

  return (
    <div className="main-content">
      <div className="tool-header">
        <h2>JSON Formatter</h2>
        <p>Format, validate, and beautify your JSON data.</p>
      </div>

      <div className="tool-body">
        
        {/* Status Bar */}
        <div className="flex justify-between items-center" style={{ padding: '0 4px' }}>
          <div className="flex items-center gap-2">
            {input.length === 0 ? (
               <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <FileJson size={18} />
                 Waiting for input...
               </span>
            ) : error ? (
               <span style={{ color: 'var(--error-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <AlertCircle size={18} />
                 Invalid JSON
               </span>
            ) : (
               <span style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <CheckCircle2 size={18} />
                 Valid JSON
               </span>
            )}
          </div>
          
          <div className="flex gap-2">
             <button className="secondary" onClick={() => setInput('')} title="Clear">
                <Trash2 size={16} />
              </button>
             <button className="secondary" onClick={() => copy(output)} disabled={!output} title={copied ? 'Copiado!' : 'Copiar'}>
                {copied ? <Check size={16} color="var(--success-color)" /> : <Copy size={16} />}
              </button>
          </div>
        </div>

        {error && (
            <div style={{ color: 'var(--error-color)', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace' }}>
              Error: {error}
            </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex gap-4">
          <div className="flex-1 flex-col glass-panel" style={{ padding: '16px' }}>
            <span style={{ fontWeight: 500, marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Raw Input</span>
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste JSON here..."
              style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0 }}
            />
          </div>

          <div className="flex-1 flex-col glass-panel" style={{ padding: '16px', background: 'rgba(15, 23, 42, 0.4)' }}>
           <span style={{ fontWeight: 500, marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Formatted Output</span>
            <textarea 
              value={output}
              readOnly
              placeholder="Result..."
              style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0 }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
