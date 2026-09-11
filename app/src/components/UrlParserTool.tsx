import { useState, useMemo } from 'react';
import { Trash2, Copy, Check, ClipboardPaste, AlertCircle } from 'lucide-react';
import { useClipboardData } from '../hooks/useClipboardData';
import { useCopy } from '../hooks/useCopy';
import { ToolLayout } from './ToolLayout';
import { ToolPanel } from './ToolPanel';

interface ParsedUrl {
  url: URL;
  params: [string, string][];
}

function parseUrl(input: string): { parsed: ParsedUrl | null; error: string | null } {
  if (!input.trim()) return { parsed: null, error: null };
  try {
    const url = new URL(input.trim());
    return { parsed: { url, params: Array.from(url.searchParams.entries()) }, error: null };
  } catch {
    return { parsed: null, error: 'URL inválida — inclua o protocolo (ex.: https://exemplo.com/...)' };
  }
}

const COMPONENT_ROWS: Array<{ label: string; get: (u: URL) => string }> = [
  { label: 'Protocolo', get: (u) => u.protocol },
  { label: 'Usuário', get: (u) => u.username },
  { label: 'Senha', get: (u) => u.password },
  { label: 'Host', get: (u) => u.host },
  { label: 'Hostname', get: (u) => u.hostname },
  { label: 'Porta', get: (u) => u.port },
  { label: 'Caminho', get: (u) => u.pathname },
  { label: 'Query String', get: (u) => u.search },
  { label: 'Fragmento (hash)', get: (u) => u.hash },
  { label: 'Origin', get: (u) => u.origin },
];

export function UrlParserTool() {
  const [input, setInput] = useState('');
  const { copy, copied } = useCopy();
  const pasteFromClipboard = useClipboardData(setInput);

  const { parsed, error } = useMemo(() => parseUrl(input), [input]);

  const paramsJson = useMemo(() => {
    if (!parsed) return '';
    return JSON.stringify(parsed.params.map(([key, value]) => ({ key, value })), null, 2);
  }, [parsed]);

  return (
    <ToolLayout title="URL Parser" description="Analise uma URL e decodifique cada parâmetro da query string.">
      <div className="tool-body">
        <ToolPanel
          label="URL"
          style={{ flex: '0 0 auto' }}
          actions={
            <>
              <button className="secondary" style={{ padding: '6px' }} onClick={pasteFromClipboard} title="Colar da área de transferência">
                <ClipboardPaste size={16} />
              </button>
              <button className="secondary" style={{ padding: '6px' }} onClick={() => setInput('')} title="Limpar">
                <Trash2 size={16} />
              </button>
            </>
          }
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://usuario:senha@exemplo.com:8080/caminho?foo=bar&baz=qux#secao"
            style={{ width: '100%', border: 'none', background: 'transparent', boxShadow: 'none', padding: 0, fontFamily: 'monospace' }}
          />
        </ToolPanel>

        {error && (
          <div style={{ color: 'var(--error-color)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', padding: '0 4px' }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {parsed && (
          <div className="flex-1 flex gap-4">
            <ToolPanel label="Componentes">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {COMPONENT_ROWS.map(({ label, get }) => {
                    const value = get(parsed.url);
                    return (
                      <tr key={label}>
                        <td style={{ padding: '6px 12px 6px 0', color: 'var(--text-secondary)', fontSize: '13px', whiteSpace: 'nowrap', verticalAlign: 'top' }}>{label}</td>
                        <td style={{ padding: '6px 0', fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all' }}>
                          {value ? value : <span style={{ color: 'var(--text-secondary)' }}>—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ToolPanel>

            <ToolPanel
              label={`Parâmetros da Query (${parsed.params.length})`}
              actions={
                <button
                  className="secondary"
                  style={{ padding: '6px' }}
                  onClick={() => copy(paramsJson)}
                  disabled={parsed.params.length === 0}
                  title={copied ? 'Copiado!' : 'Copiar como JSON'}
                >
                  {copied ? <Check size={16} color="var(--success-color)" /> : <Copy size={16} />}
                </button>
              }
            >
              {parsed.params.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Sem parâmetros de query.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', paddingBottom: '8px' }}>Chave</th>
                      <th style={{ textAlign: 'left', fontSize: '12px', color: 'var(--text-secondary)', paddingBottom: '8px' }}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.params.map(([key, value], i) => (
                      <tr key={`${key}-${i}`}>
                        <td style={{ padding: '4px 12px 4px 0', fontFamily: 'monospace', fontSize: '13px', color: 'var(--accent-color)', verticalAlign: 'top' }}>{key}</td>
                        <td style={{ padding: '4px 0', fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all' }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </ToolPanel>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
