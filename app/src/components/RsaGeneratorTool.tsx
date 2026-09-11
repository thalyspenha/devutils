import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useCopy } from '../hooks/useCopy';
import { ToolLayout } from './ToolLayout';

export function RsaGeneratorTool() {
  const [keySize, setKeySize] = useState<number>(2048);
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { copy, copiedKey } = useCopy();

  const exportPem = (buffer: ArrayBuffer, type: 'PUBLIC KEY' | 'PRIVATE KEY') => {
    const exportedAsString = String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer)));
    const exportedAsBase64 = window.btoa(exportedAsString);
    const pemExported = `-----BEGIN ${type}-----\n${exportedAsBase64.match(/.{1,64}/g)?.join('\n')}\n-----END ${type}-----`;
    return pemExported;
  };

  const generateKeys = async () => {
    setIsGenerating(true);
    setPublicKey('');
    setPrivateKey('');
    setError(null);

    // Use timeout to allow UI to update to Generating...
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: keySize,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"]
      );

      const exportedPublicKey = await window.crypto.subtle.exportKey(
        "spki",
        keyPair.publicKey
      );
      const exportedPrivateKey = await window.crypto.subtle.exportKey(
        "pkcs8",
        keyPair.privateKey
      );

      setPublicKey(exportPem(exportedPublicKey, 'PUBLIC KEY'));
      setPrivateKey(exportPem(exportedPrivateKey, 'PRIVATE KEY'));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Erro ao gerar as chaves RSA.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ToolLayout
      title="RSA Key Pair Generator"
      description={<>Gerar chaves públicas e privadas temporárias para testes de criptografia. Uso: <strong>RSA-OAEP</strong> (criptografar/descriptografar) — não servem para assinatura digital.</>}
    >
      <div className="tool-body">
         <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
               <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Tamanho da Chave:</label>
               <select
                 value={keySize}
                 onChange={(e) => setKeySize(Number(e.target.value))}
                 style={{
                   padding: '8px 12px',
                   background: 'var(--app-bg)',
                   color: 'var(--text-primary)',
                   border: '1px solid var(--border-color)',
                   borderRadius: '4px'
                 }}
               >
                 <option value={2048}>2048 bits (Padrão)</option>
                 <option value={4096}>4096 bits (Lento)</option>
               </select>

               <button onClick={generateKeys} disabled={isGenerating}>
                 {isGenerating ? 'Gerando...' : 'Gerar Chaves'}
               </button>
            </div>

            {error && (
              <div style={{ color: 'var(--error-color)', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) minmax(250px, 1fr)', gap: '24px' }}>
               <div className="flex-col" style={{ gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Chave Pública</label>
                     <button className={`secondary${copiedKey === 'public' ? ' copied' : ''}`} style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => copy(publicKey, 'public')}>{copiedKey === 'public' ? 'Copiado!' : 'Copiar'}</button>
                  </div>
                  <textarea 
                     readOnly 
                     value={publicKey}
                     placeholder="A chave pública aparecerá aqui..."
                     style={{ height: '400px', fontSize: '12px' }}
                  />
               </div>

               <div className="flex-col" style={{ gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Chave Privada</label>
                     <button className={`secondary${copiedKey === 'private' ? ' copied' : ''}`} style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => copy(privateKey, 'private')}>{copiedKey === 'private' ? 'Copiado!' : 'Copiar'}</button>
                  </div>
                  <textarea 
                     readOnly 
                     value={privateKey}
                     placeholder="A chave privada aparecerá aqui..."
                     style={{ height: '400px', fontSize: '12px' }}
                  />
               </div>
            </div>

         </div>
      </div>
    </ToolLayout>
  );
}
