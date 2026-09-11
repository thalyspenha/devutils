/**
 * Retorna uma função `paste()` que lê o clipboard sob demanda — chamada a
 * partir de uma ação explícita do usuário (botão "Colar"), nunca sozinha
 * no mount. Entrega o texto via callback; falha silenciosa se o clipboard
 * estiver indisponível ou sem permissão.
 */
export function useClipboardData(onData: (text: string) => void) {
  return () => {
    navigator.clipboard
      .readText()
      .then((text) => {
        if (text) onData(text);
      })
      .catch((err) => {
        console.warn('Clipboard read failed or permission denied:', err);
      });
  };
}
