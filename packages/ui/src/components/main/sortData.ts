export type SortDirection = "asc" | "desc";

export function sortData<T extends Record<string, string | number>>(
  data: T[],
  key: keyof T,
  direction: SortDirection = "desc"
): T[] {
  return [...data].sort((left, right) => {
    const leftValue = left[key];
    const rightValue = right[key];
    const comparison = typeof leftValue === "string"
      ? leftValue.localeCompare(String(rightValue))
      : Number(leftValue) - Number(rightValue);

    return direction === "asc" ? comparison : -comparison;
  });
}
