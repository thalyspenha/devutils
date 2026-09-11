import { useState, useMemo } from 'react';
import { ArrowLeftRight, Trash2, Copy, Check, ClipboardPaste } from 'lucide-react';
import { useClipboardData } from '../hooks/useClipboardData';
import { useCopy } from '../hooks/useCopy';
import { ToolLayout } from './ToolLayout';
import { ToolPanel } from './ToolPanel';

export function Base64Tool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const { copy, copied } = useCopy();

  const pasteFromClipboard = useClipboardData((text) => {
    setInput(text);
    // Auto-detecta Base64 para já mudar para o modo decode
    const isBase64 = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/.test(text);
    if (isBase64 && text.length > 0) {
      setMode('decode');
    }
  });

  const { output, error } = useMemo<{ output: string; error: string }>(() => {
    if (!input) return { output: '', error: '' };

    try {
      if (mode === 'encode') {
        return { output: btoa(unescape(encodeURIComponent(input))), error: '' };
      }
      return { output: decodeURIComponent(escape(atob(input))), error: '' };
    } catch {
      return { output: '', error: 'Entrada inválida para ' + (mode === 'encode' ? 'codificação' : 'decodificação') };
    }
  }, [input, mode]);

  const toggleMode = () => {
    setMode(prev => prev === 'encode' ? 'decode' : 'encode');
    // Swap input and output for convenience
    setInput(output);
  };

  const handleClear = () => {
    setInput('');
  };

  return (
    <ToolLayout title="Base64 Encoder/Decoder" description="Codifique ou decodifique texto para Base64 instantaneamente.">
      <div className="tool-body">
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <button
            className={mode === 'encode' ? '' : 'secondary'}
            onClick={() => setMode('encode')}
          >
            Codificar
          </button>
          <button
            className={mode === 'decode' ? '' : 'secondary'}
            onClick={() => setMode('decode')}
          >
            Decodificar
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
              placeholder={`Cole o texto para ${mode === 'encode' ? 'codificar' : 'decodificar'}...`}
            />
          </ToolPanel>

          <div className="flex items-center justify-center">
            <button className="secondary" onClick={toggleMode} style={{ borderRadius: '50%', padding: '12px' }} title="Trocar entrada/saída">
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
            {error ? (
              <div style={{ color: 'var(--error-color)', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                {error}
              </div>
            ) : (
             <textarea
                value={output}
                readOnly
                placeholder="O resultado aparecerá aqui..."
              />
            )}
          </ToolPanel>
        </div>
      </div>
    </ToolLayout>
  );
}
