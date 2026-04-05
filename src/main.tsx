import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { ErrorBoundary } from './design-system/components/ErrorBoundary';

// Apply persisted theme before first render to avoid flash
const persistedRaw = localStorage.getItem('app-party-theme');
const persistedTheme = persistedRaw
  ? (JSON.parse(persistedRaw) as { state?: { theme?: string } }).state?.theme
  : null;
document.documentElement.classList.add(persistedTheme === 'light' ? 'light' : 'dark');

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Ensure index.html has <div id="root">.');
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
