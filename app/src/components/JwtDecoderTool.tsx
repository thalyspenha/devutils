import { useState, useMemo } from 'react';
import { Trash2, AlertCircle, CheckCircle2, Copy, Check, ClipboardPaste } from 'lucide-react';
import CryptoJS from 'crypto-js';
import { useClipboardData } from '../hooks/useClipboardData';
import { useCopy } from '../hooks/useCopy';

const DEFAULT_PAYLOAD = () => {
  const now = Math.floor(Date.now() / 1000);
  return JSON.stringify({ sub: '1234567890', iat: now, exp: now + 3600 }, null, 2);
};

function encodeBase64Url(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function decodeBase64Url(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return decodeURIComponent(escape(atob(str)));
}

export function JwtDecoderTool() {
  const [activeTab, setActiveTab] = useState<'decode' | 'generate'>('decode');

  // decode state
  const [input, setInput] = useState('');
  const [verifySecret, setVerifySecret] = useState('');

  // generate state
  const [payloadText, setPayloadText] = useState(DEFAULT_PAYLOAD);
  const [secret, setSecret] = useState('your-256-bit-secret');
  const [generatedToken, setGeneratedToken] = useState('');
  const [genError, setGenError] = useState<string | null>(null);
  const { copy, copied } = useCopy();
  const pasteFromClipboard = useClipboardData(setInput);

  const { header, payload, headerAlg, error } = useMemo<{ header: string; payload: string; headerAlg: string | null; error: string | null }>(() => {
    if (!input.trim()) return { header: '', payload: '', headerAlg: null, error: null };

    const parts = input.split('.');
    if (parts.length !== 3) {
      return { header: '', payload: '', headerAlg: null, error: 'Invalid JWT format. Must contain 3 parts separated by dots.' };
    }
    try {
      const parsedHeader = JSON.parse(decodeBase64Url(parts[0]));
      return {
        header: JSON.stringify(parsedHeader, null, 2),
        payload: JSON.stringify(JSON.parse(decodeBase64Url(parts[1])), null, 2),
        headerAlg: typeof parsedHeader.alg === 'string' ? parsedHeader.alg : null,
        error: null,
      };
    } catch (err) {
      return {
        header: '',
        payload: '',
        headerAlg: null,
        error: 'Failed to decode JWT parts. ' + (err instanceof Error ? err.message : String(err)),
      };
    }
  }, [input]);

  // Verificação de assinatura é opcional e só roda se o usuário informar um secret.
  const signatureStatus = useMemo<'none' | 'unsupported-alg' | 'valid' | 'invalid'>(() => {
    if (error || !input.trim() || !verifySecret) return 'none';
    if (headerAlg !== 'HS256') return 'unsupported-alg';

    const [headerB64, payloadB64, signatureB64] = input.split('.');
    const expectedSignature = CryptoJS.HmacSHA256(`${headerB64}.${payloadB64}`, verifySecret)
      .toString(CryptoJS.enc.Base64)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    return expectedSignature === signatureB64 ? 'valid' : 'invalid';
  }, [input, verifySecret, headerAlg, error]);

  const generateJwt = () => {
    try {
      JSON.parse(payloadText);
    } catch {
      setGenError('Payload inválido: JSON mal formatado.');
      setGeneratedToken('');
      return;
    }
    const headerB64 = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payloadB64 = encodeBase64Url(payloadText);
    const message = `${headerB64}.${payloadB64}`;
    const signature = CryptoJS.HmacSHA256(message, secret)
      .toString(CryptoJS.enc.Base64)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    setGeneratedToken(`${message}.${signature}`);
    setGenError(null);
  };

  const tabStyle = (tab: 'decode' | 'generate') => ({
    padding: '8px 20px',
    borderRadius: '6px',
    fontWeight: 500,
    fontSize: '14px',
    cursor: 'pointer',
    border: 'none',
    background: activeTab === tab ? 'var(--accent-color, #6366f1)' : 'transparent',
    color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
  });

  return (
    <div className="main-content">
      <div className="tool-header">
        <h2>JWT Tool</h2>
        <p>Decodifique e gere JSON Web Tokens.</p>
      </div>

      <div style={{ display: 'flex', gap: '4px', padding: '0 0 16px 0' }}>
        <button style={tabStyle('decode')} onClick={() => setActiveTab('decode')}>Decodificar</button>
        <button style={tabStyle('generate')} onClick={() => setActiveTab('generate')}>Gerar</button>
      </div>

      {activeTab === 'decode' && (
        <div className="tool-body">
          <div className="flex-col glass-panel" style={{ padding: '16px', minHeight: '120px', flex: '0 0 auto' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '12px' }}>
              <span style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Encoded JWT</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="secondary" style={{ padding: '6px' }} onClick={pasteFromClipboard} title="Colar da área de transferência">
                  <ClipboardPaste size={16} />
                </button>
                <button className="secondary" style={{ padding: '6px' }} onClick={() => setInput('')} title="Clear">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Cole o JWT aqui..."
              style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0, height: '80px', flex: 1 }}
            />
          </div>

          <div className="flex-col" style={{ gap: '6px', padding: '0 4px' }}>
            <label style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Secret (opcional — verifica assinatura HS256)</label>
            <input
              type="text"
              value={verifySecret}
              onChange={(e) => setVerifySecret(e.target.value)}
              placeholder="Deixe em branco para só decodificar, sem verificar"
              style={{ maxWidth: '400px' }}
            />
          </div>

          <div className="flex items-center gap-2" style={{ padding: '0 4px', fontSize: '14px' }}>
            {error ? (
              <span style={{ color: 'var(--error-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={18} />{error}
              </span>
            ) : !input ? null : signatureStatus === 'valid' ? (
              <span style={{ color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={18} />Assinatura válida (HS256)
              </span>
            ) : signatureStatus === 'invalid' ? (
              <span style={{ color: 'var(--error-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={18} />Assinatura inválida — não confia neste token com esse secret
              </span>
            ) : signatureStatus === 'unsupported-alg' ? (
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={18} />Verificação só suportada para HS256 (token usa {headerAlg ?? 'algoritmo desconhecido'})
              </span>
            ) : (
              <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={18} />Decodificado — assinatura não verificada
              </span>
            )}
          </div>

          <div className="flex-1 flex gap-4">
            <div className="flex-1 flex-col glass-panel" style={{ padding: '16px', background: 'rgba(15, 23, 42, 0.4)' }}>
              <span style={{ fontWeight: 500, marginBottom: '12px', color: '#ef4444', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Header (Algorithm & Type)</span>
              <textarea value={header} readOnly placeholder="Decoded header..." style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0 }} />
            </div>
            <div className="flex-1 flex-col glass-panel" style={{ padding: '16px', background: 'rgba(15, 23, 42, 0.4)' }}>
              <span style={{ fontWeight: 500, marginBottom: '12px', color: '#8b5cf6', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Payload (Data)</span>
              <textarea value={payload} readOnly placeholder="Decoded payload..." style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0 }} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'generate' && (
        <div className="tool-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px' }}>

            <div className="flex-col" style={{ gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Payload (JSON)</label>
              <textarea
                value={payloadText}
                onChange={(e) => setPayloadText(e.target.value)}
                style={{ height: '140px', fontFamily: 'monospace' }}
              />
            </div>

            <div className="flex-col" style={{ gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Secret (HS256)</label>
              <input
                type="text"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="your-256-bit-secret"
              />
            </div>

            {genError && (
              <span style={{ color: 'var(--error-color)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                <AlertCircle size={16} />{genError}
              </span>
            )}

            <button onClick={generateJwt} style={{ alignSelf: 'flex-start' }}>Gerar JWT</button>

            {generatedToken && (
              <div className="flex-col" style={{ gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>JWT Gerado</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <textarea
                    value={generatedToken}
                    readOnly
                    style={{ height: '80px', fontFamily: 'monospace', flex: 1, background: 'var(--sidebar-bg)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '10px 12px' }}
                  />
                  <button className="secondary" onClick={() => copy(generatedToken)} title={copied ? 'Copiado!' : 'Copiar'}>
                    {copied ? <Check size={16} color="var(--success-color)" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
