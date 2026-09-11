import { useState } from 'react';
import { useCopy } from '../hooks/useCopy';
import { ToolLayout } from './ToolLayout';

const CATEGORIES = [
  { label: 'Dono' },
  { label: 'Grupo' },
  { label: 'Outros' },
] as const;

const PERMS = [
  { key: 'r', label: 'Leitura', bit: 4 },
  { key: 'w', label: 'Escrita', bit: 2 },
  { key: 'x', label: 'Execução', bit: 1 },
] as const;

function digitToSymbolic(digit: number) {
  return `${digit & 4 ? 'r' : '-'}${digit & 2 ? 'w' : '-'}${digit & 1 ? 'x' : '-'}`;
}

export function ChmodCalculatorTool() {
  const [octal, setOctal] = useState('644');
  const { copy: copyOctal, copied: copiedOctal } = useCopy();
  const { copy: copyCommand, copied: copiedCommand } = useCopy();

  const padded = (octal + '000').slice(0, 3);
  const digits = padded.split('').map(Number);
  const symbolic = digits.map(digitToSymbolic).join('');
  const command = `chmod ${padded} arquivo`;

  const toggleBit = (categoryIndex: number, bit: number) => {
    const newDigits = [...digits];
    newDigits[categoryIndex] ^= bit;
    setOctal(newDigits.join(''));
  };

  const handleOctalChange = (value: string) => {
    setOctal(value.replace(/[^0-7]/g, '').slice(0, 3));
  };

  return (
    <ToolLayout title="Chmod Calculator" description="Calcule permissões Unix — marque rwx nos checkboxes ou digite o octal direto.">
      <div className="tool-body">
        <div className="glass-panel" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px' }}>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', paddingBottom: '12px' }}>Categoria</th>
                {PERMS.map((p) => (
                  <th key={p.key} style={{ textAlign: 'center', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', paddingBottom: '12px' }}>
                    {p.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((cat, i) => (
                <tr key={cat.label}>
                  <td style={{ padding: '10px 0', fontSize: '14px' }}>{cat.label}</td>
                  {PERMS.map((p) => (
                    <td key={p.key} style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={(digits[i] & p.bit) !== 0}
                        onChange={() => toggleBit(i, p.bit)}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex-col" style={{ gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Octal</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                inputMode="numeric"
                value={octal}
                onChange={(e) => handleOctalChange(e.target.value)}
                placeholder="755"
                style={{ width: '100%', padding: '14px 90px 14px 14px', fontSize: '20px', fontFamily: 'monospace', letterSpacing: '4px' }}
              />
              <button
                className="secondary"
                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', padding: '6px 10px', fontSize: '13px' }}
                onClick={() => copyOctal(padded)}
              >
                {copiedOctal ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>

          <div className="flex-col" style={{ gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Simbólico</label>
            <input type="text" readOnly value={symbolic} style={{ fontFamily: 'monospace', fontSize: '18px', letterSpacing: '2px' }} />
          </div>

          <div className="flex-col" style={{ gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Comando</label>
            <div style={{ position: 'relative' }}>
              <input type="text" readOnly value={command} style={{ width: '100%', padding: '14px 90px 14px 14px', fontFamily: 'monospace' }} />
              <button
                className="secondary"
                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', padding: '6px 10px', fontSize: '13px' }}
                onClick={() => copyCommand(command)}
              >
                {copiedCommand ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </ToolLayout>
  );
}
