import { useEffect, useState } from 'react';
import { Coffee, Download, Heart } from 'lucide-react';
import QRCode from 'qrcode';
import { KOFI_URL } from '../lib/site';
import { useI18n } from '../i18n';
import { Button, Sheet, copyText, cx, toast } from './ui';

/** Friendly "buy us a coffee" card linking to Ko-fi. */
export function SupportCard({ compact, className }: { compact?: boolean; className?: string }) {
  const { t } = useI18n();
  if (compact) {
    return (
      <a
        href={KOFI_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={cx(
          'inline-flex items-center gap-1.5 text-[13px] font-semibold text-rose-600 hover:underline dark:text-rose-300',
          className,
        )}
      >
        <Coffee className="h-4 w-4" /> {t('support.short')}
      </a>
    );
  }
  return (
    <div className={cx('relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-50 to-amber-50 p-4 ring-1 ring-rose-100 dark:from-rose-500/10 dark:to-amber-500/10 dark:ring-rose-500/20', className)}>
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-rose-500 shadow-sm dark:bg-zinc-900">
          <Heart className="h-5 w-5 fill-current" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{t('support.title')}</p>
          <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-300">{t('support.body')}</p>
          <a
            href={KOFI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex h-10 items-center gap-2 rounded-2xl bg-rose-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-600 active:scale-[0.98]"
          >
            <Coffee className="h-4 w-4" /> {t('support.button')}
          </a>
        </div>
      </div>
    </div>
  );
}

/** Shows a QR code for a link so friends at the table can scan it. */
export function QrSheet({ open, onClose, url, title }: { open: boolean; onClose: () => void; url: string; title: string }) {
  const { t } = useI18n();
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setFailed(false);
    setSvg(null);
    QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'L', color: { dark: '#18181b', light: '#ffffff' } })
      .then((s) => alive && setSvg(s))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [open, url]);

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="space-y-4 text-center">
        {failed ? (
          <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">{t('qr.tooBig')}</p>
        ) : (
          <div className="mx-auto aspect-square w-full max-w-xs rounded-3xl bg-white p-3 shadow-sm ring-1 ring-zinc-200 [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={svg ? { __html: svg } : undefined} />
        )}
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{t('qr.hint')}</p>
        <Button variant="secondary" className="w-full" onClick={async () => (await copyText(url)) === 'copied' && toast(t('toast.linkCopied'))}>
          {t('qr.copyLink')}
        </Button>
      </div>
    </Sheet>
  );
}

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

let deferred: InstallEvent | null = null;
const subs = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallEvent;
    subs.forEach((f) => f());
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    subs.forEach((f) => f());
  });
}

/** "Install app" button, shown only when the browser offers installation. */
export function InstallButton() {
  const { t } = useI18n();
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((n) => n + 1);
    subs.add(f);
    return () => {
      subs.delete(f);
    };
  }, []);
  if (!deferred) return null;
  return (
    <button
      type="button"
      onClick={async () => {
        const e = deferred;
        if (!e) return;
        await e.prompt();
        await e.userChoice.catch(() => null);
        deferred = null;
        force((n) => n + 1);
      }}
      className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-3 text-sm font-semibold text-brand-700 shadow-sm ring-1 ring-zinc-200 transition active:scale-95 dark:bg-zinc-900 dark:text-brand-300 dark:ring-zinc-800"
    >
      <Download className="h-4 w-4" /> {t('install.button')}
    </button>
  );
}
