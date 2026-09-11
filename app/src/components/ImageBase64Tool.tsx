import { useState, useMemo, useRef } from 'react';
import { Trash2, Copy, Check, ClipboardPaste, Upload, AlertCircle, Download } from 'lucide-react';
import { useClipboardData } from '../hooks/useClipboardData';
import { useCopy } from '../hooks/useCopy';
import { ToolLayout } from './ToolLayout';
import { ToolPanel } from './ToolPanel';

const MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'] as const;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function ImageBase64Tool() {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const { copy, copied } = useCopy();

  // Codificar
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ name: string; type: string; size: number } | null>(null);
  const [dataUrl, setDataUrl] = useState('');
  const [includePrefix, setIncludePrefix] = useState(true);
  const [encodeError, setEncodeError] = useState('');

  const handleFileSelect = (selected: File | undefined) => {
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      setEncodeError('Selecione um arquivo de imagem.');
      setFile(null);
      setDataUrl('');
      return;
    }
    setEncodeError('');
    setFile({ name: selected.name, type: selected.type, size: selected.size });
    const reader = new FileReader();
    reader.onload = () => setDataUrl(reader.result as string);
    reader.onerror = () => setEncodeError('Falha ao ler o arquivo.');
    reader.readAsDataURL(selected);
  };

  const encodeOutput = useMemo(() => {
    if (!dataUrl) return '';
    if (includePrefix) return dataUrl;
    const commaIndex = dataUrl.indexOf(',');
    return commaIndex === -1 ? dataUrl : dataUrl.slice(commaIndex + 1);
  }, [dataUrl, includePrefix]);

  const handleClearEncode = () => {
    setFile(null);
    setDataUrl('');
    setEncodeError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Decodificar
  const [decodeInput, setDecodeInput] = useState('');
  const [mimeType, setMimeType] = useState<(typeof MIME_TYPES)[number]>('image/png');
  const pasteFromClipboard = useClipboardData(setDecodeInput);

  const { decodedSrc, decodeError } = useMemo<{ decodedSrc: string; decodeError: string }>(() => {
    const trimmed = decodeInput.trim();
    if (!trimmed) return { decodedSrc: '', decodeError: '' };

    const src = trimmed.startsWith('data:') ? trimmed : `data:${mimeType};base64,${trimmed}`;
    const base64Part = src.slice(src.indexOf(',') + 1);
    try {
      atob(base64Part);
    } catch {
      return { decodedSrc: '', decodeError: 'Base64 inválido.' };
    }
    return { decodedSrc: src, decodeError: '' };
  }, [decodeInput, mimeType]);

  const decodedSize = useMemo(() => {
    if (!decodedSrc) return 0;
    const base64Part = decodedSrc.slice(decodedSrc.indexOf(',') + 1);
    const padding = base64Part.endsWith('==') ? 2 : base64Part.endsWith('=') ? 1 : 0;
    return Math.max(0, Math.floor((base64Part.length * 3) / 4) - padding);
  }, [decodedSrc]);

  const handleDownload = () => {
    if (!decodedSrc) return;
    const mime = decodedSrc.slice(5, decodedSrc.indexOf(';'));
    const ext = mime.split('/')[1] || 'png';
    const link = document.createElement('a');
    link.href = decodedSrc;
    link.download = `imagem.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ToolLayout title="Image Base64" description="Codifique uma imagem para Base64 ou decodifique Base64 de volta em imagem.">
      <div className="tool-body">
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className={mode === 'encode' ? '' : 'secondary'} onClick={() => setMode('encode')}>
            Codificar
          </button>
          <button className={mode === 'decode' ? '' : 'secondary'} onClick={() => setMode('decode')}>
            Decodificar
          </button>
        </div>

        {mode === 'encode' && (
          <div className="flex-1 flex gap-4" style={{ gap: '16px' }}>
            <ToolPanel label="Imagem" style={{ flex: '0 0 340px' }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                style={{ display: 'none' }}
              />
              <div className="flex-col" style={{ gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="flex items-center gap-2" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={16} /> Escolher imagem...
                  </button>
                  {file && (
                    <button className="secondary" style={{ padding: '6px' }} onClick={handleClearEncode} title="Limpar">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {encodeError && (
                  <span style={{ color: 'var(--error-color)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                    <AlertCircle size={16} />
                    {encodeError}
                  </span>
                )}

                {file && dataUrl && (
                  <>
                    <img src={dataUrl} alt={file.name} style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '8px', border: '1px solid var(--border-color)', objectFit: 'contain' }} />
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <div>{file.name}</div>
                      <div>{file.type} — {formatBytes(file.size)}</div>
                    </div>
                  </>
                )}

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="checkbox" checked={includePrefix} onChange={(e) => setIncludePrefix(e.target.checked)} />
                  Incluir prefixo <code style={{ fontFamily: 'monospace' }}>data:URI</code>
                </label>
              </div>
            </ToolPanel>

            <ToolPanel
              label="Base64"
              actions={
                <button className="secondary" style={{ padding: '6px' }} onClick={() => copy(encodeOutput)} disabled={!encodeOutput} title={copied ? 'Copiado!' : 'Copiar'}>
                  {copied ? <Check size={16} color="var(--success-color)" /> : <Copy size={16} />}
                </button>
              }
            >
              <textarea
                value={encodeOutput}
                readOnly
                placeholder="Escolha uma imagem para ver o Base64 aqui..."
                style={{ fontFamily: 'monospace', fontSize: '13px' }}
              />
            </ToolPanel>
          </div>
        )}

        {mode === 'decode' && (
          <div className="flex-1 flex gap-4" style={{ gap: '16px' }}>
            <ToolPanel
              label="Base64 ou Data URI"
              actions={
                <>
                  <button className="secondary" style={{ padding: '6px' }} onClick={pasteFromClipboard} title="Colar da área de transferência">
                    <ClipboardPaste size={16} />
                  </button>
                  <button className="secondary" style={{ padding: '6px' }} onClick={() => setDecodeInput('')} title="Limpar">
                    <Trash2 size={16} />
                  </button>
                </>
              }
            >
              <div className="flex-col" style={{ gap: '10px', height: '100%' }}>
                <textarea
                  value={decodeInput}
                  onChange={(e) => setDecodeInput(e.target.value)}
                  placeholder="Cole o Base64 (com ou sem prefixo data:image/...;base64,)..."
                  style={{ fontFamily: 'monospace', fontSize: '13px', flex: 1 }}
                />
                <div className="flex items-center gap-2" style={{ fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Tipo (se colar sem prefixo):</span>
                  <select value={mimeType} onChange={(e) => setMimeType(e.target.value as typeof mimeType)}>
                    {MIME_TYPES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            </ToolPanel>

            <ToolPanel
              label="Preview"
              actions={
                <button className="secondary flex items-center gap-2" onClick={handleDownload} disabled={!decodedSrc} title="Baixar imagem">
                  <Download size={16} /> Baixar
                </button>
              }
            >
              {decodeError ? (
                <span style={{ color: 'var(--error-color)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                  <AlertCircle size={16} />
                  {decodeError}
                </span>
              ) : decodedSrc ? (
                <div className="flex-col" style={{ gap: '12px' }}>
                  <img src={decodedSrc} alt="Preview decodificado" style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '8px', border: '1px solid var(--border-color)', objectFit: 'contain' }} />
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Tamanho estimado: {formatBytes(decodedSize)}</div>
                </div>
              ) : (
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>A imagem decodificada aparecerá aqui...</span>
              )}
            </ToolPanel>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
