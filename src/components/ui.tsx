import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, Minus, Plus, X } from 'lucide-react';
import { parseAmount } from '../lib/money';

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(' ');
}

// ---------- layout ----------

export function TopBar({ title, onBack, right, sub }: { title: ReactNode; onBack?: () => void; right?: ReactNode; sub?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/60 bg-zinc-100/85 backdrop-blur-xl dark:border-zinc-800/60 dark:bg-zinc-950/85">
      <div className="mx-auto flex h-14 max-w-2xl items-center gap-1 px-2">
        {onBack ? (
          <IconButton label="Back" onClick={onBack}>
            <ChevronLeft className="h-6 w-6" />
          </IconButton>
        ) : (
          <span className="w-2" />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[17px] font-semibold leading-tight">{title}</h1>
          {sub && <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>}
        </div>
        <div className="flex items-center gap-1">{right}</div>
      </div>
    </header>
  );
}

export function IconButton({ label, onClick, children, className }: { label: string; onClick?: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cx(
        'grid h-10 w-10 shrink-0 place-items-center rounded-full text-zinc-600 transition hover:bg-zinc-200/70 active:scale-95 dark:text-zinc-300 dark:hover:bg-zinc-800',
        className,
      )}
    >
      {children}
    </button>
  );
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft';

export function Button({
  children,
  onClick,
  variant = 'primary',
  className,
  disabled,
  type = 'button',
  size = 'md',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit';
  size?: 'sm' | 'md' | 'lg';
}) {
  const v: Record<BtnVariant, string> = {
    primary: 'bg-brand-600 text-white shadow-sm shadow-brand-900/20 hover:bg-brand-700 dark:bg-brand-500 dark:text-brand-950 dark:hover:bg-brand-400',
    secondary: 'bg-white text-zinc-800 border border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-700',
    soft: 'bg-brand-50 text-brand-800 hover:bg-brand-100 dark:bg-brand-500/15 dark:text-brand-200 dark:hover:bg-brand-500/25',
    ghost: 'text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800',
    danger: 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:hover:bg-rose-500/25',
  };
  const s = { sm: 'h-9 px-3 text-sm rounded-xl', md: 'h-11 px-4 text-[15px] rounded-2xl', lg: 'h-13 px-5 text-base rounded-2xl' }[size];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'inline-flex items-center justify-center gap-2 font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40',
        v[variant],
        s,
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Section({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx('space-y-2', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

// ---------- inputs ----------

/** Amount box that accepts sums like "120+35.5" and shows the result. */
export function AmountInput({
  value,
  onChange,
  placeholder = '0',
  big,
  prefix,
  className,
  autoFocus,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  big?: boolean;
  prefix?: ReactNode;
  className?: string;
  autoFocus?: boolean;
  ariaLabel?: string;
}) {
  const parsed = parseAmount(value);
  const isExpr = /[+\-*/×÷x()]/.test(value.replace(/^-/, '')) && parsed !== null;
  return (
    <div className={cx('relative', className)}>
      <div
        className={cx(
          'flex items-center rounded-2xl border border-zinc-200 bg-zinc-50 transition focus-within:border-brand-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-800/60 dark:focus-within:bg-zinc-800',
          big ? 'px-4 py-3' : 'px-3 py-2',
        )}
      >
        {prefix && <span className={cx('mr-2 shrink-0 font-semibold text-zinc-400', big ? 'text-xl' : 'text-sm')}>{prefix}</span>}
        <input
          aria-label={ariaLabel}
          autoFocus={autoFocus}
          inputMode="decimal"
          enterKeyHint="done"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            if (isExpr && parsed !== null) onChange(String(Math.round(parsed * 100) / 100));
          }}
          className={cx(
            'w-full min-w-0 bg-transparent font-semibold tabular-nums outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600',
            big ? 'text-3xl' : 'text-[15px]',
          )}
        />
      </div>
      {isExpr && (
        <span className="absolute -bottom-5 right-2 text-xs font-medium text-brand-700 dark:text-brand-300">= {Math.round(parsed! * 100) / 100}</span>
      )}
    </div>
  );
}

/** Small number field for percentages, shares, etc. Keeps its own text while typing. */
export function NumField({
  value,
  onChange,
  suffix,
  className,
  ariaLabel,
  placeholder = '0',
}: {
  value: number;
  onChange: (v: number) => void;
  suffix?: ReactNode;
  className?: string;
  ariaLabel?: string;
  placeholder?: string;
}) {
  const [text, setText] = useState(value ? String(value) : '');
  const last = useRef(value);
  useEffect(() => {
    if (value !== last.current) {
      setText(value ? String(value) : '');
      last.current = value;
    }
  }, [value]);
  return (
    <div
      className={cx(
        'flex items-center rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 transition focus-within:border-brand-500 focus-within:bg-white dark:border-zinc-700 dark:bg-zinc-800/60',
        className,
      )}
    >
      <input
        aria-label={ariaLabel}
        inputMode="decimal"
        value={text}
        placeholder={placeholder}
        onChange={(e) => {
          setText(e.target.value);
          const n = parseAmount(e.target.value);
          const v = n === null ? 0 : n;
          last.current = v;
          onChange(v);
        }}
        className="w-full min-w-0 bg-transparent text-right text-[15px] font-semibold tabular-nums outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
      />
      {suffix && <span className="ml-1 shrink-0 text-sm text-zinc-400">{suffix}</span>}
    </div>
  );
}

export function TextField({
  value,
  onChange,
  placeholder,
  className,
  autoFocus,
  ariaLabel,
  onEnter,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  ariaLabel?: string;
  onEnter?: () => void;
}) {
  return (
    <input
      aria-label={ariaLabel ?? placeholder}
      autoFocus={autoFocus}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onEnter) {
          e.preventDefault();
          onEnter();
        }
      }}
      className={cx('field', className)}
    />
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div role="tablist" className={cx('flex rounded-2xl bg-zinc-200/70 p-1 dark:bg-zinc-800', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          type="button"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'min-w-0 flex-1 truncate whitespace-nowrap rounded-xl font-semibold transition',
            size === 'sm' ? 'px-1.5 py-1.5 text-[13px]' : 'px-3 py-2 text-sm',
            value === o.value
              ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-600 dark:text-white'
              : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1">
      <span className="min-w-0">
        <span className="block text-[15px]">{label}</span>
        {hint && <span className="block text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative h-7 w-12 shrink-0 rounded-full transition',
          checked ? 'bg-brand-600 dark:bg-brand-500' : 'bg-zinc-300 dark:bg-zinc-700',
        )}
      >
        <span className={cx('absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all', checked ? 'left-5.5' : 'left-0.5')} />
      </button>
    </label>
  );
}

export function Chip({
  active,
  onClick,
  children,
  className,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition active:scale-95',
        active
          ? 'border-brand-600 bg-brand-600 text-white dark:border-brand-400 dark:bg-brand-500 dark:text-brand-950'
          : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Stepper({ value, onChange, min = 1, max = 99 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-1 rounded-2xl bg-zinc-100 p-1 dark:bg-zinc-800">
      <button
        type="button"
        aria-label="−"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="grid h-9 w-9 place-items-center rounded-xl bg-white text-zinc-700 shadow-sm transition active:scale-95 disabled:opacity-30 dark:bg-zinc-700 dark:text-zinc-100"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-9 text-center text-lg font-bold tabular-nums">{value}</span>
      <button
        type="button"
        aria-label="+"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="grid h-9 w-9 place-items-center rounded-xl bg-white text-zinc-700 shadow-sm transition active:scale-95 disabled:opacity-30 dark:bg-zinc-700 dark:text-zinc-100"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

// ---------- avatars ----------

const AVATAR_COLORS = [
  'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200',
  'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200',
  'bg-lime-100 text-lime-800 dark:bg-lime-500/20 dark:text-lime-200',
  'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-200',
  'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-200',
  'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-200',
  'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200',
  'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-200',
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({ name, id, size = 'md', badge }: { name: string; id: string; size?: 'sm' | 'md' | 'lg'; badge?: ReactNode }) {
  const initial = [...(name.trim() || '?')][0].toUpperCase();
  const s = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-12 w-12 text-lg' }[size];
  return (
    <span className={cx('relative grid shrink-0 place-items-center rounded-full font-bold', s, AVATAR_COLORS[hash(id) % AVATAR_COLORS.length])}>
      {initial}
      {badge && <span className="absolute -bottom-1 -right-1 text-[13px] leading-none">{badge}</span>}
    </span>
  );
}

// ---------- sheet ----------

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className="animate-fade absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={cx(
          'animate-sheet relative flex max-h-[92dvh] w-full flex-col rounded-t-[28px] bg-zinc-50 shadow-2xl dark:bg-zinc-900 sm:rounded-[28px]',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-lg',
        )}
      >
        <div className="flex items-center gap-2 px-5 pb-2 pt-4">
          <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-zinc-300 dark:bg-zinc-700 sm:hidden" />
          <h2 className="min-w-0 flex-1 truncate text-lg font-bold">{title}</h2>
          <IconButton label="Close" onClick={onClose} className="-mr-2">
            <X className="h-5 w-5" />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
        {footer && <div className="pb-safe border-t border-zinc-200 bg-zinc-50 px-5 pt-3 dark:border-zinc-800 dark:bg-zinc-900"><div className="pb-3">{footer}</div></div>}
      </div>
    </div>
  );
}

// ---------- toast ----------

let toastFn: ((msg: string) => void) | null = null;

export function toast(msg: string) {
  toastFn?.(msg);
}

export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    toastFn = (m) => {
      setMsg(m);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setMsg(null), 2200);
    };
    return () => {
      toastFn = null;
    };
  }, []);
  if (!msg) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4" role="status" aria-live="polite">
      <div className="animate-pop rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-xl dark:bg-white dark:text-zinc-900">{msg}</div>
    </div>
  );
}

// ---------- sharing ----------

export async function shareOrCopy(text: string, title: string, url?: string): Promise<'shared' | 'copied' | 'failed'> {
  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
  if (nav.share && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) {
    try {
      await nav.share({ title, text, url });
      return 'shared';
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return 'shared';
    }
  }
  return copyText(url ? `${text}\n${url}` : text);
}

export async function copyText(text: string): Promise<'copied' | 'failed'> {
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok ? 'copied' : 'failed';
    } catch {
      return 'failed';
    }
  }
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: ReactNode; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-3 text-4xl">{icon}</div>
      <p className="font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Field({ label, children, hint }: { label: ReactNode; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block px-1 text-[13px] font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
      {children}
      {hint && <span className="block px-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>}
    </label>
  );
}
