import { describe, expect, it } from 'vitest';
import en from './locales/en';
import zhHK from './locales/zh-HK';
import zhCN from './locales/zh-CN';
import ja from './locales/ja';
import ko from './locales/ko';
import th from './locales/th';
import es from './locales/es';
import fr from './locales/fr';
import de from './locales/de';

const LOCALES: Record<string, Record<string, string>> = { 'zh-HK': zhHK, 'zh-CN': zhCN, ja, ko, th, es, fr, de };
const vars = (s: string) => [...new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort().join(',');

describe.each(Object.entries(LOCALES))('translations: %s', (_lang, dict) => {
  it('has every key, and no unknown keys', () => {
    expect(Object.keys(en).filter((k) => !(k in dict))).toEqual([]);
    expect(Object.keys(dict).filter((k) => !(k in en))).toEqual([]);
  });

  it('keeps the same {placeholders} as English', () => {
    const wrong = Object.keys(dict).filter((k) => k in en && vars(en[k as keyof typeof en]) !== vars(dict[k]));
    expect(wrong).toEqual([]);
  });

  it('has no empty strings', () => {
    expect(Object.keys(dict).filter((k) => !dict[k].trim())).toEqual([]);
  });
});
