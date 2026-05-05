import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';

export function CreditsPage() {
  const navigate = useNavigate();
  const activeTownId = useAppStore(s => s.activeTownId);

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

  return (
    <div className="ac-settings">
      <header className="ac-settings-head">
        <div>
          <div className="ac-settings-eyebrow">Museum Tracker</div>
          <h1 className="ac-settings-title">
            <em>Credits</em>
          </h1>
        </div>
        <button
          className="ac-settings-close"
          onClick={handleClose}
          aria-label="Close credits"
        >
          ✕
        </button>
      </header>

      <section className="ac-settings-section">
        <div className="ac-settings-section-head">
          <h2 className="ac-settings-section-title">Item icons</h2>
        </div>
        <div className="ac-settings-card">
          <p>
            Item icons are sourced from the Animal Crossing Fandom Wiki (
            <a
              href="https://animalcrossing.fandom.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              animalcrossing.fandom.com
            </a>
            ) under the Creative Commons Attribution-ShareAlike 3.0 license (
            <a
              href="https://creativecommons.org/licenses/by-sa/3.0/"
              target="_blank"
              rel="noopener noreferrer"
            >
              CC BY-SA 3.0
            </a>
            ).
          </p>
          <p>
            Animal Crossing (GameCube) icons were added in v0.9.1-beta.
            Cross-game icon routing landed in v0.9.2-beta along with the first
            two hand-drawn replacements (sea bass, koi). Additional games and
            hand-drawn icons will land in subsequent v0.9.x releases.
          </p>
        </div>
      </section>

      <section className="ac-settings-section">
        <div className="ac-settings-section-head">
          <h2 className="ac-settings-section-title">Trademarks</h2>
        </div>
        <div className="ac-settings-card">
          <p>
            Animal Crossing and all related characters, items, and assets are ©
            Nintendo Co., Ltd. This is an unofficial fan project not affiliated
            with, endorsed by, or supported by Nintendo.
          </p>
        </div>
      </section>

      <section className="ac-settings-section">
        <div className="ac-settings-section-head">
          <h2 className="ac-settings-section-title">Source</h2>
        </div>
        <div className="ac-settings-card">
          <p>
            This project is open source on GitHub:{' '}
            <a
              href="https://github.com/jacuzzicoding/animalcrossingwebapp"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/jacuzzicoding/animalcrossingwebapp
            </a>
            . Released under the MIT License — see{' '}
            <a
              href="https://github.com/jacuzzicoding/animalcrossingwebapp/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
            >
              LICENSE
            </a>{' '}
            and{' '}
            <a
              href="https://github.com/jacuzzicoding/animalcrossingwebapp/blob/main/NOTICE"
              target="_blank"
              rel="noopener noreferrer"
            >
              NOTICE
            </a>{' '}
            for details.
          </p>
        </div>
      </section>
    </div>
  );
}

export default CreditsPage;
