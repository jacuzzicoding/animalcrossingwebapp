import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { bootstrapLocalStorageMigration } from './lib/bootstrapMigration';
import './index.css';

bootstrapLocalStorageMigration();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
