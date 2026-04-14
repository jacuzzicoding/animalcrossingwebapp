import { Analytics } from '@vercel/analytics/react';
import ACCanvas from './components/ACCanvas';

function App() {
  return (
    <>
      <ACCanvas />
      <Analytics />
    </>
  );
}

export default App;
