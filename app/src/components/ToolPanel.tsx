import type { CSSProperties, ReactNode } from 'react';

interface ToolPanelProps {
  label: string;
  labelStyle?: CSSProperties;
  actions?: ReactNode;
  style?: CSSProperties;
  children: ReactNode;
}

/**
 * Painel `glass-panel` com um label (e, opcionalmente, botões de ação alinhados
 * à direita) seguido de conteúdo — o padrão repetido em todo par input/output
 * das tools (JSON, Base64, Backslash, SQL, JWT).
 */
export function ToolPanel({ label, labelStyle, actions, style, children }: ToolPanelProps) {
  return (
    <div className="flex-1 flex-col glass-panel" style={{ padding: '16px', ...style }}>
      {actions ? (
        <div className="flex justify-between items-center" style={{ marginBottom: '12px' }}>
          <span style={{ fontWeight: 500, ...labelStyle }}>{label}</span>
          <div style={{ display: 'flex', gap: '6px' }}>{actions}</div>
        </div>
      ) : (
        <span style={{ fontWeight: 500, marginBottom: '12px', display: 'block', ...labelStyle }}>{label}</span>
      )}
      {children}
    </div>
  );
}
