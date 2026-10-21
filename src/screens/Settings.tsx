import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { flagEmoji } from '../lib/countries';
import type { Group } from '../lib/types';
import { LANGS, countryName, useI18n } from '../i18n';
import { actions, getState, setState, useStore, type Theme } from '../state/store';
import { CountryPicker } from '../components/pickers';
import { Button, Section, Segmented, Sheet, cx, toast } from '../components/ui';
import { SupportCard } from '../components/extras';

export function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang, locale } = useI18n();
  const settings = useStore((s) => s.settings);
  const [countryOpen, setCountryOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const backup = () => {
    const s = getState();
    downloadFile(`easysplit-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ app: 'easysplit', version: 1, groups: s.groups }, null, 2), 'application/json');
  };

  const restore = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      const groups: Group[] = Array.isArray(data?.groups) ? data.groups : [];
      if (!groups.length || !groups.every((g) => g && g.id && Array.isArray(g.members) && Array.isArray(g.expenses))) throw new Error('bad');
      setState((s) => {
        const ids = new Set(groups.map((g) => g.id));
        return { ...s, groups: [...groups, ...s.groups.filter((g) => !ids.has(g.id))] };
      });
      toast(t('settings.restored', { n: groups.length }));
    } catch {
      toast(t('settings.restoreFailed'));
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title={t('settings.title')}>
      <div className="space-y-6">
        <Section title={t('settings.language')}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => actions.setSettings({ lang: l.code })}
                className={cx(
                  'rounded-2xl border px-3 py-2.5 text-left text-[15px] font-medium transition',
                  lang === l.code ? 'border-brand-500 bg-brand-50 text-brand-900 dark:bg-brand-500/10 dark:text-brand-100' : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800',
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        </Section>

        <Section title={t('settings.theme')}>
          <Segmented<Theme>
            value={settings.theme}
            onChange={(theme) => actions.setSettings({ theme })}
            options={[
              { value: 'system', label: t('settings.themeSystem') },
              { value: 'light', label: t('settings.themeLight') },
              { value: 'dark', label: t('settings.themeDark') },
            ]}
          />
        </Section>

        <Section title={t('settings.homeCountry')}>
          <button type="button" onClick={() => setCountryOpen(true)} className="field flex items-center gap-3 text-left">
            <span className="text-2xl leading-none">{flagEmoji(settings.country)}</span>
            <span className="flex-1">{countryName(settings.country, locale, t)}</span>
          </button>
          <p className="px-1 text-xs text-zinc-500 dark:text-zinc-400">{t('settings.homeCountryHint')}</p>
        </Section>

        <Section title={t('settings.data')}>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={backup}>
              <Download className="h-4 w-4" /> {t('settings.backup')}
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4" /> {t('settings.restore')}
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) restore(f);
              e.target.value = '';
            }}
          />
          <p className="px-1 text-xs text-zinc-500 dark:text-zinc-400">{t('home.privacy')}</p>
        </Section>

        <SupportCard />
      </div>
      <CountryPicker
        open={countryOpen}
        onClose={() => setCountryOpen(false)}
        value={settings.country}
        onPick={(c) => actions.setSettings({ country: c })}
      />
    </Sheet>
  );
}
