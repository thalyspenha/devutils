import { useState, useMemo } from 'react';
import * as Diff from 'diff';

export function TextDiffTool() {
  const [original, setOriginal] = useState('');
  const [modified, setModified] = useState('');

  const diffResult = useMemo(() => {
    if (!original && !modified) return [];
    return Diff.diffLines(original, modified);
  }, [original, modified]);

  return (
    <div className="h-full flex-col">
      <div className="tool-header">
        <h2>Text Diff (Comparador)</h2>
        <p>Comparar dois blocos de código ou texto para ver o que mudou.</p>
      </div>

      <div className="tool-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', height: '40%' }}>
             <div className="flex-col" style={{ gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Texto Original</label>
                <textarea 
                   value={original}
                   onChange={(e) => setOriginal(e.target.value)}
                   style={{ height: '100%' }}
                   placeholder="Cole o texto original aqui..."
                />
             </div>
             <div className="flex-col" style={{ gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Texto Modificado</label>
                <textarea 
                   value={modified}
                   onChange={(e) => setModified(e.target.value)}
                   style={{ height: '100%' }}
                   placeholder="Cole o texto modificado aqui..."
                />
             </div>
          </div>

          <div className="flex-col" style={{ gap: '8px', flex: 1, minHeight: '300px' }}>
             <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Resultado (Diff)</label>
             <div 
               className="glass-panel" 
               style={{ 
                 padding: '16px', 
                 height: '100%', 
                 overflowY: 'auto', 
                 fontFamily: 'monospace', 
                 fontSize: '14px',
                 whiteSpace: 'pre-wrap',
                 wordBreak: 'break-all'
               }}
             >
                {diffResult.length === 0 ? (
                  <span style={{ color: 'var(--text-secondary)' }}>Nenhuma diferença para mostrar.</span>
                ) : (
                  diffResult.map((part, index) => {
                     const color = part.added ? '#22c55e' : part.removed ? '#ef4444' : 'var(--text-primary)';
                     const bgColor = part.added ? 'rgba(34, 197, 94, 0.1)' : part.removed ? 'rgba(239, 68, 68, 0.1)' : 'transparent';
                     const prefix = part.added ? '+ ' : part.removed ? '- ' : '  ';
                     
                     // split by newline and render each line for better diff presentation
                     const lines = part.value.replace(/\n$/, '').split('\n');
                     
                     return lines.map((line, lineIndex) => (
                       <div key={`${index}-${lineIndex}`} style={{ color, backgroundColor: bgColor, padding: '0 4px' }}>
                          {prefix}{line}
                       </div>
                     ));
                  })
                )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
