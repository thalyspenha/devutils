export type UnixParseResult = { ok: true; date: Date } | { ok: false; error: string };

// Heuristic: if > 1e12, it's likely milliseconds. Otherwise, seconds.
export function parseUnixInput(input: string): UnixParseResult {
  const num = Number(input);
  if (isNaN(num)) return { ok: false, error: 'Formato de número inválido.' };

  const ms = num > 1e12 ? num : num * 1000;
  const date = new Date(ms);
  if (isNaN(date.getTime())) return { ok: false, error: 'Valor de timestamp fora do intervalo válido.' };

  return { ok: true, date };
}
