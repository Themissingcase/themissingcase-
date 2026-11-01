import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register PWA service worker with immediate lifecycle updates
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] New game updates available; refreshing cache.');
  },
  onOfflineReady() {
    console.log('[PWA] The Missing Clue is ready for offline play.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
