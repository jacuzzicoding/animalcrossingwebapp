import { Analytics } from '@vercel/analytics/react';
import ACCanvas from './components/ACCanvas';
import { useHydration } from './hooks/useHydration';

function App() {
  const hydrated = useHydration();

  if (!hydrated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#F5E9D4' }}>
        <span style={{ color: '#7B5E3B', fontFamily: 'Varela Round, sans-serif', fontSize: 18 }}>
          Loading museum…
        </span>
      </div>
    );
  }

  return (
    <>
      <ACCanvas />
      <Analytics />
    </>
  );
}

export default App;
