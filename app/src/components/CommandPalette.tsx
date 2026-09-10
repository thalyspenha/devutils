import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { TOOLS, type Tool } from '../tools';

// Match fuzzy simples: cada caractere da busca precisa aparecer na ordem no texto.
// Caracteres consecutivos e início de palavra pontuam mais alto.
function fuzzyScore(text: string, query: string): number | null {
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  let ti = 0;
  let score = 0;
  let streak = 0;

  for (const ch of q) {
    const found = t.indexOf(ch, ti);
    if (found === -1) return null;
    if (found === ti) {
      streak += 1;
      score += 1 + streak;
    } else {
      streak = 0;
      score += 1;
      if (found === 0 || t[found - 1] === ' ') score += 2;
    }
    ti = found + 1;
  }
  return score;
}

export function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery('');
        setSelected(0);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const results = useMemo(() => {
    const term = query.trim();
    if (!term) return TOOLS;
    return TOOLS.map((tool) => ({ tool, score: fuzzyScore(tool.name, term) }))
      .filter((r): r is { tool: Tool; score: number } => r.score !== null)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.tool);
  }, [query]);

  if (!open) return null;

  const clampedSelected = Math.min(selected, Math.max(results.length - 1, 0));

  function close() {
    setOpen(false);
  }

  function go(index: number) {
    const tool = results[index];
    if (!tool) return;
    navigate(tool.path);
    close();
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(clampedSelected);
    }
  }

  return (
    <div className="command-palette-overlay" onMouseDown={close}>
      <div
        className="command-palette glass-panel"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="command-palette-search">
          <Search size={18} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder="Buscar ferramenta..."
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onKeyDown={onInputKeyDown}
          />
        </div>
        <div className="command-palette-list">
          {results.length === 0 ? (
            <div className="command-palette-empty">Nenhuma ferramenta encontrada</div>
          ) : (
            results.map((tool, index) => (
              <button
                key={tool.id}
                className={`command-palette-item ${index === clampedSelected ? 'selected' : ''}`}
                onMouseMove={() => setSelected(index)}
                onClick={() => go(index)}
              >
                <tool.icon size={16} />
                <span>{tool.name}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
