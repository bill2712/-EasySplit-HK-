// Money helpers. Amounts are entered as normal numbers ("major" units, e.g. 12.5),
// but every calculation that has to add up exactly is done in integer "minor"
// units (cents, or whole yen for JPY) so totals never drift by a cent.

// Currencies that ISO lists with decimals but nobody uses cents for in practice.
const PRACTICAL_DECIMALS: Record<string, number> = {
  TWD: 0,
  IDR: 0,
  HUF: 0,
  PKR: 0,
  LKR: 2,
};

const decimalsCache = new Map<string, number>();

export function currencyDecimals(currency: string): number {
  const cached = decimalsCache.get(currency);
  if (cached !== undefined) return cached;
  let d = PRACTICAL_DECIMALS[currency];
  if (d === undefined) {
    try {
      d = new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
        .maximumFractionDigits ?? 2;
    } catch {
      d = 2;
    }
  }
  decimalsCache.set(currency, d);
  return d;
}

export function toMinor(amount: number, currency: string): number {
  if (!Number.isFinite(amount)) return 0;
  const f = 10 ** currencyDecimals(currency);
  // Nudge by a tiny epsilon so 1.005 rounds to 1.01 instead of 1.00.
  return Math.round(amount * f + Math.sign(amount) * 1e-7);
}

export function fromMinor(minor: number, currency: string): number {
  return minor / 10 ** currencyDecimals(currency);
}

/**
 * Split an integer total into integer parts proportional to `weights`,
 * so the parts always sum exactly to `total` (largest remainder method).
 */
export function allocate(total: number, weights: number[]): number[] {
  const n = weights.length;
  if (n === 0) return [];
  if (total < 0) return allocate(-total, weights).map((v) => -v || 0);
  const clean = weights.map((w) => (Number.isFinite(w) && w > 0 ? w : 0));
  let sum = clean.reduce((a, b) => a + b, 0);
  const w = sum > 0 ? clean : clean.map(() => 1);
  if (sum <= 0) sum = n;
  const raw = w.map((x) => (total * x) / sum);
  const parts = raw.map((x) => Math.floor(x + 1e-9));
  const rest = total - parts.reduce((a, b) => a + b, 0);
  const order = raw
    .map((x, i) => ({ i, frac: x - Math.floor(x + 1e-9) }))
    .filter((o) => w[o.i] > 0)
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (let k = 0; k < rest; k++) parts[order[k % order.length].i] += 1;
  return parts;
}

const formatCache = new Map<string, Intl.NumberFormat>();

function formatter(locale: string, currency: string, compact = false): Intl.NumberFormat {
  const key = `${locale}|${currency}|${compact}`;
  let f = formatCache.get(key);
  if (!f) {
    const d = currencyDecimals(currency);
    try {
      f = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: compact ? 0 : d,
        maximumFractionDigits: d,
      });
    } catch {
      f = new Intl.NumberFormat('en', { style: 'currency', currency: 'USD' });
    }
    formatCache.set(key, f);
  }
  return f;
}

/** Format an amount given in minor units. `compact` drops ".00" on whole amounts. */
export function formatMinor(minor: number, currency: string, locale: string, compact = false): string {
  const whole = minor % 10 ** currencyDecimals(currency) === 0;
  return formatter(locale, currency, compact && whole).format(fromMinor(minor, currency) || 0);
}

/** Format an amount given in major units. */
export function formatMoney(amount: number, currency: string, locale: string, compact = false): string {
  return formatMinor(toMinor(amount, currency), currency, locale, compact);
}

/** Round a minor amount up (or to nearest) to a step expressed in minor units. */
export function roundToStep(minor: number, stepMinor: number, mode: 'up' | 'nearest' = 'up'): number {
  if (!stepMinor || stepMinor <= 0) return minor;
  const q = minor / stepMinor;
  return (mode === 'up' ? Math.ceil(q - 1e-9) : Math.round(q)) * stepMinor || 0;
}

// Currencies whose everyday prices are in the thousands.
const BIG_UNIT = new Set([
  'KRW', 'IDR', 'VND', 'COP', 'CLP', 'PYG', 'UZS', 'IRR', 'LAK', 'MMK', 'KHR', 'UGX', 'TZS', 'LBP', 'MNT',
]);

/** Sensible "round each person's share" steps for a currency, in major units. */
export function roundingSteps(currency: string): number[] {
  if (BIG_UNIT.has(currency)) return [100, 500, 1000, 5000, 10000];
  if (currencyDecimals(currency) === 0) return [1, 10, 50, 100, 500];
  return [0.1, 0.5, 1, 5, 10];
}

/**
 * Parse what someone typed into an amount box. Accepts "1,234.50", "1234,5"
 * and simple sums like "120+35.5" or "3*48" — handy at the table.
 */
export function parseAmount(input: string): number | null {
  if (input == null) return null;
  let s = String(input).trim().replace(/[\s ']/g, '');
  if (!s) return null;
  s = s.replace(/[×xX]/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-');
  s = s.replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  // Normalise number tokens: decide per token whether "," is a decimal or thousands mark.
  s = s.replace(/[\d.,]+/g, (tok) => {
    const lastComma = tok.lastIndexOf(',');
    const lastDot = tok.lastIndexOf('.');
    if (lastComma === -1) return tok;
    if (lastDot > lastComma) return tok.replace(/,/g, '');
    if (lastDot !== -1) return tok.replace(/\./g, '').replace(',', '.');
    const after = tok.length - lastComma - 1;
    const commas = (tok.match(/,/g) || []).length;
    if (commas === 1 && after !== 3) return tok.replace(',', '.');
    return tok.replace(/,/g, '');
  });
  if (!/^[\d.+\-*/()]+$/.test(s)) return null;
  try {
    const value = evaluate(s);
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

// Tiny recursive-descent evaluator for + - * / and parentheses (no eval()).
function evaluate(src: string): number {
  let pos = 0;
  const peek = () => src[pos];
  const expr = (): number => {
    let v = term();
    while (peek() === '+' || peek() === '-') {
      const op = src[pos++];
      const r = term();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  };
  const term = (): number => {
    let v = factor();
    while (peek() === '*' || peek() === '/') {
      const op = src[pos++];
      const r = factor();
      v = op === '*' ? v * r : v / r;
    }
    return v;
  };
  const factor = (): number => {
    if (peek() === '-') {
      pos++;
      return -factor();
    }
    if (peek() === '+') {
      pos++;
      return factor();
    }
    if (peek() === '(') {
      pos++;
      const v = expr();
      if (peek() !== ')') throw new Error('paren');
      pos++;
      return v;
    }
    const m = /^\d*\.?\d+|^\d+\.?/.exec(src.slice(pos));
    if (!m) throw new Error('num');
    pos += m[0].length;
    return parseFloat(m[0]);
  };
  const v = expr();
  if (pos !== src.length) throw new Error('trailing');
  return v;
}
