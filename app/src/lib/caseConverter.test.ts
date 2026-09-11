import { describe, it, expect } from 'vitest';
import { getWords, toCamelCase, toPascalCase, toSnakeCase, toKebabCase, toConstantCase, convertCase } from './caseConverter';

describe('getWords', () => {
  it('separa por espaço, underscore e hífen', () => {
    expect(getWords('hello world_foo-bar')).toEqual(['hello', 'world', 'foo', 'bar']);
  });

  it('separa limites de camelCase', () => {
    expect(getWords('helloWorldFoo')).toEqual(['hello', 'world', 'foo']);
  });

  it('ignora espaços extras e retorna vazio para string vazia', () => {
    expect(getWords('  hello   world  ')).toEqual(['hello', 'world']);
    expect(getWords('')).toEqual([]);
  });
});

describe('toCamelCase', () => {
  it('converte para camelCase', () => {
    expect(toCamelCase('hello world')).toBe('helloWorld');
    expect(toCamelCase('foo_bar-baz')).toBe('fooBarBaz');
  });
});

describe('toPascalCase', () => {
  it('converte para PascalCase', () => {
    expect(toPascalCase('hello world')).toBe('HelloWorld');
  });
});

describe('toSnakeCase / toKebabCase / toConstantCase', () => {
  it('converte para snake_case', () => {
    expect(toSnakeCase('Hello World')).toBe('hello_world');
  });

  it('converte para kebab-case', () => {
    expect(toKebabCase('Hello World')).toBe('hello-world');
  });

  it('converte para CONSTANT_CASE', () => {
    expect(toConstantCase('Hello World')).toBe('HELLO_WORLD');
  });
});

describe('convertCase', () => {
  it('retorna string vazia para input em branco', () => {
    expect(convertCase('camelCase', '   ')).toBe('');
  });

  it('despacha para a função certa de acordo com o tipo', () => {
    expect(convertCase('UPPERCASE', 'Hello')).toBe('HELLO');
    expect(convertCase('lowercase', 'Hello')).toBe('hello');
    expect(convertCase('kebab-case', 'Hello World')).toBe('hello-world');
    expect(convertCase('PascalCase', 'hello world')).toBe('HelloWorld');
  });
});
