import { describe, it, expect } from 'vitest';
import { escape, unescape } from './backslashEscape';

describe('escape', () => {
  it('escapa sequências especiais', () => {
    expect(escape('line1\nline2')).toBe('line1\\nline2');
    expect(escape('a\tb')).toBe('a\\tb');
    expect(escape('back\\slash')).toBe('back\\\\slash');
    expect(escape('quote"here')).toBe('quote\\"here');
  });

  it('mantém caracteres comuns intactos', () => {
    expect(escape('hello world')).toBe('hello world');
  });
});

describe('unescape', () => {
  it('remove o escape das sequências suportadas', () => {
    expect(unescape('line1\\nline2')).toBe('line1\nline2');
    expect(unescape('a\\tb')).toBe('a\tb');
    expect(unescape('back\\\\slash')).toBe('back\\slash');
  });

  it('ignora sequências desconhecidas', () => {
    expect(unescape('\\z')).toBe('\\z');
  });

  it('faz round-trip com escape', () => {
    const original = 'a\nb\tc\\d"e\'f\r\0g';
    expect(unescape(escape(original))).toBe(original);
  });
});
