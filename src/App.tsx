import { Navigate, Route, Routes } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import ACCanvas from './components/ACCanvas';
import { useHydration } from './hooks/useHydration';
import ErrorBoundary from './components/ErrorBoundary';
import { useAppStore } from './lib/store';

function RootRedirect() {
  const towns = useAppStore(s => s.towns);
  const activeTownId = useAppStore(s => s.activeTownId);

  if (towns.length === 0) {
    return <ACCanvas />;
  }

  const targetId = activeTownId ?? towns[0].id;
  return <Navigate to={`/town/${targetId}/home`} replace />;
}

function App() {
  const hydrated = useHydration();

  if (!hydrated) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#F5E9D4',
        }}
      >
        <span
          style={{
            color: '#7B5E3B',
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: 18,
          }}
        >
          Loading museum…
        </span>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/town/:townId" element={<ACCanvas />} />
        <Route path="/town/:townId/:tab" element={<ACCanvas />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Analytics />
      {typeof window !== 'undefined' && (
        <div
          style={{
            position: 'fixed',
            bottom: 8,
            right: 10,
            fontSize: 10,
            color: '#5a4a35',
            opacity: 0.5,
            pointerEvents: 'none',
          }}
        >
          {window.location.hostname === 'animalcrossingwebapp.vercel.app' ? (
            <>v{import.meta.env.VITE_APP_VERSION}</>
          ) : (
            <>
              v{import.meta.env.VITE_APP_VERSION}
              {' · '}
              {import.meta.env.VITE_GIT_BRANCH}
            </>
          )}
        </div>
      )}
    </ErrorBoundary>
  );
}

export default App;
