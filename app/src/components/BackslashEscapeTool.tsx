import { useState, useMemo } from 'react';
import { ArrowLeftRight, Trash2, Copy, Check, ClipboardPaste } from 'lucide-react';
import { useClipboardData } from '../hooks/useClipboardData';
import { useCopy } from '../hooks/useCopy';
import { ToolLayout } from './ToolLayout';
import { ToolPanel } from './ToolPanel';

const ESCAPE_MAP: Record<string, string> = {
  '\\': '\\\\',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  '\0': '\\0',
  '"': '\\"',
  "'": "\\'",
  '\b': '\\b',
  '\f': '\\f',
  '\v': '\\v',
};

const UNESCAPE_MAP: Record<string, string> = {
  '\\\\': '\\',
  '\\n': '\n',
  '\\r': '\r',
  '\\t': '\t',
  '\\0': '\0',
  '\\"': '"',
  "\\'": "'",
  '\\b': '\b',
  '\\f': '\f',
  '\\v': '\v',
};

function escape(text: string): string {
  return text.replace(/[\\"\n\r\t\0\b\f\v']/g, (ch) => ESCAPE_MAP[ch] ?? ch);
}

function unescape(text: string): string {
  return text.replace(/\\(\\|n|r|t|0|"|'|b|f|v)/g, (seq) => UNESCAPE_MAP[seq] ?? seq);
}

export function BackslashEscapeTool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'escape' | 'unescape'>('escape');
  const { copy, copied } = useCopy();
  const pasteFromClipboard = useClipboardData(setInput);

  const output = useMemo(() => {
    if (!input) return '';
    return mode === 'escape' ? escape(input) : unescape(input);
  }, [input, mode]);

  const toggleMode = () => {
    setMode(prev => prev === 'escape' ? 'unescape' : 'escape');
    setInput(output);
  };

  const handleClear = () => setInput('');

  return (
    <ToolLayout title="Backslash Escape / Unescape" description={'Escape ou remova o escape de sequências de barra invertida como \\n, \\t, \\\\, \\" e outras.'}>
      <div className="tool-body">
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <button
            className={mode === 'escape' ? '' : 'secondary'}
            onClick={() => setMode('escape')}
          >
            Escapar
          </button>
          <button
            className={mode === 'unescape' ? '' : 'secondary'}
            onClick={() => setMode('unescape')}
          >
            Remover escape
          </button>
        </div>

        <div className="flex-1 flex gap-4" style={{ gap: '16px' }}>
          <ToolPanel
            label="Entrada"
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
              placeholder={mode === 'escape' ? 'Cole o texto para escapar...' : 'Cole o texto escapado para remover o escape...'}
            />
          </ToolPanel>

          <div className="flex items-center justify-center">
            <button
              className="secondary"
              onClick={toggleMode}
              style={{ borderRadius: '50%', padding: '12px' }}
              title="Trocar entrada/saída"
            >
              <ArrowLeftRight size={20} />
            </button>
          </div>

          <ToolPanel
            label="Saída"
            actions={
              <button className="secondary" style={{ padding: '6px' }} onClick={() => copy(output)} title={copied ? 'Copiado!' : 'Copiar'}>
                {copied ? <Check size={16} color="var(--success-color)" /> : <Copy size={16} />}
              </button>
            }
          >
            <textarea
              value={output}
              readOnly
              placeholder="O resultado aparecerá aqui..."
            />
          </ToolPanel>
        </div>

        <div className="glass-panel" style={{ padding: '16px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 500 }}>Sequências suportadas</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {[
              ['\\\\', 'Barra invertida'],
              ['\\n', 'Nova linha'],
              ['\\r', 'Retorno de carro'],
              ['\\t', 'Tabulação'],
              ['\\0', 'Nulo'],
              ['\\"', 'Aspas duplas'],
              ["\\'", 'Aspas simples'],
              ['\\b', 'Retrocesso'],
              ['\\f', 'Alimentação de página'],
              ['\\v', 'Tabulação vertical'],
            ].map(([seq, label]) => (
              <div
                key={seq}
                style={{
                  background: 'rgba(56,189,248,0.08)',
                  border: '1px solid rgba(56,189,248,0.2)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  display: 'flex',
                  gap: '6px',
                  alignItems: 'center',
                }}
              >
                <code style={{ color: 'var(--accent-color)', fontFamily: 'monospace' }}>{seq}</code>
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}
