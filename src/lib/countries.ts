import { NO_EXTRAS } from './bill';
import type { Extras } from './types';

export type TipCulture = 'none' | 'roundup' | 'optional' | 'expected';

export interface CountryPreset {
  code: string; // ISO 3166-1 alpha-2, or "XX" for custom
  currency: string;
  service: number; // typical service charge %
  tax: number; // typical VAT / GST / sales tax %
  taxIncluded: boolean;
  taxOnService?: boolean;
  tipCulture: TipCulture;
  tips: number[]; // tip % quick picks
  defaultTip?: number;
  cover?: number; // typical cover charge per person
  payApps: string[];
  /** Local name for the service charge, shown next to the field. */
  serviceName?: string;
  taxName?: string;
}

// Typical restaurant conventions. These are starting points — every value is
// editable in the app because rates differ by city, state and restaurant.
export const COUNTRIES: CountryPreset[] = [
  { code: 'HK', currency: 'HKD', service: 10, tax: 0, taxIncluded: true, tipCulture: 'none', tips: [0, 5, 10], payApps: ['PayMe', 'FPS 轉數快', 'AlipayHK', 'WeChat Pay HK'], serviceName: '加一' },
  { code: 'MO', currency: 'MOP', service: 10, tax: 0, taxIncluded: true, tipCulture: 'none', tips: [0, 5, 10], payApps: ['MPay', 'BOC Pay', 'AlipayMO'], serviceName: '加一' },
  { code: 'TW', currency: 'TWD', service: 10, tax: 5, taxIncluded: true, tipCulture: 'none', tips: [0, 5, 10], payApps: ['LINE Pay', '街口支付', 'Bank transfer 轉帳'] },
  { code: 'CN', currency: 'CNY', service: 0, tax: 6, taxIncluded: true, tipCulture: 'none', tips: [0, 5, 10], payApps: ['WeChat Pay 微信支付', 'Alipay 支付宝'] },
  { code: 'JP', currency: 'JPY', service: 0, tax: 10, taxIncluded: true, tipCulture: 'none', tips: [0, 5, 10], cover: 0, payApps: ['PayPay', 'LINE Pay', '楽天ペイ'], taxName: '消費税' },
  { code: 'KR', currency: 'KRW', service: 0, tax: 10, taxIncluded: true, tipCulture: 'none', tips: [0, 5, 10], payApps: ['Toss', 'KakaoPay', 'Naver Pay'] },
  { code: 'SG', currency: 'SGD', service: 10, tax: 9, taxIncluded: false, taxOnService: true, tipCulture: 'none', tips: [0, 5, 10], payApps: ['PayNow', 'PayLah!', 'GrabPay'], taxName: 'GST' },
  { code: 'MY', currency: 'MYR', service: 10, tax: 6, taxIncluded: false, taxOnService: true, tipCulture: 'none', tips: [0, 5, 10], payApps: ['DuitNow', "Touch 'n Go", 'GrabPay'], taxName: 'SST' },
  { code: 'TH', currency: 'THB', service: 10, tax: 7, taxIncluded: false, taxOnService: true, tipCulture: 'roundup', tips: [0, 5, 10], payApps: ['PromptPay', 'TrueMoney'], taxName: 'VAT' },
  { code: 'VN', currency: 'VND', service: 5, tax: 8, taxIncluded: false, taxOnService: true, tipCulture: 'roundup', tips: [0, 5, 10], payApps: ['MoMo', 'ZaloPay', 'VietQR'], taxName: 'VAT' },
  { code: 'PH', currency: 'PHP', service: 10, tax: 12, taxIncluded: true, tipCulture: 'optional', tips: [0, 5, 10], payApps: ['GCash', 'Maya'], taxName: 'VAT' },
  { code: 'ID', currency: 'IDR', service: 5, tax: 10, taxIncluded: false, taxOnService: true, tipCulture: 'optional', tips: [0, 5, 10], payApps: ['QRIS', 'GoPay', 'OVO', 'DANA'], taxName: 'PB1' },
  { code: 'IN', currency: 'INR', service: 0, tax: 5, taxIncluded: false, tipCulture: 'optional', tips: [0, 5, 10], payApps: ['UPI', 'PhonePe', 'Google Pay', 'Paytm'], taxName: 'GST' },
  { code: 'AE', currency: 'AED', service: 10, tax: 5, taxIncluded: false, taxOnService: true, tipCulture: 'optional', tips: [0, 10, 15], payApps: ['Bank transfer', 'Careem Pay'], taxName: 'VAT' },
  { code: 'AU', currency: 'AUD', service: 0, tax: 10, taxIncluded: true, tipCulture: 'optional', tips: [0, 5, 10], payApps: ['PayID', 'Beem', 'Bank transfer'], taxName: 'GST' },
  { code: 'NZ', currency: 'NZD', service: 0, tax: 15, taxIncluded: true, tipCulture: 'optional', tips: [0, 5, 10], payApps: ['Bank transfer'], taxName: 'GST' },
  { code: 'US', currency: 'USD', service: 0, tax: 8, taxIncluded: false, tipCulture: 'expected', tips: [15, 18, 20, 22, 25], defaultTip: 18, payApps: ['Venmo', 'Zelle', 'Cash App', 'PayPal'], taxName: 'Sales tax' },
  { code: 'CA', currency: 'CAD', service: 0, tax: 13, taxIncluded: false, tipCulture: 'expected', tips: [15, 18, 20, 22], defaultTip: 15, payApps: ['Interac e-Transfer', 'PayPal'], taxName: 'GST/HST' },
  { code: 'MX', currency: 'MXN', service: 0, tax: 16, taxIncluded: true, tipCulture: 'expected', tips: [10, 12, 15, 20], defaultTip: 10, payApps: ['SPEI', 'Mercado Pago'], taxName: 'IVA' },
  { code: 'BR', currency: 'BRL', service: 10, tax: 0, taxIncluded: true, tipCulture: 'none', tips: [0, 5, 10], payApps: ['Pix'], serviceName: 'Serviço (10%)' },
  { code: 'AR', currency: 'ARS', service: 0, tax: 21, taxIncluded: true, tipCulture: 'expected', tips: [10, 15], defaultTip: 10, payApps: ['Mercado Pago', 'Transferencia'], serviceName: 'Cubierto' },
  { code: 'GB', currency: 'GBP', service: 12.5, tax: 20, taxIncluded: true, tipCulture: 'optional', tips: [0, 10, 12.5, 15], payApps: ['Bank transfer', 'Monzo', 'Revolut', 'PayPal'], taxName: 'VAT' },
  { code: 'IE', currency: 'EUR', service: 0, tax: 13.5, taxIncluded: true, tipCulture: 'optional', tips: [0, 10, 12.5, 15], payApps: ['Revolut', 'Bank transfer'], taxName: 'VAT' },
  { code: 'FR', currency: 'EUR', service: 0, tax: 10, taxIncluded: true, tipCulture: 'roundup', tips: [0, 5, 10], payApps: ['Wero', 'Lydia / Sumeria', 'Virement'], taxName: 'TVA' },
  { code: 'DE', currency: 'EUR', service: 0, tax: 19, taxIncluded: true, tipCulture: 'roundup', tips: [0, 5, 10], payApps: ['PayPal', 'Wero', 'Überweisung'], taxName: 'MwSt.' },
  { code: 'IT', currency: 'EUR', service: 0, tax: 10, taxIncluded: true, tipCulture: 'roundup', tips: [0, 5, 10], cover: 2.5, payApps: ['Satispay', 'Bonifico', 'PayPal'], taxName: 'IVA' },
  { code: 'ES', currency: 'EUR', service: 0, tax: 10, taxIncluded: true, tipCulture: 'roundup', tips: [0, 5, 10], payApps: ['Bizum', 'Transferencia'], taxName: 'IVA' },
  { code: 'PT', currency: 'EUR', service: 0, tax: 13, taxIncluded: true, tipCulture: 'roundup', tips: [0, 5, 10], cover: 0, payApps: ['MB WAY'], taxName: 'IVA' },
  { code: 'NL', currency: 'EUR', service: 0, tax: 9, taxIncluded: true, tipCulture: 'roundup', tips: [0, 5, 10], payApps: ['Tikkie', 'iDEAL'], taxName: 'BTW' },
  { code: 'CH', currency: 'CHF', service: 0, tax: 8.1, taxIncluded: true, tipCulture: 'roundup', tips: [0, 5, 10], payApps: ['TWINT'], taxName: 'MWST' },
  { code: 'SE', currency: 'SEK', service: 0, tax: 12, taxIncluded: true, tipCulture: 'roundup', tips: [0, 5, 10], payApps: ['Swish'], taxName: 'Moms' },
  { code: 'TR', currency: 'TRY', service: 0, tax: 10, taxIncluded: true, tipCulture: 'optional', tips: [0, 5, 10], payApps: ['Papara', 'Havale/EFT'], taxName: 'KDV' },
  { code: 'ZA', currency: 'ZAR', service: 0, tax: 15, taxIncluded: true, tipCulture: 'expected', tips: [10, 12, 15], defaultTip: 10, payApps: ['EFT', 'SnapScan'], taxName: 'VAT' },
  { code: 'XX', currency: 'USD', service: 0, tax: 0, taxIncluded: true, tipCulture: 'optional', tips: [0, 5, 10, 15], payApps: ['Bank transfer', 'PayPal', 'Wise', 'Revolut', 'Cash'] },
];

