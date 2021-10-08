
function compare(a: string | number, b: string | number) {
  if (a < b) { return -1; }
  if (a > b) { return 1; }
  return 0;
}

export function sortArrayOfObjects<T>(arr: T[], cb: ((obj: T) => string | number)): T[] {
  const sorted = arr.concat();
  sorted.sort((a, b) => compare(cb(a), cb(b)));
  return sorted;
}
