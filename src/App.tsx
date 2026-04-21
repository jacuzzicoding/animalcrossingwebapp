import { Analytics } from '@vercel/analytics/react';
import ACCanvas from './components/ACCanvas';
import { useHydration } from './hooks/useHydration';
import ErrorBoundary from './components/ErrorBoundary';

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
            fontFamily: 'Varela Round, sans-serif',
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
      <ACCanvas />
      <Analytics />
      {typeof window !== 'undefined' &&
        window.location.hostname !== 'animalcrossingwebapp.vercel.app' && (
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
            {import.meta.env.VITE_APP_VERSION}+{import.meta.env.VITE_GIT_SHA}
          </div>
        )}
    </ErrorBoundary>
  );
}

export default App;
