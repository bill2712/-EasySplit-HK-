import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { uid, today } from '../lib/id';
import { rateToBase } from '../lib/rates';
import type { Expense, Group, Member } from '../lib/types';
import { useI18n } from '../i18n';
import { actions, getState, useStore } from '../state/store';
import { navigate } from '../router';
import { Avatar, Button, Chip, Field, Sheet, TextField, cx, toast } from '../components/ui';
import { quickSpec } from './QuickSplit';

/** Turn the quick calculator's bill into an expense inside a group. */
export function SaveToGroupSheet({ onClose, names }: { onClose: () => void; names: Record<string, string> }) {
  const { t } = useI18n();
  const q = useStore((s) => s.quick);
  const groups = useStore((s) => s.groups);
  const [target, setTarget] = useState<string>(groups[0]?.id ?? 'new');
  const [payer, setPayer] = useState(q.people[0]?.id);
  const [title, setTitle] = useState(t('quick.defaultTitle'));
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    let group: Group;
    if (target === 'new') {
      group = actions.createGroup({
        name: title || t('quick.defaultTitle'),
        emoji: '🍽️',
        kind: 'meal',
        currency: q.currency,
        country: q.country,
        members: [],
      });
    } else {
      group = getState().groups.find((g) => g.id === target)!;
    }

    // Match people by name, add anyone new to the group.
    const idMap: Record<string, string> = {};
    const newMembers: Member[] = [];
    for (const p of q.people) {
      const name = names[p.id];
      const existing = [...group.members, ...newMembers].find((m) => m.name.trim().toLowerCase() === name.trim().toLowerCase());
      if (existing) idMap[p.id] = existing.id;
      else {
        const m: Member = { id: uid(), name };
        newMembers.push(m);
        idMap[p.id] = m.id;
      }
    }

    let rate = 1;
    if (q.currency !== group.currency) {
      const live = await rateToBase(q.currency, group.currency);
      rate = live?.rate ?? group.rates[q.currency] ?? 0;
      if (!rate) {
        rate = 1;
        toast(t('toast.checkRate'));
      }
    }

    const spec = quickSpec(q);
    const map = (ids: string[]) => ids.map((id) => idMap[id]).filter(Boolean);
    const expense: Expense = {
      ...spec,
      id: uid(),
      kind: 'expense',
      title: title || t('quick.defaultTitle'),
      category: 'food',
      date: today(),
      currency: q.currency,
      rate,
      payerId: idMap[payer ?? q.people[0].id],
      createdAt: Date.now(),
      participants: map(spec.participants),
      treated: map(spec.treated),
      items: spec.items.map((it) => ({ ...it, who: map(it.who) })),
    };

    actions.updateGroup(group.id, (g) => ({ ...g, members: [...g.members, ...newMembers] }));
    actions.saveExpense(group.id, expense);
    setBusy(false);
    onClose();
    toast(t('toast.saved'));
    navigate(`/g/${group.id}`);
  };

  return (
    <Sheet
      open
      onClose={onClose}
      title={t('quick.saveToGroup')}
      footer={
        <Button className="w-full" onClick={save} disabled={busy || !payer}>
          <Check className="h-5 w-5" /> {t('common.save')}
        </Button>
      }
    >
      <div className="space-y-5">
        <Field label={t('expense.title')}>
          <TextField value={title} onChange={setTitle} />
        </Field>
        <div className="space-y-2">
          <p className="px-1 text-[13px] font-medium text-zinc-600 dark:text-zinc-400">{t('expense.paidBy')}</p>
          <div className="flex flex-wrap gap-2">
            {q.people.map((p) => (
              <Chip key={p.id} active={payer === p.id} onClick={() => setPayer(p.id)}>
                {names[p.id]}
              </Chip>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="px-1 text-[13px] font-medium text-zinc-600 dark:text-zinc-400">{t('quick.saveWhere')}</p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setTarget('new')}
              className={cx(
                'flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition',
                target === 'new' ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800',
              )}
            >
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                <Plus className="h-5 w-5" />
              </span>
              <span className="font-semibold">{t('home.newGroup')}</span>
            </button>
            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setTarget(g.id)}
                className={cx(
                  'flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition',
                  target === g.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800',
                )}
              >
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-zinc-100 text-xl dark:bg-zinc-700">{g.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{g.name}</span>
                  <span className="flex -space-x-1.5 pt-1">
                    {g.members.slice(0, 6).map((m) => (
                      <Avatar key={m.id} id={m.id} name={m.name} size="sm" />
                    ))}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  );
}
