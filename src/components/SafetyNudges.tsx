import { useEffect } from 'react';
import { Download, Share, X } from 'lucide-react';
import { useI18n } from '../i18n';
import { actions, useStore } from '../state/store';
import { downloadBackup } from '../screens/Settings';
import { Button } from './ui';

const DAY = 24 * 60 * 60 * 1000;

function isIosSafari() {
  const ua = navigator.userAgent;
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = (navigator as Navigator & { standalone?: boolean }).standalone || matchMedia('(display-mode: standalone)').matches;
  return ios && !standalone;
}

/** Ask the browser not to evict our storage once there is something worth keeping. */
export function usePersistentStorage(hasData: boolean) {
  useEffect(() => {
    if (!hasData || !navigator.storage?.persist) return;
    navigator.storage
      .persisted()
      .then((done) => (done ? true : navigator.storage.persist()))
      .catch(() => undefined);
  }, [hasData]);
}

/** Banners that protect local-only data: install on iOS, and back up now and then. */
export function SafetyNudges() {
  const { t } = useI18n();
  const settings = useStore((s) => s.settings);
  const groups = useStore((s) => s.groups);
  const localWithData = groups.filter((g) => !g.cloudId && g.expenses.length > 0);
  usePersistentStorage(groups.length > 0);

  const now = Date.now();
  const showInstall = groups.length > 0 && !settings.installNudgeDismissed && isIosSafari();
  const lastChange = Math.max(0, ...localWithData.map((g) => g.updatedAt));
  const showBackup =
    !showInstall &&
    localWithData.length > 0 &&
    lastChange > (settings.lastBackupAt ?? 0) &&
    now - (settings.lastBackupAt ?? localWithData.reduce((m, g) => Math.min(m, g.createdAt), now)) > 7 * DAY &&
    now - (settings.backupNudgeDismissedAt ?? 0) > 7 * DAY;

  if (showInstall) {
    return (
      <div className="relative rounded-3xl bg-sky-50 p-4 pr-11 text-sky-950 ring-1 ring-sky-100 dark:bg-sky-500/10 dark:text-sky-100 dark:ring-sky-500/20">
        <p className="font-semibold">{t('safety.installTitle')}</p>
        <p className="mt-1 text-sm">
          {t('safety.installBody')} <Share className="inline h-4 w-4 align-text-bottom" />
        </p>
        <button
          type="button"
          aria-label={t('safety.later')}
          onClick={() => actions.setSettings({ installNudgeDismissed: true })}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full hover:bg-sky-100 dark:hover:bg-sky-500/20"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }
  if (!showBackup) return null;
  return (
    <div className="rounded-3xl bg-amber-50 p-4 text-amber-950 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:text-amber-100 dark:ring-amber-500/20">
      <p className="font-semibold">{t('safety.backupTitle')}</p>
      <p className="mt-1 text-sm">{t('safety.backupBody')}</p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={downloadBackup}>
          <Download className="h-4 w-4" /> {t('safety.backupNow')}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => actions.setSettings({ backupNudgeDismissedAt: Date.now() })}>
          {t('safety.later')}
        </Button>
      </div>
    </div>
  );
}
