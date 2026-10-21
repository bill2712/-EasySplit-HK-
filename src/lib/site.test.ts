import { describe, expect, it } from 'vitest';
import { getCountry } from './countries';
import { tipRange } from './guide';
import { langFromPath } from './site';

describe('landing pages', () => {
  it('detects language from the landing page path', () => {
    expect(langFromPath('/-EasySplit-HK-/zh-hk/')).toBe('zh-HK');
    expect(langFromPath('/-EasySplit-HK-/ja/index.html')).toBe('ja');
    expect(langFromPath('/-EasySplit-HK-/')).toBeNull();
  });
});

describe('tipping guide', () => {
  it('shows a tip range only where tipping is a custom', () => {
    expect(tipRange(getCountry('US'))).toBe('15–25%');
    expect(tipRange(getCountry('JP'))).toBe('');
    expect(tipRange(getCountry('FR'))).toBe('');
  });
});
