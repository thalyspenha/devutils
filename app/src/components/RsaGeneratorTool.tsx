import { useState } from 'react';

export function RsaGeneratorTool() {
  const [keySize, setKeySize] = useState<number>(2048);
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

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
      alert("Erro ao gerar as chaves RSA.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (text) navigator.clipboard.writeText(text);
  };

  return (
    <div className="h-full flex-col">
      <div className="tool-header">
        <h2>RSA Key Pair Generator</h2>
        <p>Gerar chaves públicas e privadas temporárias para testes de criptografia.</p>
      </div>

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
                 <option value={1024}>1024 bits</option>
                 <option value={2048}>2048 bits (Padrão)</option>
                 <option value={4096}>4096 bits (Lento)</option>
               </select>

               <button onClick={generateKeys} disabled={isGenerating}>
                 {isGenerating ? 'Gerando...' : 'Gerar Chaves'}
               </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) minmax(250px, 1fr)', gap: '24px' }}>
               <div className="flex-col" style={{ gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Chave Pública</label>
                     <button className="secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => copyToClipboard(publicKey)}>Copiar</button>
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
                     <button className="secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => copyToClipboard(privateKey)}>Copiar</button>
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
    </div>
  );
}
