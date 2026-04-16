import { Analytics } from '@vercel/analytics/react';
import ACCanvas from './components/ACCanvas';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <ACCanvas />
      <Analytics />
    </ErrorBoundary>
  );
}

export default App;
