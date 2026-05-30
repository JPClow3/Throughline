/** Capitalize the first character of a string (locale-safe for display labels). */
export function capitalizeFirst(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toLocaleUpperCase() + value.slice(1);
}
