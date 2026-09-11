import { useState, useRef } from 'react';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';
import { ToolLayout } from './ToolLayout';

export function QrCodeGeneratorTool() {
  const [text, setText] = useState('https://example.com');
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');

  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'qrcode.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.href = canvasRef.current.toDataURL('image/png');
    link.download = 'qrcode.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ToolLayout title="QR Code Generator" description="Gerar QR codes para URLs ou textos de teste rapidamente.">
      <div className="tool-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 1fr)', gap: '24px', alignItems: 'start' }}>

          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="flex-col" style={{ gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Conteúdo (URL ou Texto)</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Insira o texto aqui"
                style={{ height: '120px' }}
              />
            </div>

            <div className="flex-col" style={{ gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Tamanho: {size}px</label>
              <input
                type="range"
                min="128" max="512" step="16"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div className="flex-col" style={{ gap: '8px', flex: 1 }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Cor do Código</label>
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  style={{ width: '100%', height: '40px', cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'transparent' }}
                />
              </div>
              <div className="flex-col" style={{ gap: '8px', flex: 1 }}>
                <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Cor de Fundo</label>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  style={{ width: '100%', height: '40px', cursor: 'pointer', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'transparent' }}
                />
              </div>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <div style={{ padding: '16px', background: bgColor, borderRadius: '8px', display: 'inline-block' }}>
              <QRCodeSVG
                value={text || ' '}
                size={size}
                fgColor={fgColor}
                bgColor={bgColor}
                level="L"
                marginSize={0}
                ref={svgRef}
              />
            </div>
            {/* Canvas oculto, só usado pra exportar PNG (QRCodeSVG não vira PNG direto). */}
            <QRCodeCanvas
              value={text || ' '}
              size={size}
              fgColor={fgColor}
              bgColor={bgColor}
              level="L"
              marginSize={0}
              ref={canvasRef}
              style={{ display: 'none' }}
            />
            <div style={{ display: 'flex', gap: '12px', width: '100%', maxWidth: '256px' }}>
              <button onClick={handleDownloadSvg} style={{ flex: 1 }}>
                Baixar SVG
              </button>
              <button onClick={handleDownloadPng} className="secondary" style={{ flex: 1 }}>
                Baixar PNG
              </button>
            </div>
          </div>

        </div>
      </div>
    </ToolLayout>
  );
}
