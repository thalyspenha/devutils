import { useState } from 'react';
import cronstrue from 'cronstrue/i18n';

export function CronParserTool() {
  const [expression, setExpression] = useState('0 0 * * *');
  
  let description = '';
  let error = '';
  
  try {
    if (expression.trim()) {
      description = cronstrue.toString(expression, { locale: 'pt_BR' });
    }
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="h-full flex-col">
      <div className="tool-header">
        <h2>Cron Parser</h2>
        <p>Traduz expressões Cron para texto legível.</p>
      </div>
      
      <div className="tool-body">
        <div className="flex-col" style={{ gap: '16px', maxWidth: '600px' }}>
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="flex-col" style={{ gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Expressão Cron</label>
              <input 
                type="text" 
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
                placeholder="* * * * *"
                style={{ 
                  padding: '12px', 
                  borderRadius: '8px', 
                  background: 'var(--app-bg)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '16px',
                  fontFamily: 'monospace'
                }}
              />
            </div>
            
            <div className="flex-col" style={{ gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Descrição</label>
              {error ? (
                <div style={{ color: 'var(--error-color)', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                  {error}
                </div>
              ) : (
                <div style={{ color: 'var(--success-color)', padding: '12px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px', fontSize: '16px', fontWeight: 500 }}>
                  {description || 'Digite uma expressão cron'}
                </div>
              )}
            </div>
          </div>
          
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
            <strong>Exemplos:</strong>
            <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
              <li><code>* * * * *</code> - A cada minuto</li>
              <li><code>0 * * * *</code> - A cada hora</li>
              <li><code>0 0 * * *</code> - Todo dia à meia-noite</li>
              <li><code>0 0 * * 0</code> - Todo domingo à meia-noite</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
