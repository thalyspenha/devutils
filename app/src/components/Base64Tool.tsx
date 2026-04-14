import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Trash2, Copy } from 'lucide-react';
import { useClipboardData } from '../hooks/useClipboardData';

export function Base64Tool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [error, setError] = useState('');

  const clipboardData = useClipboardData();

  useEffect(() => {
    if (clipboardData && !input) {
      setInput(clipboardData);
      // Auto-detect if it looks like Base64 to switch to decode mode automatically
      const isBase64 = /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/.test(clipboardData);
      if (isBase64 && clipboardData.length > 0) {
        setMode('decode');
      }
    }
  }, [clipboardData]);

  useEffect(() => {
    processText(input, mode);
  }, [input, mode]);

  const processText = (text: string, currentMode: 'encode' | 'decode') => {
    setError('');
    if (!text) {
      setOutput('');
      return;
    }

    try {
      if (currentMode === 'encode') {
        const encoded = btoa(unescape(encodeURIComponent(text)));
        setOutput(encoded);
      } else {
        const decoded = decodeURIComponent(escape(atob(text)));
        setOutput(decoded);
      }
    } catch (err) {
      setError('Invalid input for ' + currentMode);
      setOutput('');
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'encode' ? 'decode' : 'encode');
    // Swap input and output for convenience
    setInput(output);
  };

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
        <h2>Base64 Encoder/Decoder</h2>
        <p>Encode or decode text to Base64 format instantly.</p>
      </div>

      <div className="tool-body">
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <button 
            className={mode === 'encode' ? '' : 'secondary'} 
            onClick={() => setMode('encode')}
          >
            Encode
          </button>
          <button 
            className={mode === 'decode' ? '' : 'secondary'} 
            onClick={() => setMode('decode')}
          >
            Decode
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
              placeholder={`Paste text to ${mode}...`}
            />
          </div>

          <div className="flex items-center justify-center">
            <button className="secondary" onClick={toggleMode} style={{ borderRadius: '50%', padding: '12px' }} title="Swap Input/Output">
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
            {error ? (
              <div style={{ color: 'var(--error-color)', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                {error}
              </div>
            ) : (
             <textarea 
                value={output}
                readOnly
                placeholder="Result will appear here..."
              />
            )}
           
          </div>
        </div>
      </div>
    </div>
  );
}
