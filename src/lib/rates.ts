// Live exchange rates from open.er-api.com (free, no key, CORS enabled).
// Results are cached so the app keeps working offline on a trip.

interface Cached {
  base: string;
  at: number;
  rates: Record<string, number>; // 1 base = x currency
}

const KEY = 'easysplit:rates:';
const MAX_AGE = 12 * 60 * 60 * 1000;

function readCache(base: string): Cached | null {
  try {
    const raw = localStorage.getItem(KEY + base);
    return raw ? (JSON.parse(raw) as Cached) : null;
  } catch {
    return null;
  }
}

export async function fetchRates(base: string, force = false): Promise<Cached | null> {
  const cached = readCache(base);
  if (!force && cached && Date.now() - cached.at < MAX_AGE) return cached;
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`);
    const data = await res.json();
    if (data?.result !== 'success' || !data.rates) throw new Error('bad response');
    const fresh: Cached = { base, at: Date.now(), rates: data.rates };
    try {
      localStorage.setItem(KEY + base, JSON.stringify(fresh));
    } catch {
      /* storage full or blocked: still return the rates */
    }
    return fresh;
  } catch {
    return cached;
  }
}

/** Value of 1 `currency` in `base`, or null if unknown. */
export async function rateToBase(currency: string, base: string, force = false): Promise<{ rate: number; at: number } | null> {
  if (currency === base) return { rate: 1, at: Date.now() };
  const data = await fetchRates(base, force);
  const r = data?.rates[currency];
  if (!data || !r) return null;
  return { rate: 1 / r, at: data.at };
}

/** Round a rate to a readable number of significant digits. */
export function niceRate(rate: number): number {
  if (!rate) return 0;
  return Number(rate.toPrecision(6));
}
