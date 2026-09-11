import { describe, it, expect } from 'vitest';
import { execAllMatches } from './regexTester';

describe('execAllMatches', () => {
  it('retorna todas as ocorrências com a flag global', () => {
    const matches = execAllMatches('a', 'g', 'banana');
    expect(matches.map(m => m.index)).toEqual([1, 3, 5]);
  });

  it('retorna só a primeira ocorrência sem a flag global', () => {
    const matches = execAllMatches('a', '', 'banana');
    expect(matches).toHaveLength(1);
    expect(matches[0].index).toBe(1);
  });

  it('não entra em loop infinito com match de largura zero', () => {
    const matches = execAllMatches('x*', 'g', 'abc');
    expect(matches.every(m => m[0].length === 0)).toBe(true);
    // sem o guard de lastIndex, esse exec nunca retornaria (loop infinito / timeout do teste)
    expect(matches.length).toBeLessThanOrEqual('abc'.length + 2);
    expect(matches.at(-1)?.index).toBe(3);
  });

  it('propaga erro de regex inválida', () => {
    expect(() => execAllMatches('(', 'g', 'abc')).toThrow();
  });
});
