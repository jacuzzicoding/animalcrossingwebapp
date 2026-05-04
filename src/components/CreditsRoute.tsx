import { useAppStore } from '../lib/store';
import { Sidebar } from './Sidebar';
import { CreditsPage } from './CreditsPage';
import { useMuseumData } from '../hooks/useMuseumData';
import { useCategoryStats } from '../hooks/useCategoryStats';
import { downloadCSV } from '../lib/csvExport';

const EMPTY_DONATED: Record<string, boolean> = {};
const EMPTY_DONATED_AT: Record<string, string> = {};

export default function CreditsRoute() {
  const towns = useAppStore(s => s.towns);
  const activeTownId = useAppStore(s => s.activeTownId);
  const activeTown = towns.find(t => t.id === activeTownId);

  const activeTownDonated = useAppStore(s => {
    if (!s.activeTownId) return EMPTY_DONATED;
    const town = s.towns.find(t => t.id === s.activeTownId);
    if (!town) return EMPTY_DONATED;
    return s.donated[s.activeTownId]?.[town.gameId] ?? EMPTY_DONATED;
  });
  const activeTownDonatedAt = useAppStore(s => {
    if (!s.activeTownId) return EMPTY_DONATED_AT;
    const town = s.towns.find(t => t.id === s.activeTownId);
    if (!town) return EMPTY_DONATED_AT;
    return s.donatedAt[s.activeTownId]?.[town.gameId] ?? EMPTY_DONATED_AT;
  });

  const { data } = useMuseumData(activeTown?.gameId ?? 'ACGCN');
  const catCounts = useCategoryStats(data, activeTownDonated);

  function handleExport() {
    if (!activeTown) return;
    downloadCSV(data, activeTownDonated, activeTownDonatedAt, activeTown.name);
  }

  return (
    <div className="ac-app">
      {activeTownId && (
        <Sidebar
          townId={activeTownId}
          data={data}
          catCounts={catCounts}
          onExport={handleExport}
        />
      )}
      <main className="ac-main">
        <CreditsPage />
      </main>
    </div>
  );
}
