import { useState, useEffect } from 'react';

export function PasswordGeneratorTool() {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);

  const generatePassword = () => {
    let charset = '';
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+~`|}{[]:;?><,./-=';
    
    if (!charset) {
       setPassword('');
       return;
    }

    let newPassword = '';
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      newPassword += charset[array[i] % charset.length];
    }
    setPassword(newPassword);
  };

  useEffect(() => {
    generatePassword();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);

  const copyToClipboard = () => {
    if (password) navigator.clipboard.writeText(password);
  };

  return (
    <div className="h-full flex-col">
       <div className="tool-header">
        <h2>Gerador de Senha Forte</h2>
        <p>Crie senhas seguras com diversas configurações de caracteres.</p>
      </div>

      <div className="tool-body">
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
          
          <div style={{ position: 'relative' }}>
             <input 
               type="text" 
               readOnly 
               value={password}
               style={{ 
                 width: '100%', 
                 padding: '24px 80px 24px 24px', 
                 fontSize: '24px', 
                 letterSpacing: '1px',
                 fontFamily: 'monospace',
                 background: 'var(--sidebar-bg)',
                 border: '1px solid var(--border-color)',
                 borderRadius: '8px',
                 color: 'var(--accent-color)'
               }}
             />
             <button 
                onClick={copyToClipboard}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}
             >
               Copiar
             </button>
          </div>

          <div className="flex-col" style={{ gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Tamanho: {length}</label>
            </div>
            <input 
              type="range" 
              min="4" max="64" 
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: '1 1 40%' }}>
              <input type="checkbox" checked={includeUppercase} onChange={(e) => setIncludeUppercase(e.target.checked)} />
              <span>Letras Maiúsculas (A-Z)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: '1 1 40%' }}>
              <input type="checkbox" checked={includeLowercase} onChange={(e) => setIncludeLowercase(e.target.checked)} />
              <span>Letras Minúsculas (a-z)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: '1 1 40%' }}>
              <input type="checkbox" checked={includeNumbers} onChange={(e) => setIncludeNumbers(e.target.checked)} />
              <span>Números (0-9)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: '1 1 40%' }}>
              <input type="checkbox" checked={includeSymbols} onChange={(e) => setIncludeSymbols(e.target.checked)} />
              <span>Símbolos (!@#$...)</span>
            </label>
          </div>
          
          <button onClick={generatePassword} style={{ marginTop: '12px', padding: '12px' }}>Gerar Outra Senha</button>

        </div>
      </div>
    </div>
  );
}
