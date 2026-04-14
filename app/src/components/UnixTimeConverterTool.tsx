import { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

export function UnixTimeConverterTool() {
  const [currentUnix, setCurrentUnix] = useState(Math.floor(Date.now() / 1000));
  
  // Unix to Date
  const [unixInput, setUnixInput] = useState('');
  const [dateOutput, setDateOutput] = useState<{ local: string; utc: string } | null>(null);
  const [unixError, setUnixError] = useState('');

  // Date to Unix
  const [dateInput, setDateInput] = useState(() => {
    const now = new Date();
    // Format to YYYY-MM-DDThh:mm for datetime-local input
    return now.toISOString().slice(0, 16);
  });
  const [unixOutput, setUnixOutput] = useState<number | null>(null);

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentUnix(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleUnixConvert = () => {
    setUnixError('');
    setDateOutput(null);
    
    if (!unixInput.trim()) return;

    const num = Number(unixInput);
    if (isNaN(num)) {
      setUnixError('Invalid number format.');
      return;
    }

    // Heuristic: if > 1e12, it's likely milliseconds. Otherwise, seconds.
    const isMilliseconds = num > 1e12;
    const ms = isMilliseconds ? num : num * 1000;
    
    const date = new Date(ms);
    if (isNaN(date.getTime())) {
      setUnixError('Invalid timestamp value out of range.');
      return;
    }

    setDateOutput({
      local: date.toLocaleString(),
      utc: date.toUTCString()
    });
  };

  const handleDateConvert = () => {
    if (!dateInput) return;
    const date = new Date(dateInput);
    if (!isNaN(date.getTime())) {
      setUnixOutput(Math.floor(date.getTime() / 1000));
    } else {
      setUnixOutput(null);
    }
  };

  useEffect(() => {
    handleDateConvert();
  }, [dateInput]);

  return (
    <div className="flex-col h-full">
      <div className="tool-header">
        <h2>Unix Time Converter</h2>
        <p>Convert Unix timestamps to human-readable dates and vice versa</p>
      </div>
      
      <div className="tool-body">
        
        {/* Current Time Widget */}
        <div className="glass-panel p-6 flex flex-col items-center justify-center gap-2" style={{ padding: '24px' }}>
          <div className="text-secondary text-sm font-medium uppercase tracking-wider">Current Unix Time (seconds)</div>
          <div className="text-4xl font-mono font-bold text-accent">{currentUnix}</div>
        </div>

        {/* Unix to Date Section */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>Timestamp to Date</h3>
          <div className="flex items-center gap-4 mb-4">
            <input 
              type="text" 
              value={unixInput}
              onChange={(e) => setUnixInput(e.target.value)}
              placeholder="e.g. 1710537000"
              style={{ flex: 1, padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--app-bg)', color: 'white', fontFamily: 'monospace' }}
              onKeyDown={(e) => e.key === 'Enter' && handleUnixConvert()}
            />
            <button onClick={handleUnixConvert} className="flex items-center gap-2">
              Convert <ArrowRight size={16} />
            </button>
          </div>
          
          {unixError && <div style={{ color: 'var(--error-color)', fontSize: '14px', marginBottom: '12px' }}>{unixError}</div>}
          
          {dateOutput && (
            <div style={{ background: 'var(--app-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="flex justify-between items-center" style={{ paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                <span className="text-secondary" style={{ fontSize: '13px' }}>Local Time</span>
                <span className="font-mono text-primary font-medium">{dateOutput.local}</span>
              </div>
              <div className="flex justify-between items-center" style={{ paddingTop: '8px' }}>
                <span className="text-secondary" style={{ fontSize: '13px' }}>UTC Time</span>
                <span className="font-mono text-primary font-medium">{dateOutput.utc}</span>
              </div>
            </div>
          )}
        </div>

        {/* Date to Unix Section */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>Date to Timestamp (Local)</h3>
          <div className="flex items-center gap-4 mb-4">
            <input 
              type="datetime-local" 
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              style={{ flex: 1, padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--app-bg)', color: 'white' }}
            />
          </div>
          
          {unixOutput !== null && (
            <div style={{ background: 'var(--app-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div className="flex justify-between items-center">
                <span className="text-secondary" style={{ fontSize: '13px' }}>Unix Timestamp (seconds)</span>
                <span className="font-mono text-accent text-lg font-bold">{unixOutput}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
