// Guarda contra loop infinito em matches de largura zero (ex.: pattern "x*" com flag "g").
export function execAllMatches(pattern: string, flags: string, testString: string): RegExpExecArray[] {
  const regex = new RegExp(pattern, flags);
  const matches: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;

  if (regex.global) {
    let lastIndex = -1;
    while ((match = regex.exec(testString)) !== null) {
      if (regex.lastIndex === lastIndex) {
        regex.lastIndex++;
      }
      lastIndex = regex.lastIndex;
      matches.push(match);
    }
  } else {
    match = regex.exec(testString);
    if (match) matches.push(match);
  }
  return matches;
}
