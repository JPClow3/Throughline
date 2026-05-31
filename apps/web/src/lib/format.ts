/**
 * The app's display locale. All UI copy is English, so dates and times are
 * formatted with an explicit locale rather than the visitor's system locale —
 * otherwise an English UI can render weekdays/months in another language.
 */
export const APP_LOCALE = "en-US";

/** Capitalize the first character of a string (locale-safe for display labels). */
export function capitalizeFirst(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toLocaleUpperCase() + value.slice(1);
}
