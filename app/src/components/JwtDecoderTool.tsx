import React, { useState, useEffect } from 'react';
import { Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useClipboardData } from '../hooks/useClipboardData';

export function JwtDecoderTool() {
  const [input, setInput] = useState('');
  const [header, setHeader] = useState('');
  const [payload, setPayload] = useState('');
  const [error, setError] = useState<string | null>(null);

  const clipboardData = useClipboardData();

  useEffect(() => {
    if (clipboardData && !input) {
      // Very basic check if it looks like a JWT (3 base64url parts)
      const parts = clipboardData.split('.');
      if (parts.length === 3 && clipboardData.length > 20) {
        setInput(clipboardData);
      }
    }
  }, [clipboardData]);

  useEffect(() => {
    decodeJwt(input);
  }, [input]);

  const decodeJwt = (token: string) => {
    if (!token.trim()) {
      setHeader('');
      setPayload('');
      setError(null);
      return;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      setError('Invalid JWT format. Must contain 3 parts separated by dots.');
      setHeader('');
      setPayload('');
      return;
    }

    try {
      const decodedHeader = decodeBase64Url(parts[0]);
      const decodedPayload = decodeBase64Url(parts[1]);

      setHeader(JSON.stringify(JSON.parse(decodedHeader), null, 2));
      setPayload(JSON.stringify(JSON.parse(decodedPayload), null, 2));
      setError(null);
    } catch (err: any) {
      setError('Failed to decode JWT parts. ' + err.message);
      setHeader('');
      setPayload('');
    }
  };

  const decodeBase64Url = (str: string) => {
    // Add removed at end '='
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    return decodeURIComponent(escape(atob(str)));
  };

  return (
    <div className="main-content">
      <div className="tool-header">
        <h2>JWT Decoder</h2>
        <p>Decode JSON Web Tokens instantly.</p>
      </div>

      <div className="tool-body">
         <div className="flex-col glass-panel" style={{ padding: '16px', minHeight: '120px', flex: '0 0 auto' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '12px' }}>
              <span style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Encoded JWT</span>
              <button className="secondary" style={{ padding: '6px' }} onClick={() => setInput('')} title="Clear">
                <Trash2 size={16} />
              </button>
            </div>
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste JWT here..."
              style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0, height: '80px', flex: 1 }}
            />
          </div>

        {/* Status Bar */}
        <div className="flex items-center gap-2" style={{ padding: '0 4px', fontSize: '14px' }}>
            {error ? (
               <span style={{ color: 'var(--error-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <AlertCircle size={18} />
                 {error}
               </span>
            ) : input ? (
               <span style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                 <CheckCircle2 size={18} />
                 Valid JWT
               </span>
            ) : null}
        </div>

        <div className="flex-1 flex gap-4">
          <div className="flex-1 flex-col glass-panel" style={{ padding: '16px', background: 'rgba(15, 23, 42, 0.4)' }}>
            <span style={{ fontWeight: 500, marginBottom: '12px', color: '#ef4444', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Header (Algorithm & Type)</span>
            <textarea 
              value={header}
              readOnly
              placeholder="Decoded header..."
              style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0 }}
            />
          </div>

          <div className="flex-1 flex-col glass-panel" style={{ padding: '16px', background: 'rgba(15, 23, 42, 0.4)' }}>
           <span style={{ fontWeight: 500, marginBottom: '12px', color: '#8b5cf6', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Payload (Data)</span>
            <textarea 
              value={payload}
              readOnly
              placeholder="Decoded payload..."
              style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0 }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
