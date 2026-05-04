import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';

export function SettingsPage() {
  const navigate = useNavigate();
  const towns = useAppStore(s => s.towns);
  const donated = useAppStore(s => s.donated);
  const activeTownId = useAppStore(s => s.activeTownId);
  const resetActiveTownDonations = useAppStore(s => s.resetActiveTownDonations);
  const resetAll = useAppStore(s => s.resetAll);

  const totalDonations = useMemo(() => {
    let n = 0;
    for (const byGame of Object.values(donated)) {
      for (const byItem of Object.values(byGame)) {
        n += Object.keys(byItem).length;
      }
    }
    return n;
  }, [donated]);

  const townCount = towns.length;
  const version = import.meta.env.VITE_APP_VERSION ?? '0.9.0-beta';

  function handleClose() {
    if (activeTownId) {
      navigate(`/town/${activeTownId}/home`);
    } else {
      navigate('/');
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTownId]);

  function handleResetDonations() {
    if (!activeTownId) return;
    const town = towns.find(t => t.id === activeTownId);
    const name = town?.name ?? 'this town';
    if (
      window.confirm(
        `Reset all donations for "${name}"? This cannot be undone.`
      )
    ) {
      resetActiveTownDonations();
    }
  }

  function handleResetAll() {
    if (
      window.confirm(
        'Reset everything? This deletes all towns, donations, and search history. This cannot be undone.'
      )
    ) {
      resetAll();
      navigate('/');
    }
  }

  const canResetActive = !!activeTownId;

  return (
    <div className="ac-settings">
      <header className="ac-settings-head">
        <div>
          <div className="ac-settings-eyebrow">Museum Tracker</div>
          <h1 className="ac-settings-title">
            <em>Settings</em>
          </h1>
        </div>
        <button
          className="ac-settings-close"
          onClick={handleClose}
          aria-label="Close settings"
        >
          ✕
        </button>
      </header>

      <section className="ac-settings-section">
        <div className="ac-settings-section-head">
          <h2 className="ac-settings-section-title">About</h2>
        </div>
        <div className="ac-settings-card">
          <dl className="ac-about-list">
            <div>
              <dt>Version</dt>
              <dd>v{version}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>
                <a
                  href="https://github.com/jacuzzicoding/animalcrossingwebapp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  jacuzzicoding/animalcrossingwebapp
                </a>
              </dd>
            </div>
            <div>
              <dt>Storage</dt>
              <dd>
                localStorage · {townCount} {townCount === 1 ? 'town' : 'towns'}{' '}
                · {totalDonations}{' '}
                {totalDonations === 1 ? 'donation' : 'donations'}
              </dd>
            </div>
            <div>
              <dt>Credits</dt>
              <dd>
                Companion app for the Animal Crossing series. Not affiliated
                with Nintendo.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="ac-settings-section">
        <div className="ac-settings-section-head">
          <h2 className="ac-settings-section-title">Danger zone</h2>
          <p className="ac-settings-section-sub">
            These actions cannot be undone.
          </p>
        </div>
        <div className="ac-settings-card ac-settings-danger">
          <div className="ac-danger-row">
            <div>
              <div className="ac-danger-name">
                Reset donations for active town
              </div>
              <div className="ac-danger-sub">
                Clears all donation marks. Towns themselves are kept.
              </div>
            </div>
            <button
              className="ac-danger-btn"
              onClick={handleResetDonations}
              disabled={!canResetActive}
            >
              Reset donations
            </button>
          </div>
          <div className="ac-danger-row">
            <div>
              <div className="ac-danger-name">Reset everything</div>
              <div className="ac-danger-sub">
                Deletes all towns, donations, and search history.
              </div>
            </div>
            <button
              className="ac-danger-btn ac-danger-btn-strong"
              onClick={handleResetAll}
            >
              Reset all data
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SettingsPage;
