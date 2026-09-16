export type DiffLine = { type: 'same' | 'added' | 'removed'; text: string };
/** Bounded line diff: avoids quadratic work on arbitrarily large submissions. */
export function revisionDiff(before: string, after: string): DiffLine[] {
  const left = before.split('\n');
  const right = after.split('\n');
  if (left.length * right.length > 250_000) return [
    ...left.map(text => ({ type: 'removed' as const, text })),
    ...right.map(text => ({ type: 'added' as const, text })),
  ];
  const matrix = Array.from({ length: left.length + 1 }, () => new Uint32Array(right.length + 1));
  for (let i = left.length - 1; i >= 0; i--) for (let j = right.length - 1; j >= 0; j--) {
    matrix[i][j] = left[i] === right[j] ? matrix[i + 1][j + 1] + 1 : Math.max(matrix[i + 1][j], matrix[i][j + 1]);
  }
  const lines: DiffLine[] = [];
  let i = 0, j = 0;
  while (i < left.length || j < right.length) {
    if (i < left.length && j < right.length && left[i] === right[j]) { lines.push({ type: 'same', text: left[i++] }); j++; }
    else if (j < right.length && (i === left.length || matrix[i][j + 1] >= matrix[i + 1][j])) lines.push({ type: 'added', text: right[j++] });
    else lines.push({ type: 'removed', text: left[i++] });
  }
  return lines;
}
