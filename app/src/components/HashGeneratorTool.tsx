import { useState, useMemo } from 'react';
import CryptoJS from 'crypto-js';
import { useCopy } from '../hooks/useCopy';
import { ToolLayout } from './ToolLayout';

export function HashGeneratorTool() {
  const [input, setInput] = useState('');
  const { copy, copiedKey } = useCopy();

  const hashes = useMemo(() => {
    if (!input) return { md5: '', sha1: '', sha256: '', sha512: '' };
    return {
      md5: CryptoJS.MD5(input).toString(CryptoJS.enc.Hex),
      sha1: CryptoJS.SHA1(input).toString(CryptoJS.enc.Hex),
      sha256: CryptoJS.SHA256(input).toString(CryptoJS.enc.Hex),
      sha512: CryptoJS.SHA512(input).toString(CryptoJS.enc.Hex),
    };
  }, [input]);

  return (
    <ToolLayout title="Hash Generator" description="Gere hashes MD5, SHA-1, SHA-256 e SHA-512 instantaneamente.">
      <div className="tool-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
          
          <div className="flex-col" style={{ gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Texto de Entrada</label>
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite o texto para gerar os hashes..."
              style={{ height: '150px' }}
            />
          </div>

          <div className="flex-col" style={{ gap: '16px' }}>
            {(['md5', 'sha1', 'sha256', 'sha512'] as const).map((algo) => (
              <div key={algo} className="flex-col" style={{ gap: '4px' }}>
                <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase' }}>{algo}</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    readOnly 
                    value={hashes[algo]}
                    style={{ 
                      flex: 1,
                      padding: '10px 12px', 
                      borderRadius: '6px', 
                      background: 'var(--sidebar-bg)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                      fontFamily: 'monospace'
                    }}
                  />
                  <button className={`secondary${copiedKey === algo ? ' copied' : ''}`} onClick={() => copy(hashes[algo], algo)}>{copiedKey === algo ? 'Copiado!' : 'Copiar'}</button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </ToolLayout>
  );
}
