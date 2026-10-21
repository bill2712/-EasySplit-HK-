import { useMemo } from 'react';
import { formatMinor } from '../lib/money';
import { summarize } from '../lib/settle';
import { decodeGroup } from '../lib/share';
import { useI18n } from '../i18n';
import { actions, useStore } from '../state/store';
import { navigate } from '../router';
import { Avatar, Button, EmptyState, TopBar } from '../components/ui';

export function ImportScreen({ data }: { data: string }) {
  const { t, locale } = useI18n();
  const group = useMemo(() => decodeGroup(data), [data]);
  const existing = useStore((s) => (group ? s.groups.find((g) => g.id === group.id) : undefined));

  if (!group) {
    return (
      <div>
        <TopBar title={t('import.title')} onBack={() => navigate('/')} />
        <div className="mx-auto max-w-md p-4">
          <EmptyState icon="🔗" title={t('import.invalid')} action={<Button onClick={() => navigate('/')}>{t('common.home')}</Button>} />
        </div>
      </div>
    );
  }

  const total = summarize(group).totalSpent;
  const doImport = (mode: 'replace' | 'copy') => {
    actions.importGroup(group, mode);
    const id = mode === 'replace' ? group.id : undefined;
    navigate(id ? `/g/${id}` : '/', true);
  };

  return (
    <div>
      <TopBar title={t('import.title')} onBack={() => navigate('/')} />
      <main className="mx-auto max-w-md space-y-4 p-4">
        <div className="card p-5 text-center">
          <p className="text-5xl">{group.emoji}</p>
          <p className="mt-2 text-xl font-bold">{group.name}</p>
          <p className="mt-1 text-sm text-zinc-500">
            {t('home.groupMeta', { people: group.members.length, items: group.expenses.length })} · {formatMinor(total, group.currency, locale)}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {group.members.map((m) => (
              <span key={m.id} className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 py-1 pl-1 pr-3 text-sm dark:bg-zinc-800">
                <Avatar id={m.id} name={m.name} size="sm" /> {m.name}
              </span>
            ))}
          </div>
        </div>
        <p className="px-1 text-sm text-zinc-600 dark:text-zinc-300">{existing ? t('import.exists') : t('import.body')}</p>
        <Button className="w-full" size="lg" onClick={() => doImport('replace')}>
          {existing ? t('import.update') : t('import.add')}
        </Button>
        {existing && (
          <Button variant="secondary" className="w-full" onClick={() => doImport('copy')}>
            {t('import.copy')}
          </Button>
        )}
      </main>
    </div>
  );
}
