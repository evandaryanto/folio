export function enumToPgEnum<T extends Record<string, string>>(
  e: T,
): [T[keyof T], ...T[keyof T][]] {
  return Object.values(e) as [T[keyof T], ...T[keyof T][]];
}
