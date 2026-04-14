import { useState, useEffect } from 'react';

export function useClipboardData(autoRead: boolean = true) {
  const [clipboardText, setClipboardText] = useState('');

  useEffect(() => {
    if (!autoRead) return;

    const readClipboard = async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          setClipboardText(text);
        }
      } catch (err) {
        console.warn('Clipboard read failed or permission denied:', err);
      }
    };

    // Delay slightly to ensure focus or permission context
    setTimeout(readClipboard, 100);
  }, [autoRead]);

  return clipboardText;
}
