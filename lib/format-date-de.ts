/**
 * German date formatting.
 *
 * notion-utils' own `formatDate` hardcodes `en-US`, so every date rendered by
 * react-notion-x comes out as "Feb 11, 2026". This replaces it.
 *
 * Notion stores plain dates as `YYYY-MM-DD` with no timezone. Formatting those
 * in local time shifts them a day backwards west of UTC, so read them as UTC —
 * the same thing notion-utils does with getUTCDate()/getUTCFullYear().
 */
export function formatDateDe(
  input: string | number,
  { month = 'long' }: { month?: 'long' | 'short' } = {}
): string {
  return new Date(input).toLocaleDateString('de-DE', {
    day: 'numeric',
    month,
    year: 'numeric',
    timeZone: 'UTC'
  })
}
