import { useState } from 'react';
import { useAppStore } from '../lib/store';
import { Sidebar } from './Sidebar';
import { SettingsPage } from './SettingsPage';
import { CreateTownModal } from './modals/CreateTownModal';
import { EditTownModal } from './modals/EditTownModal';
import { useMuseumData } from '../hooks/useMuseumData';
import { useCategoryStats } from '../hooks/useCategoryStats';
import { downloadCSV } from '../lib/csvExport';

// Stable empty fallbacks
const EMPTY_DONATED: Record<string, boolean> = {};
const EMPTY_DONATED_AT: Record<string, string> = {};

export default function SettingsRoute() {
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

  const [showCreateTown, setShowCreateTown] = useState(false);
  const [showEditTown, setShowEditTown] = useState(false);

  const { data } = useMuseumData(activeTown?.gameId ?? 'ACGCN');
  const catCounts = useCategoryStats(data, activeTownDonated);

  function handleExport() {
    if (!activeTown) return;
    downloadCSV(
      data,
      activeTownDonated,
      activeTownDonatedAt,
      activeTown.name,
      activeTown.playerName
    );
  }

  return (
    <div className="ac-app">
      {activeTownId && (
        <Sidebar
          townId={activeTownId}
          data={data}
          catCounts={catCounts}
          onOpenCreateTown={() => setShowCreateTown(true)}
          onOpenEditTown={() => setShowEditTown(true)}
          onExport={handleExport}
        />
      )}
      <main className="ac-main">
        <SettingsPage />
      </main>

      <CreateTownModal
        isOpen={showCreateTown}
        required={false}
        onClose={() => setShowCreateTown(false)}
      />
      <EditTownModal
        isOpen={showEditTown}
        town={activeTown ?? null}
        onClose={() => setShowEditTown(false)}
      />
    </div>
  );
}
