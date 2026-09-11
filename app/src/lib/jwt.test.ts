import { describe, it, expect } from 'vitest';
import { encodeBase64Url, decodeBase64Url, signHS256 } from './jwt';

describe('encodeBase64Url / decodeBase64Url', () => {
  it('faz round-trip preservando o conteúdo, inclusive acentos', () => {
    const original = JSON.stringify({ sub: '123', name: 'ção á é í ó ú' });
    expect(decodeBase64Url(encodeBase64Url(original))).toBe(original);
  });

  it('usa alfabeto url-safe, sem "+", "/" ou "="', () => {
    const encoded = encodeBase64Url('>>>???subject???<<<');
    expect(encoded).not.toMatch(/[+/=]/);
  });
});

describe('signHS256', () => {
  it('é determinística para a mesma mensagem e secret', () => {
    const message = 'header.payload';
    expect(signHS256(message, 'secret')).toBe(signHS256(message, 'secret'));
  });

  it('muda a assinatura quando o secret muda', () => {
    const message = 'header.payload';
    expect(signHS256(message, 'secret-a')).not.toBe(signHS256(message, 'secret-b'));
  });

  it('muda a assinatura quando a mensagem muda', () => {
    expect(signHS256('a.b', 'secret')).not.toBe(signHS256('a.c', 'secret'));
  });

  it('produz string url-safe (sem "+", "/" ou "=")', () => {
    expect(signHS256('msg', 'secret')).not.toMatch(/[+/=]/);
  });
});
