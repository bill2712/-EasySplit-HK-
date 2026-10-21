import { useEffect } from 'react';
import { intlLocale, translate } from './i18n';
import { useStore } from './state/store';
import { useRoute } from './router';
import { ToastHost } from './components/ui';
import { Home } from './screens/Home';
import { QuickSplit } from './screens/QuickSplit';
import { GroupScreen } from './screens/group/GroupScreen';
import { ImportScreen } from './screens/Import';
import { Guide } from './screens/Guide';

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
  const lang = useStore((s) => s.settings.lang);
  useEffect(() => {
    document.documentElement.lang = intlLocale(lang);
    const name = translate(lang, 'app.name');
    // Keep the descriptive SEO title on the landing screen.
    document.title =
      screen === 'quick'
        ? `${translate(lang, 'quick.title')} · ${name}`
        : screen === 'guide'
          ? `${translate(lang, 'guide.title')} · ${name}`
          : screen === 'home'
            ? translate(lang, 'seo.title')
            : name;
  }, [lang, screen]);
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
  else screen = <Home />;

  return (
    <>
      {screen}
      <ToastHost />
    </>
  );
}
