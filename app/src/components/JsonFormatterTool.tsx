import { useState, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Trash2, Copy, Check, FileJson, CheckCircle2, AlertCircle, ClipboardPaste } from 'lucide-react';
import { useClipboardData } from '../hooks/useClipboardData';
import { useCopy } from '../hooks/useCopy';
import { ToolLayout } from './ToolLayout';
import { ToolPanel } from './ToolPanel';

const PANEL_LABEL_STYLE: CSSProperties = {
  color: 'var(--text-secondary)',
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '1px',
};

export function JsonFormatterTool() {
  const [input, setInput] = useState('');
  const { copy, copied } = useCopy();
  const pasteFromClipboard = useClipboardData(setInput);

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
        return { output: '', error: err instanceof Error ? err.message : 'Formato JSON inválido' };
      }
    }
  }, [input]);

  return (
    <ToolLayout title="JSON Formatter" description="Formate, valide e embeleze seus dados JSON.">
      <div className="tool-body">

        {/* Status Bar */}
        <div className="flex justify-between items-center" style={{ padding: '0 4px' }}>
          <div className="flex items-center gap-2">
            {input.length === 0 ? (
               <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <FileJson size={18} />
                 Aguardando entrada...
               </span>
            ) : error ? (
               <span style={{ color: 'var(--error-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <AlertCircle size={18} />
                 JSON inválido
               </span>
            ) : (
               <span style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <CheckCircle2 size={18} />
                 JSON válido
               </span>
            )}
          </div>

          <div className="flex gap-2">
             <button className="secondary" onClick={pasteFromClipboard} title="Colar da área de transferência">
                <ClipboardPaste size={16} />
              </button>
             <button className="secondary" onClick={() => setInput('')} title="Limpar">
                <Trash2 size={16} />
              </button>
             <button className="secondary" onClick={() => copy(output)} disabled={!output} title={copied ? 'Copiado!' : 'Copiar'}>
                {copied ? <Check size={16} color="var(--success-color)" /> : <Copy size={16} />}
              </button>
          </div>
        </div>

        {error && (
            <div style={{ color: 'var(--error-color)', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', fontSize: '14px', fontFamily: 'monospace' }}>
              Erro: {error}
            </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex gap-4">
          <ToolPanel label="Entrada" labelStyle={PANEL_LABEL_STYLE}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Cole o JSON aqui..."
              style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0 }}
            />
          </ToolPanel>

          <ToolPanel label="Saída Formatada" labelStyle={PANEL_LABEL_STYLE} style={{ background: 'rgba(15, 23, 42, 0.4)' }}>
            <textarea
              value={output}
              readOnly
              placeholder="Resultado..."
              style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0 }}
            />
          </ToolPanel>
        </div>

      </div>
    </ToolLayout>
  );
}
