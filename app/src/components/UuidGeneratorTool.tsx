import { useState } from 'react';

export function UuidGeneratorTool() {
  const [uuids, setUuids] = useState<string[]>([crypto.randomUUID()]);
  const [count, setCount] = useState(1);
  const [uppercase, setUppercase] = useState(false);
  const [noHyphens, setNoHyphens] = useState(false);

  const generate = () => {
    const newUuids = [];
    for (let i = 0; i < count; i++) {
        let uuid = crypto.randomUUID();
        if (uppercase) uuid = uuid.toUpperCase();
        if (noHyphens) uuid = uuid.replace(/-/g, '');
        newUuids.push(uuid);
    }
    setUuids(newUuids);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(uuids.join('\n'));
  };

  return (
    <div className="h-full flex-col">
      <div className="tool-header">
        <h2>UUID/GUID Generator</h2>
        <p>Gere identificadores únicos universais (UUIDs) versão 4.</p>
      </div>

      <div className="tool-body">
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div className="flex-col" style={{ gap: '8px', minWidth: '120px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Quantidade</label>
              <input 
                type="number" 
                min="1" max="1000"
                value={count}
                onChange={(e) => setCount(Number(e.target.value.replace(/\D/g, '')) || 1)}
                style={{ 
                  padding: '10px 12px', 
                  borderRadius: '6px', 
                  background: 'var(--app-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
            
            <div className="flex-col" style={{ gap: '12px', justifyContent: 'center', paddingTop: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={uppercase} onChange={(e) => setUppercase(e.target.checked)} />
                <span style={{ fontSize: '14px' }}>Maiúsculas</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" checked={noHyphens} onChange={(e) => setNoHyphens(e.target.checked)} />
                <span style={{ fontSize: '14px' }}>Sem hífens (-)</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={generate} style={{ flex: 1 }}>Gerar UUIDs</button>
            <button className="secondary" onClick={copyToClipboard}>Copiar Todos</button>
          </div>

          <div className="flex-col" style={{ gap: '8px', marginTop: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Resultado</label>
            <textarea 
              readOnly 
              value={uuids.join('\n')}
              style={{ height: '250px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
