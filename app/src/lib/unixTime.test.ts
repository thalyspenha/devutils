import { describe, it, expect } from 'vitest';
import { parseUnixInput } from './unixTime';

describe('parseUnixInput', () => {
  it('interpreta números <= 1e12 como segundos', () => {
    const result = parseUnixInput('1710537000');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.date.getTime()).toBe(1710537000 * 1000);
  });

  it('interpreta números > 1e12 como milissegundos', () => {
    const result = parseUnixInput('1710537000000');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.date.getTime()).toBe(1710537000000);
  });

  it('rejeita entrada não numérica', () => {
    const result = parseUnixInput('não é número');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/inválido/i);
  });

  it('rejeita timestamp fora do intervalo válido de Date', () => {
    const result = parseUnixInput('1e300');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/intervalo/i);
  });
});
