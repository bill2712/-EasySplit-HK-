import { useSyncExternalStore } from 'react';

// Hash routing keeps deep links working on GitHub Pages without server config.
function current(): string {
  const h = window.location.hash.replace(/^#/, '');
  return h || '/';
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

export function useRoute(): string[] {
  const path = useSyncExternalStore(subscribe, current, () => '/');
  return path.split('?')[0].split('/').filter(Boolean);
}

/** Query parameters inside the hash route, e.g. #/quick?c=JP. */
export function routeQuery(): URLSearchParams {
  const h = window.location.hash.replace(/^#/, '');
  const i = h.indexOf('?');
  return new URLSearchParams(i >= 0 ? h.slice(i + 1) : '');
}

export function navigate(path: string, replace = false) {
  const url = `#${path}`;
  if (replace) {
    window.history.replaceState(null, '', url);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = path;
  }
  window.scrollTo({ top: 0 });
}

export function appUrl(path: string): string {
  return `${window.location.origin}${window.location.pathname}#${path}`;
}
