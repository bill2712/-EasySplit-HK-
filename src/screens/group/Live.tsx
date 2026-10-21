import { useState, type ReactNode } from 'react';
import { CloudOff, Loader2, Radio, Unplug } from 'lucide-react';
import { cloudEnabled } from '../../lib/cloud/config';
import type { Group } from '../../lib/types';
import { useI18n } from '../../i18n';
import { goLive, stopLive, useSyncStatus } from '../../state/sync';
import { appUrl } from '../../router';
import { Button, Sheet, cx, shareOrCopy, toast } from '../../components/ui';

export const liveUrl = (cloudId: string) => appUrl(`/join/${cloudId}`);

/** Small "Live · Synced" pill for the group header. */
export function LiveBadge({ group }: { group: Group }) {
  const { t } = useI18n();
  const status = useSyncStatus(group.id);
  if (!group.cloudId) return null;
  const label = status === 'offline' ? t('live.offline') : status === 'syncing' ? t('live.syncing') : status === 'error' ? t('live.error') : t('live.synced');
  return (
    <span
      title={label}
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
        status === 'error' || status === 'offline'
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200'
          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200',
      )}
    >
      {status === 'syncing' ? <Loader2 className="h-3 w-3 animate-spin" /> : status === 'offline' || status === 'error' ? <CloudOff className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
      {t('live.badge')}
    </span>
  );
}

/** Menu entries for live sharing (hidden when the app has no Firebase config). */
export function LiveMenu({
  group,
  onDone,
  Item,
}: {
  group: Group;
  onDone: () => void;
  Item: (p: { icon: ReactNode; label: string; hint?: string; onClick: () => void }) => ReactNode;
}) {
  const { t } = useI18n();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!cloudEnabled) return null;

  const share = async (cloudId: string) => {
    const r = await shareOrCopy(t('live.shareText', { name: group.name }), group.name, liveUrl(cloudId));
    if (r === 'copied') toast(t('toast.linkCopied'));
  };

  const turnOn = async () => {
    setBusy(true);
    try {
      const id = await goLive(group.id);
      setConfirm(false);
      onDone();
      await share(id);
    } catch {
      toast(t('live.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {group.cloudId ? (
        <>
          {Item({
            icon: <Radio className="h-5 w-5" />,
            label: t('live.shareLink'),
            hint: t('live.enableHint'),
            onClick: () => {
              onDone();
              share(group.cloudId!);
            },
          })}
          {Item({
            icon: <Unplug className="h-5 w-5" />,
            label: t('live.stop'),
            onClick: () => {
              if (!window.confirm(t('live.stopConfirm'))) return;
              stopLive(group.id);
              onDone();
            },
          })}
        </>
      ) : (
        Item({ icon: <Radio className="h-5 w-5" />, label: t('live.enable'), hint: t('live.enableHint'), onClick: () => setConfirm(true) })
      )}
      <Sheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title={t('live.confirmTitle')}
        footer={
          <Button className="w-full" onClick={turnOn} disabled={busy}>
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Radio className="h-5 w-5" />} {t('live.turnOn')}
          </Button>
        }
      >
        <p className="text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">{t('live.confirmBody')}</p>
      </Sheet>
    </>
  );
}
