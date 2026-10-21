import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { startSync } from './state/sync';
import { getState } from './state/store';
import { loadLang } from './i18n';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root');

startSync();

// Load the visitor's language first so the app doesn't flash in English.
loadLang(getState().settings.lang).finally(() =>
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  ),
);
