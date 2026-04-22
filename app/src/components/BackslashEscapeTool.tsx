import { useState, useEffect } from 'react';
import { ArrowLeftRight, Trash2, Copy } from 'lucide-react';
import { useClipboardData } from '../hooks/useClipboardData';

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
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'escape' | 'unescape'>('escape');

  const clipboardData = useClipboardData();

  useEffect(() => {
    if (clipboardData && !input) {
      setInput(clipboardData);
    }
  }, [clipboardData]);

  useEffect(() => {
    if (!input) {
      setOutput('');
      return;
    }
    setOutput(mode === 'escape' ? escape(input) : unescape(input));
  }, [input, mode]);

  const toggleMode = () => {
    setMode(prev => prev === 'escape' ? 'unescape' : 'escape');
    setInput(output);
  };

  const handleCopy = () => {
    if (output) navigator.clipboard.writeText(output);
  };

  const handleClear = () => setInput('');

  return (
    <div className="main-content">
      <div className="tool-header">
        <h2>Backslash Escape / Unescape</h2>
        <p>Escape or unescape backslash sequences like \n, \t, \\, \" and more.</p>
      </div>

      <div className="tool-body">
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <button
            className={mode === 'escape' ? '' : 'secondary'}
            onClick={() => setMode('escape')}
          >
            Escape
          </button>
          <button
            className={mode === 'unescape' ? '' : 'secondary'}
            onClick={() => setMode('unescape')}
          >
            Unescape
          </button>
        </div>

        <div className="flex-1 flex gap-4" style={{ gap: '16px' }}>
          <div className="flex-1 flex-col glass-panel" style={{ padding: '16px' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '12px' }}>
              <span style={{ fontWeight: 500 }}>Input</span>
              <button className="secondary" style={{ padding: '6px' }} onClick={handleClear} title="Clear">
                <Trash2 size={16} />
              </button>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'escape' ? 'Paste text to escape...' : 'Paste escaped text to unescape...'}
            />
          </div>

          <div className="flex items-center justify-center">
            <button
              className="secondary"
              onClick={toggleMode}
              style={{ borderRadius: '50%', padding: '12px' }}
              title="Swap Input/Output"
            >
              <ArrowLeftRight size={20} />
            </button>
          </div>

          <div className="flex-1 flex-col glass-panel" style={{ padding: '16px' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '12px' }}>
              <span style={{ fontWeight: 500 }}>Output</span>
              <button className="secondary" style={{ padding: '6px' }} onClick={handleCopy} title="Copy to Clipboard">
                <Copy size={16} />
              </button>
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="Result will appear here..."
            />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 500 }}>Supported sequences</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {[
              ['\\\\', 'Backslash'],
              ['\\n', 'New line'],
              ['\\r', 'Carriage return'],
              ['\\t', 'Tab'],
              ['\\0', 'Null'],
              ['\\"', 'Double quote'],
              ["\\'", 'Single quote'],
              ['\\b', 'Backspace'],
              ['\\f', 'Form feed'],
              ['\\v', 'Vertical tab'],
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
    </div>
  );
}
