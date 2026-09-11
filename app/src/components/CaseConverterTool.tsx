import { useState, useMemo } from 'react';
import { useCopy } from '../hooks/useCopy';

type CaseType = 'camelCase' | 'snake_case' | 'PascalCase' | 'kebab-case' | 'UPPERCASE' | 'lowercase' | 'CONSTANT_CASE';

function getWords(str: string) {
  return str.replace(/([a-z])([A-Z])/g, '$1 $2').split(/[\s_-]+/).filter(Boolean).map(w => w.toLowerCase());
}

function toCamelCase(str: string) {
  return getWords(str).map((w, i) => i === 0 ? w : w[0].toUpperCase() + w.slice(1)).join('');
}

function toPascalCase(str: string) {
  return getWords(str).map(w => w[0].toUpperCase() + w.slice(1)).join('');
}

const toSnakeCase = (str: string) => getWords(str).join('_');

const toKebabCase = (str: string) => getWords(str).join('-');

const toConstantCase = (str: string) => getWords(str).join('_').toUpperCase();

function convertCase(type: CaseType, str: string) {
  if (!str.trim()) return '';
  switch (type) {
    case 'camelCase': return toCamelCase(str);
    case 'PascalCase': return toPascalCase(str);
    case 'snake_case': return toSnakeCase(str);
    case 'kebab-case': return toKebabCase(str);
    case 'CONSTANT_CASE': return toConstantCase(str);
    case 'UPPERCASE': return str.toUpperCase();
    case 'lowercase': return str.toLowerCase();
    default: return str;
  }
}

export function CaseConverterTool() {
  const [input, setInput] = useState('');
  const [activeCase, setActiveCase] = useState<CaseType | null>(null);
  const { copy, copied } = useCopy();

  const output = useMemo(
    () => (activeCase ? convertCase(activeCase, input) : ''),
    [input, activeCase],
  );

  const caseButton = (type: CaseType, label: string) => (
    <button
      className={activeCase === type ? '' : 'secondary'}
      onClick={() => setActiveCase(type)}
    >
      {label}
    </button>
  );

  return (
    <div className="h-full flex-col">
      <div className="tool-header">
        <h2>Case Converter</h2>
        <p>Mudar texto para camelCase, snake_case, PascalCase, UPPERCASE, etc.</p>
      </div>

      <div className="tool-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px' }}>

          <div className="flex-col" style={{ gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Texto</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite o texto para converter..."
              style={{ height: '160px' }}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {caseButton('lowercase', 'lowercase')}
            {caseButton('UPPERCASE', 'UPPERCASE')}
            {caseButton('camelCase', 'camelCase')}
            {caseButton('PascalCase', 'PascalCase')}
            {caseButton('snake_case', 'snake_case')}
            {caseButton('kebab-case', 'kebab-case')}
            {caseButton('CONSTANT_CASE', 'CONSTANT_CASE')}
          </div>

          <div className="flex-col" style={{ gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Resultado</label>
              <button
                className={`secondary${copied ? ' copied' : ''}`}
                style={{ padding: '4px 8px', fontSize: '12px' }}
                onClick={() => copy(output)}
                disabled={!output}
              >
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <textarea
              readOnly
              value={output}
              placeholder="Escolha um formato acima para ver o resultado..."
              style={{ height: '160px' }}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
