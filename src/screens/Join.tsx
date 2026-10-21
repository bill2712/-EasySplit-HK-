import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cloudEnabled } from '../lib/cloud/config';
import { isCloudId, type GroupMeta } from '../lib/cloud/model';
import type { Expense } from '../lib/types';
import { useI18n } from '../i18n';
import { getState } from '../state/store';
import { fetchShared, joinShared } from '../state/sync';
import { navigate } from '../router';
import { Avatar, Button, EmptyState, TopBar } from '../components/ui';

/** Opened from a live link (#/join/{cloudId}). */
export default function JoinScreen({ cloudId }: { cloudId: string }) {
  const { t } = useI18n();
  const [state, setState] = useState<'loading' | 'missing' | 'error' | { meta: GroupMeta; expenses: Expense[] }>('loading');

  useEffect(() => {
    const existing = getState().groups.find((g) => g.cloudId === cloudId);
    if (existing) {
      navigate(`/g/${existing.id}`, true);
      return;
    }
    if (!cloudEnabled || !isCloudId(cloudId)) {
      setState('missing');
      return;
    }
    let alive = true;
    fetchShared(cloudId)
      .then((r) => alive && setState(r ?? 'missing'))
      .catch(() => alive && setState('error'));
    return () => {
      alive = false;
    };
  }, [cloudId]);

  return (
    <div>
      <TopBar title={t('live.joinTitle')} onBack={() => navigate('/')} />
      <main className="mx-auto max-w-md space-y-4 p-4">
        {state === 'loading' && (
          <div className="flex items-center justify-center gap-2 py-16 text-zinc-500">
            <Loader2 className="h-5 w-5 animate-spin" /> {t('live.joining')}
          </div>
        )}
        {(state === 'missing' || state === 'error') && (
          <EmptyState
            icon="🔗"
            title={state === 'missing' ? t('live.notFound') : t('live.error')}
            action={<Button onClick={() => navigate('/')}>{t('common.home')}</Button>}
          />
        )}
        {typeof state === 'object' && (
          <>
            <div className="card p-5 text-center">
              <p className="text-5xl">{state.meta.emoji}</p>
              <p className="mt-2 text-xl font-bold">{state.meta.name}</p>
              <p className="mt-1 text-sm text-zinc-500">
                {t('home.groupMeta', { people: state.meta.members.length, items: state.expenses.filter((e) => e.kind === 'expense').length })}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {state.meta.members.map((m) => (
                  <span key={m.id} className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 py-1 pl-1 pr-3 text-sm dark:bg-zinc-800">
                    <Avatar id={m.id} name={m.name} size="sm" /> {m.name}
                  </span>
                ))}
              </div>
            </div>
            <p className="px-1 text-sm text-zinc-600 dark:text-zinc-300">{t('live.joinBody')}</p>
            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                const id = joinShared(cloudId, state.meta, state.expenses);
                navigate(`/g/${id}`, true);
              }}
            >
              {t('live.join')}
            </Button>
          </>
        )}
      </main>
    </div>
  );
}
