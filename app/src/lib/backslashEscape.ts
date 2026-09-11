const ESCAPE_MAP: Record<string, string> = {
  '\\': '\\\\',
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  '\0': '\\0',
  '"': '\\"',
  "'": "\\'",
  '\b': '\\b',
  '\f': '\\f',
  '\v': '\\v',
};

const UNESCAPE_MAP: Record<string, string> = {
  '\\\\': '\\',
  '\\n': '\n',
  '\\r': '\r',
  '\\t': '\t',
  '\\0': '\0',
  '\\"': '"',
  "\\'": "'",
  '\\b': '\b',
  '\\f': '\f',
  '\\v': '\v',
};

export function escape(text: string): string {
  return text.replace(/[\\"\n\r\t\0\b\f\v']/g, (ch) => ESCAPE_MAP[ch] ?? ch);
}

export function unescape(text: string): string {
  return text.replace(/\\(\\|n|r|t|0|"|'|b|f|v)/g, (seq) => UNESCAPE_MAP[seq] ?? seq);
}
