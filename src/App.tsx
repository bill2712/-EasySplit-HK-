import { useEffect } from 'react';
import { intlLocale, translate } from './i18n';
import { useStore } from './state/store';
import { useRoute } from './router';
import { ToastHost } from './components/ui';
import { Home } from './screens/Home';
import { QuickSplit } from './screens/QuickSplit';
import { GroupScreen } from './screens/group/GroupScreen';
import { ImportScreen } from './screens/Import';

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

function useDocumentLang() {
  const lang = useStore((s) => s.settings.lang);
  useEffect(() => {
    document.documentElement.lang = intlLocale(lang);
    document.title = `${translate(lang, 'app.name')} · ${translate(lang, 'app.tagline')}`;
  }, [lang]);
}

export default function App() {
  useTheme();
  useDocumentLang();
  const route = useRoute();

  let screen;
  if (route[0] === 'quick') screen = <QuickSplit />;
  else if (route[0] === 'g' && route[1]) screen = <GroupScreen id={route[1]} />;
  else if (route[0] === 'import' && route[1]) screen = <ImportScreen data={route[1]} />;
  else screen = <Home />;

  return (
    <>
      {screen}
      <ToastHost />
    </>
  );
}
