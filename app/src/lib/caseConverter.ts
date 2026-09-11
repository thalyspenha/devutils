export type CaseType = 'camelCase' | 'snake_case' | 'PascalCase' | 'kebab-case' | 'UPPERCASE' | 'lowercase' | 'CONSTANT_CASE';

export function getWords(str: string) {
  return str.replace(/([a-z])([A-Z])/g, '$1 $2').split(/[\s_-]+/).filter(Boolean).map(w => w.toLowerCase());
}

export function toCamelCase(str: string) {
  return getWords(str).map((w, i) => i === 0 ? w : w[0].toUpperCase() + w.slice(1)).join('');
}

export function toPascalCase(str: string) {
  return getWords(str).map(w => w[0].toUpperCase() + w.slice(1)).join('');
}

export const toSnakeCase = (str: string) => getWords(str).join('_');

export const toKebabCase = (str: string) => getWords(str).join('-');

export const toConstantCase = (str: string) => getWords(str).join('_').toUpperCase();

export function convertCase(type: CaseType, str: string) {
  if (!str.trim()) return '';
  switch (type) {
    case 'camelCase': return toCamelCase(str);
    case 'PascalCase': return toPascalCase(str);
    case 'snake_case': return toSnakeCase(str);
    case 'kebab-case': return toKebabCase(str);
    case 'CONSTANT_CASE': return toConstantCase(str);
    case 'UPPERCASE': return str.toUpperCase();
    case 'lowercase': return str.toLowerCase();
    default: return str;
  }
}
