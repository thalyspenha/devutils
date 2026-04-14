import { useState } from 'react';

type CaseType = 'camelCase' | 'snake_case' | 'PascalCase' | 'kebab-case' | 'UPPERCASE' | 'lowercase' | 'CONSTANT_CASE';

export function CaseConverterTool() {
  const [input, setInput] = useState('');

  const getWords = (str: string) => {
    return str.replace(/([a-z])([A-Z])/g, '$1 $2').split(/[\s_-]+/).filter(Boolean).map(w => w.toLowerCase());
  };

  const toCamelCase = (str: string) => {
    return getWords(str).map((w, i) => i === 0 ? w : w[0].toUpperCase() + w.slice(1)).join('');
  };

  const toPascalCase = (str: string) => {
    return getWords(str).map(w => w[0].toUpperCase() + w.slice(1)).join('');
  };

  const toSnakeCase = (str: string) => getWords(str).join('_');
  
  const toKebabCase = (str: string) => getWords(str).join('-');
  
  const toConstantCase = (str: string) => getWords(str).join('_').toUpperCase();

  const convertCase = (type: CaseType) => {
    if (!input.trim()) return input;
    switch (type) {
      case 'camelCase': return toCamelCase(input);
      case 'PascalCase': return toPascalCase(input);
      case 'snake_case': return toSnakeCase(input);
      case 'kebab-case': return toKebabCase(input);
      case 'CONSTANT_CASE': return toConstantCase(input);
      case 'UPPERCASE': return input.toUpperCase();
      case 'lowercase': return input.toLowerCase();
      default: return input;
    }
  };

  const setOutput = (type: CaseType) => {
    setInput(convertCase(type));
  };

  const copyToClipboard = () => {
    if (input) navigator.clipboard.writeText(input);
  };

  return (
    <div className="h-full flex-col">
      <div className="tool-header">
        <h2>Case Converter</h2>
        <p>Mudar texto para camelCase, snake_case, PascalCase, UPPERCASE, etc.</p>
      </div>

      <div className="tool-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px' }}>
          
          <div className="flex-col" style={{ gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
               <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Texto</label>
               <button className="secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={copyToClipboard}>Copiar</button>
            </div>
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite o texto para converter..."
              style={{ height: '200px' }}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <button onClick={() => setOutput('lowercase')}>lowercase</button>
            <button onClick={() => setOutput('UPPERCASE')}>UPPERCASE</button>
            <button onClick={() => setOutput('camelCase')}>camelCase</button>
            <button onClick={() => setOutput('PascalCase')}>PascalCase</button>
            <button onClick={() => setOutput('snake_case')}>snake_case</button>
            <button onClick={() => setOutput('kebab-case')}>kebab-case</button>
            <button onClick={() => setOutput('CONSTANT_CASE')}>CONSTANT_CASE</button>
          </div>

        </div>
      </div>
    </div>
  );
}
