import { useCallback, useRef, useState } from 'react';

/**
 * Copia texto para o clipboard e expõe um estado que volta ao normal após
 * `timeout` ms — para o feedback visual ("Copiado!") nos botões de copiar.
 *
 * `copy(text, key?)`: passe uma `key` quando a mesma tela tem mais de um botão
 * de copiar (ex.: chave pública/privada) e compare com `copiedKey`.
 * Para telas com um botão só, use o booleano `copied`.
 */
export function useCopy(timeout = 1500) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const copy = useCallback(
    (text: string, key = 'default') => {
      if (!text) return;
      void navigator.clipboard
        .writeText(text)
        .then(() => {
          setCopiedKey(key);
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => setCopiedKey(null), timeout);
        })
        .catch(() => {
          /* clipboard indisponível — falha silenciosa, como o resto do app */
        });
    },
    [timeout],
  );

  return { copy, copiedKey, copied: copiedKey !== null };
}
