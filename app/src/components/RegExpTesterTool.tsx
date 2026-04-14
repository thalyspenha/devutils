import { useState, useMemo } from 'react';

export function RegExpTesterTool() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [testString, setTestString] = useState('');
  const [error, setError] = useState<string | null>(null);

  const matchResult = useMemo(() => {
    setError(null);
    if (!pattern) return null;
    try {
      const regex = new RegExp(pattern, flags);
      const matches = [];
      let match;
      
      if (regex.global) {
        let lastIndex = -1;
        while ((match = regex.exec(testString)) !== null) {
          if (regex.lastIndex === lastIndex) {
            regex.lastIndex++;
          }
          lastIndex = regex.lastIndex;
          matches.push(match);
        }
      } else {
        match = regex.exec(testString);
        if (match) matches.push(match);
      }
      return matches;
    } catch (e) {
      setError((e as Error).message);
      return null;
    }
  }, [pattern, flags, testString]);

  const renderHighlightedText = () => {
    if (!pattern || error || !matchResult || matchResult.length === 0) {
      return <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>{testString || 'Matches will be highlighted here...'}</div>;
    }

    try {
      const regex = new RegExp(pattern, flags);
      const parts = [];
      let lastIndex = 0;
      let match;
      
      if (regex.global) {
        let prevLastIndex = -1;
        while ((match = regex.exec(testString)) !== null) {
          if (regex.lastIndex === prevLastIndex) {
             regex.lastIndex++;
          }
          prevLastIndex = regex.lastIndex;
          
          if (match.index > lastIndex) {
            parts.push(<span key={`text-${lastIndex}`}>{testString.substring(lastIndex, match.index)}</span>);
          }
          if (match[0].length > 0) {
            parts.push(<span key={`match-${match.index}`} style={{ backgroundColor: 'rgba(56, 189, 248, 0.3)', color: 'var(--accent)', borderRadius: '2px', padding: '0 2px' }}>{match[0]}</span>);
          }
          lastIndex = match.index + match[0].length;
        }
      } else {
        match = regex.exec(testString);
        if (match) {
          if (match.index > lastIndex) {
            parts.push(<span key={`text-${lastIndex}`}>{testString.substring(lastIndex, match.index)}</span>);
          }
          parts.push(<span key={`match-${match.index}`} style={{ backgroundColor: 'rgba(56, 189, 248, 0.3)', color: 'var(--accent)', borderRadius: '2px', padding: '0 2px' }}>{match[0]}</span>);
          lastIndex = match.index + match[0].length;
        }
      }
      
      if (lastIndex < testString.length) {
        parts.push(<span key={`text-${lastIndex}`}>{testString.substring(lastIndex)}</span>);
      }
      
      return <div style={{ whiteSpace: 'pre-wrap', color: 'white' }}>{parts}</div>;
    } catch (e) {
      return <div style={{ whiteSpace: 'pre-wrap' }}>{testString}</div>;
    }
  };

  return (
    <div className="flex-col h-full" style={{ paddingBottom: '24px' }}>
      <div className="tool-header">
        <h2>RegExp Tester</h2>
        <p>Test and debug regular expressions in real-time</p>
      </div>
      
      <div className="tool-body">
        
        {/* Pattern Input */}
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '16px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>Regular Expression</h3>
          
          <div className="flex items-center gap-2 mb-2" style={{ background: 'var(--app-bg)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ color: 'var(--text-secondary)', paddingLeft: '8px', fontWeight: 'bold' }}>/</span>
            <input 
              type="text" 
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="Enter regular expression..."
              style={{ flex: 1, padding: '8px', border: 'none', background: 'transparent', color: 'var(--accent)', outline: 'none', fontFamily: 'monospace', fontSize: '16px' }}
            />
            <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>/</span>
            <input 
              type="text" 
              value={flags}
              onChange={(e) => setFlags(e.target.value)}
              placeholder="g"
              style={{ width: '60px', padding: '8px', border: 'none', background: 'transparent', color: 'white', outline: 'none', fontFamily: 'monospace', fontSize: '16px' }}
              title="Flags (e.g., g, m, i)"
            />
          </div>
          {error && <div style={{ color: 'var(--error-color)', fontSize: '14px', marginTop: '8px' }}>{error}</div>}
        </div>

        {/* Test String */}
        <div className="glass-panel" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="flex justify-between items-center mb-4">
             <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Test String</h3>
             {matchResult && pattern && !error && (
               <span style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--app-bg)', padding: '2px 8px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                 {matchResult.length} match{matchResult.length !== 1 ? 'es' : ''}
               </span>
             )}
          </div>
          
          <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: '200px' }}>
            <textarea 
               value={testString}
               onChange={(e) => setTestString(e.target.value)}
               placeholder="Enter text to test your regular expression against..."
               style={{ 
                 flex: 1,
                 padding: '12px 14px', 
                 borderRadius: '6px', 
                 border: '1px solid var(--border-color)', 
                 background: 'var(--app-bg)', 
                 color: 'white', 
                 fontFamily: 'monospace',
                 fontSize: '14px',
                 lineHeight: '1.5',
                 resize: 'none',
                 outline: 'none',
                 wordBreak: 'break-all'
               }}
               spellCheck="false"
             />
             <div 
               style={{ 
                 flex: 1,
                 padding: '12px 14px', 
                 borderRadius: '6px', 
                 border: '1px solid var(--border-color)', 
                 background: 'var(--app-bg)', 
                 color: 'var(--text-secondary)', 
                 fontFamily: 'monospace',
                 fontSize: '14px',
                 lineHeight: '1.5',
                 overflowY: 'auto',
                 wordBreak: 'break-all',
                 minHeight: '200px'
               }}
             >
               {renderHighlightedText()}
             </div>
          </div>
        </div>
        
        {/* Match Details */}
        {matchResult && matchResult.length > 0 && !error && (
          <div className="glass-panel" style={{ padding: '24px', marginTop: '16px', maxHeight: '300px', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>Match Details</h3>
            <div className="flex flex-col gap-2">
              {matchResult.slice(0, 50).map((match, i) => (
                <div key={i} style={{ background: 'var(--app-bg)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                   <div style={{ marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                     <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Match {i + 1}</span>
                     <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Index: {match.index}</span>
                   </div>
                   <div style={{ fontFamily: 'monospace', color: 'var(--accent)', wordBreak: 'break-all' }}>
                     {match[0]}
                   </div>
                   {match.length > 1 && (
                     <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--border-color)' }}>
                       <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Capture Groups</div>
                       {Array.from(match).slice(1).map((group, j) => (
                         <div key={j} style={{ display: 'flex', gap: '8px', fontSize: '13px', fontFamily: 'monospace', marginBottom: '4px' }}>
                           <span style={{ color: 'var(--text-secondary)' }}>Group {j + 1}:</span>
                           <span style={{ color: group === undefined ? 'var(--text-secondary)' : 'var(--text)', fontStyle: group === undefined ? 'italic' : 'normal' }}>
                             {group === undefined ? 'undefined' : String(group)}
                           </span>
                         </div>
                       ))}
                     </div>
                   )}
                </div>
              ))}
              {matchResult.length > 50 && (
                 <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '12px', fontSize: '13px' }}>
                   Showing first 50 of {matchResult.length} matches.
                 </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
