import { Component, type ErrorInfo, type ReactNode } from 'react';
import { translate } from '../i18n';
import { getState } from '../state/store';

/** Shows a friendly recovery screen instead of a blank page if a screen crashes. Data is untouched. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('EasySplit crashed', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const lang = getState().settings.lang;
    const t = (k: Parameters<typeof translate>[1]) => translate(lang, k);
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-5xl">😵</p>
        <p className="text-lg font-semibold">{t('error.title')}</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('error.body')}</p>
        <button
          type="button"
          className="rounded-2xl bg-brand-600 px-5 py-3 font-semibold text-white"
          onClick={() => {
            window.location.hash = '/';
            window.location.reload();
          }}
        >
          {t('error.reload')}
        </button>
      </div>
    );
  }
}