export function getCountry(code: string | null | undefined): CountryPreset {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[COUNTRIES.length - 1];
}

/** Charges that a restaurant in this country would usually put on the bill. */
export function extrasFor(code: string): Extras {
  const c = getCountry(code);
  return {
    ...NO_EXTRAS,
    service: c.service,
    tax: c.tax,
    taxIncluded: c.taxIncluded,
    taxOnService: !!c.taxOnService,
    tip: c.defaultTip ?? 0,
    cover: c.cover ?? 0,
  };
}

export function flagEmoji(code: string): string {
  if (!/^[A-Z]{2}$/.test(code) || code === 'XX') return '🌐';
  return String.fromCodePoint(...[...code].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

/** Guess the user's country from their browser language / time zone. */
export function guessCountry(): string {
  const langs = typeof navigator !== 'undefined' ? navigator.languages || [navigator.language] : [];
  for (const l of langs) {
    const region = l.split('-').find((part, i) => i > 0 && /^[A-Z]{2}$/.test(part));
    if (region && COUNTRIES.some((c) => c.code === region)) return region;
  }
  const tz = typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone || '' : '';
  const tzMap: Record<string, string> = {
    'Asia/Hong_Kong': 'HK', 'Asia/Macau': 'MO', 'Asia/Taipei': 'TW', 'Asia/Shanghai': 'CN', 'Asia/Tokyo': 'JP',
    'Asia/Seoul': 'KR', 'Asia/Singapore': 'SG', 'Asia/Kuala_Lumpur': 'MY', 'Asia/Bangkok': 'TH',
    'Asia/Ho_Chi_Minh': 'VN', 'Asia/Manila': 'PH', 'Asia/Jakarta': 'ID', 'Asia/Kolkata': 'IN', 'Asia/Dubai': 'AE',
    'Europe/London': 'GB', 'Europe/Dublin': 'IE', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Rome': 'IT',
    'Europe/Madrid': 'ES', 'Europe/Lisbon': 'PT', 'Europe/Amsterdam': 'NL', 'Europe/Zurich': 'CH',
    'Europe/Stockholm': 'SE', 'Europe/Istanbul': 'TR', 'Africa/Johannesburg': 'ZA', 'America/Mexico_City': 'MX',
    'America/Sao_Paulo': 'BR', 'America/Argentina/Buenos_Aires': 'AR', 'America/Toronto': 'CA',
    'America/Vancouver': 'CA', 'Pacific/Auckland': 'NZ',
  };
  if (tzMap[tz]) return tzMap[tz];
  if (tz.startsWith('Australia/')) return 'AU';
  if (tz.startsWith('America/')) return 'US';
  const lang = (langs[0] || '').toLowerCase();
  const langMap: Record<string, string> = { ja: 'JP', ko: 'KR', th: 'TH', fr: 'FR', de: 'DE', es: 'ES', it: 'IT', id: 'ID', vi: 'VN' };
  return langMap[lang.split('-')[0]] ?? 'XX';
}
