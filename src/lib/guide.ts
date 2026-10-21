import type { CountryPreset } from './countries';

/** Typical tip range for a country, e.g. "15–25%", or "" when tipping isn't a thing. */
export function tipRange(c: CountryPreset): string {
  const tips = c.tips.filter((x) => x > 0);
  if (c.tipCulture === 'none' || c.tipCulture === 'roundup' || tips.length === 0) return '';
  const lo = Math.min(...tips);
  const hi = Math.max(...tips);
  return lo === hi ? `${lo}%` : `${lo}–${hi}%`;
}
