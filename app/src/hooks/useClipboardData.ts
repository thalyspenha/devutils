import { useEffect } from 'react';

/**
 * Lê o clipboard uma vez, ~100ms após a montagem, e entrega o texto via callback.
 * O callback roda fora de qualquer efeito no componente, então cada tool pode
 * chamar setState nele sem violar as regras de hooks.
 */
export function useClipboardData(onData: (text: string) => void, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text && !cancelled) onData(text);
      } catch (err) {
        console.warn('Clipboard read failed or permission denied:', err);
      }
    }, 100);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // onData é lido intencionalmente só na montagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
