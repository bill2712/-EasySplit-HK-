import { Suspense, lazy, useEffect } from 'react';
import { intlLocale, useI18n } from './i18n';
import { useStore } from './state/store';
import { useRoute } from './router';
import { ToastHost } from './components/ui';
import { Home } from './screens/Home';
import { ErrorBoundary } from './components/ErrorBoundary';

// Everything except the home screen loads on demand to keep the first load small.
const QuickSplit = lazy(() => import('./screens/QuickSplit').then((m) => ({ default: m.QuickSplit })));
const GroupScreen = lazy(() => import('./screens/group/GroupScreen').then((m) => ({ default: m.GroupScreen })));
const ImportScreen = lazy(() => import('./screens/Import').then((m) => ({ default: m.ImportScreen })));
const Guide = lazy(() => import('./screens/Guide').then((m) => ({ default: m.Guide })));
const JoinScreen = lazy(() => import('./screens/Join'));

function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" aria-busy="true">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500/30 border-t-brand-600" />
    </div>
  );
}

function useTheme() {
  const theme = useStore((s) => s.settings.theme);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches);
      document.documentElement.classList.toggle('dark', dark);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#09090b' : '#f4f4f5');
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);
}

function useDocumentLang(screen: string) {
  const { t, lang } = useI18n();
  useEffect(() => {
    document.documentElement.lang = intlLocale(lang);
    const name = t('app.name');
    // Keep the descriptive SEO title on the landing screen.
    document.title =
      screen === 'quick'
        ? `${t('quick.title')} · ${name}`
        : screen === 'guide'
          ? `${t('guide.title')} · ${name}`
          : screen === 'home'
            ? t('seo.title')
            : name;
  }, [t, lang, screen]);
}

export default function App() {
  useTheme();
  const route = useRoute();
  useDocumentLang(route[0] === 'quick' || route[0] === 'guide' ? route[0] : route[0] ? 'other' : 'home');

  let screen;
  if (route[0] === 'quick') screen = <QuickSplit />;
  else if (route[0] === 'g' && route[1]) screen = <GroupScreen id={route[1]} />;
  else if (route[0] === 'import' && route[1]) screen = <ImportScreen data={route[1]} />;
  else if (route[0] === 'guide') screen = <Guide />;
  else if (route[0] === 'join' && route[1]) screen = <JoinScreen cloudId={route[1]} />;
  else screen = <Home />;

  return (
    <>
      <ErrorBoundary key={route.join('/')}>
        <Suspense fallback={<Loading />}>{screen}</Suspense>
      </ErrorBoundary>
      <ToastHost />
    </>
  );
}
