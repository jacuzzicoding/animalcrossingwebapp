/* global React, ACComponents */
const { useState, useEffect, useRef, useMemo } = React;

// ── Town Manager: right-side drawer with switch / edit / create ──
function TownManager({ open, onClose, towns, activeTownId, onActivate, onUpdate, onCreate, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!open) { setEditingId(null); setCreating(false); }
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ac-tm-scrim" onClick={onClose}>
      <aside ref={drawerRef} className="ac-tm-drawer" onClick={e=>e.stopPropagation()} role="dialog" aria-label="Towns">
        <header className="ac-tm-head">
          <div>
            <div className="ac-tm-eyebrow">Your towns</div>
            <h2 className="ac-tm-title">Switch, edit, or add a town</h2>
          </div>
          <button className="ac-tm-close" onClick={onClose} aria-label="Close">×</button>
        </header>

        {towns.length === 0 && !creating && (
          <div className="ac-tm-empty">
            <div className="ac-tm-empty-glyph">○</div>
            <div className="ac-tm-empty-title">No towns yet</div>
            <div className="ac-tm-empty-sub">Create your first town to start tracking donations.</div>
          </div>
        )}

        <div className="ac-tm-list">
          {towns.map(t => (
            <TownRow
              key={t.id}
              town={t}
              active={t.id === activeTownId}
              editing={editingId === t.id}
              onActivate={()=>onActivate(t.id)}
              onEditStart={()=>setEditingId(t.id)}
              onEditCancel={()=>setEditingId(null)}
              onSave={(patch)=>{ onUpdate(t.id, patch); setEditingId(null); }}
              onDelete={()=>onDelete(t.id)}
              canDelete={towns.length > 1}
            />
          ))}
        </div>

        <footer className="ac-tm-foot">
          {creating ? (
            <NewTownForm
              onCancel={()=>setCreating(false)}
              onCreate={(t)=>{ onCreate(t); setCreating(false); }}
            />
          ) : (
            <button className="ac-tm-cta" onClick={()=>setCreating(true)}>
              <span className="ac-tm-cta-plus">+</span>
              <span>New town</span>
            </button>
          )}
        </footer>
      </aside>
    </div>
  );
}

const GAMES = [
  { id: "acgcn", label: "GameCube",     short: "GCN" },
  { id: "acww",  label: "Wild World",   short: "WW" },
  { id: "accf",  label: "City Folk",    short: "CF" },
  { id: "acnl",  label: "New Leaf",     short: "NL" },
  { id: "acnh",  label: "New Horizons", short: "NH" },
];

function TownRow({ town, active, editing, onActivate, onEditStart, onEditCancel, onSave, onDelete, canDelete }) {
  const [name, setName] = useState(town.name);
  const [gameId, setGameId] = useState(town.gameId);
  const [hemisphere, setHemisphere] = useState(town.hemisphere || "NH");
  useEffect(() => { setName(town.name); setGameId(town.gameId); setHemisphere(town.hemisphere || "NH"); }, [town, editing]);

  const game = GAMES.find(g => g.id === town.gameId);

  if (editing) {
    return (
      <div className="ac-tm-row ac-tm-row-editing">
        <div className="ac-tm-form">
          <label className="ac-tm-field">
            <span className="ac-tm-field-label">Town name</span>
            <input className="ac-tm-input" value={name} onChange={e=>setName(e.target.value)} autoFocus />
          </label>
          <label className="ac-tm-field">
            <span className="ac-tm-field-label">Game</span>
            <select className="ac-tm-input" value={gameId} onChange={e=>setGameId(e.target.value)}>
              {GAMES.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
          </label>
          {gameId === "acnh" && (
            <label className="ac-tm-field">
              <span className="ac-tm-field-label">Hemisphere</span>
              <div className="ac-tm-seg">
                <button className={hemisphere==="NH"?"ac-tm-seg-on":""} onClick={()=>setHemisphere("NH")}>Northern</button>
                <button className={hemisphere==="SH"?"ac-tm-seg-on":""} onClick={()=>setHemisphere("SH")}>Southern</button>
              </div>
            </label>
          )}
        </div>
        <div className="ac-tm-row-actions">
          {canDelete && (
            <button className="ac-tm-danger" onClick={()=>{ if (confirm(`Delete "${town.name}"? This can't be undone.`)) onDelete(); }}>Delete</button>
          )}
          <div className="ac-tm-row-actions-right">
            <button className="ac-tm-ghost" onClick={onEditCancel}>Cancel</button>
            <button className="ac-tm-primary" onClick={()=>onSave({ name, gameId, hemisphere: gameId === "acnh" ? hemisphere : null })}>Save</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`ac-tm-row ${active?"ac-tm-row-active":""}`}>
      <button className="ac-tm-row-main" onClick={onActivate}>
        <div className="ac-tm-row-mark" style={{borderColor: active ? "var(--accent)" : "var(--border-strong)"}}>
          {active && <span className="ac-tm-row-tick">●</span>}
        </div>
        <div className="ac-tm-row-text">
          <div className="ac-tm-row-name">{town.name}</div>
          <div className="ac-tm-row-meta">
            <span className="ac-tm-badge">{game?.short || "?"}</span>
            <span>{game?.label}</span>
            {town.hemisphere && <><span className="ac-dot-sep">·</span><span>Hem. {town.hemisphere}</span></>}
            {town.itemCount != null && <><span className="ac-dot-sep">·</span><span>{town.itemCount} donated</span></>}
          </div>
        </div>
      </button>
      <button className="ac-tm-row-edit" onClick={onEditStart} aria-label="Edit town">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M11 2l3 3-9 9H2v-3l9-9z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}

function NewTownForm({ onCancel, onCreate }) {
  const [name, setName] = useState("");
  const [gameId, setGameId] = useState("acnh");
  const [hemisphere, setHemisphere] = useState("NH");
  return (
    <div className="ac-tm-newform">
      <input className="ac-tm-input" autoFocus placeholder="Town name (e.g. Marigold)" value={name} onChange={e=>setName(e.target.value)} />
      <select className="ac-tm-input" value={gameId} onChange={e=>setGameId(e.target.value)}>
        {GAMES.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
      </select>
      {gameId === "acnh" && (
        <div className="ac-tm-seg">
          <button className={hemisphere==="NH"?"ac-tm-seg-on":""} onClick={()=>setHemisphere("NH")}>Northern</button>
          <button className={hemisphere==="SH"?"ac-tm-seg-on":""} onClick={()=>setHemisphere("SH")}>Southern</button>
        </div>
      )}
      <div className="ac-tm-newform-actions">
        <button className="ac-tm-ghost" onClick={onCancel}>Cancel</button>
        <button className="ac-tm-primary" disabled={!name.trim()} onClick={()=>onCreate({ name: name.trim(), gameId, hemisphere: gameId === "acnh" ? hemisphere : null })}>Create town</button>
      </div>
    </div>
  );
}

// ── Global Search Dropdown ──
const SEARCH_HISTORY_KEY = "ac-curator-search-history";
function loadHistory() { try { return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || "[]"); } catch { return []; } }
function saveHistory(arr) { try { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(arr.slice(0, 8))); } catch {} }

function GlobalSearchDropdown({ query, data, donated, onJump, onClose }) {
  const [history, setHistory] = useState(loadHistory());
  const [activeIdx, setActiveIdx] = useState(0);

  const grouped = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.trim().toLowerCase();
    const g = { fish:[], bugs:[], fossils:[], art:[], sea:[] };
    for (const cat of Object.keys(g)) {
      if (!data[cat]) continue;
      g[cat] = data[cat].filter(it =>
        it.name.toLowerCase().includes(q) ||
        (it.basedOn||"").toLowerCase().includes(q)
      ).slice(0, 5);
    }
    return g;
  }, [query, data]);

  const flatList = useMemo(() => {
    if (!grouped) return [];
    return ["fish","bugs","fossils","art","sea"].flatMap(cat => grouped[cat].map(it => ({...it, _cat:cat})));
  }, [grouped]);

  useEffect(() => { setActiveIdx(0); }, [query]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i+1, flatList.length-1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i-1, 0)); }
      else if (e.key === "Enter" && flatList[activeIdx]) {
        const it = flatList[activeIdx];
        commitSearch(it.name);
        onJump(it._cat, it.id);
      } else if (e.key === "Escape") { onClose(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flatList, activeIdx, onJump, onClose]);

  function commitSearch(term) {
    const next = [term, ...history.filter(h => h !== term)].slice(0, 8);
    setHistory(next); saveHistory(next);
  }

  function clearHistory() { setHistory([]); saveHistory([]); }

  // Empty-input state: recent searches
  if (!query.trim()) {
    if (history.length === 0) {
      return (
        <div className="ac-gs-panel">
          <div className="ac-gs-empty">
            <div className="ac-gs-empty-title">Search across categories</div>
            <div className="ac-gs-empty-sub">Type a name to find fish, bugs, fossils, or art at once.</div>
            <div className="ac-gs-hint"><kbd>↑↓</kbd> navigate · <kbd>↵</kbd> open · <kbd>esc</kbd> close</div>
          </div>
        </div>
      );
    }
    return (
      <div className="ac-gs-panel">
        <div className="ac-gs-section-head">
          <span className="ac-gs-eyebrow">Recent searches</span>
          <button className="ac-gs-clear" onClick={clearHistory}>Clear</button>
        </div>
        <div className="ac-gs-history">
          {history.map((h,i) => (
            <button key={i} className="ac-gs-history-row" onClick={()=>{ /* prefill — handled by parent via onJump('search',h) but simpler: set query */ window.dispatchEvent(new CustomEvent("ac-search-prefill", {detail: h})); }}>
              <span className="ac-gs-history-icon">↻</span>
              <span>{h}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // No matches
  const total = flatList.length;
  if (total === 0) {
    return (
      <div className="ac-gs-panel">
        <div className="ac-gs-empty">
          <div className="ac-gs-empty-title">No matches for "<em>{query}</em>"</div>
          <div className="ac-gs-empty-sub">Try a shorter term or check the spelling.</div>
        </div>
      </div>
    );
  }

  // Grouped results
  let rowIdx = -1;
  return (
    <div className="ac-gs-panel">
      {["fish","bugs","fossils","art","sea"].map(cat => {
        const items = grouped[cat];
        if (items.length === 0) return null;
        return (
          <div key={cat} className="ac-gs-group">
            <div className="ac-gs-group-head">
              <span className="ac-gs-group-dot" style={{background:`var(--chip-${cat})`}}/>
              <span className="ac-gs-eyebrow" style={{color:`var(--chip-${cat})`}}>{cat}</span>
              <span className="ac-gs-group-count">{items.length}</span>
            </div>
            {items.map(it => {
              rowIdx++;
              const isActive = rowIdx === activeIdx;
              const isDonated = donated[cat].has(it.id);
              return (
                <button
                  key={it.id}
                  className={`ac-gs-row ${isActive?"ac-gs-row-active":""}`}
                  onClick={()=>{ commitSearch(it.name); onJump(cat, it.id); }}
                >
                  <div className="ac-gs-row-glyph" style={{borderColor:`var(--chip-${cat})`,color:`var(--chip-${cat})`}}>
                    {it.name.split(/\s|-/).slice(0,2).map(s=>s[0]).join("").toUpperCase()}
                  </div>
                  <div className="ac-gs-row-text">
                    <div className="ac-gs-row-name">
                      {it.name}
                      {isDonated && <span className="ac-gs-row-donated">donated</span>}
                    </div>
                    <div className="ac-gs-row-meta">
                      {it.habitat || it.location || it.part || it.basedOn || "—"}
                      {it.value != null && <> · {it.value.toLocaleString()} ✦</>}
                    </div>
                  </div>
                  <span className="ac-gs-row-arrow">↵</span>
                </button>
              );
            })}
          </div>
        );
      })}
      <div className="ac-gs-foot">
        <span><kbd>↑↓</kbd> navigate</span>
        <span><kbd>↵</kbd> open</span>
        <span><kbd>esc</kbd> close</span>
      </div>
    </div>
  );
}

// ── Settings page ──
// Full-page route inside the main column (not a modal). Curator language: large
// title, eyebrow + sectioned cards, swatch tiles for theme. Esc closes.
function SettingsPage({ open, onClose, theme, onThemeChange, onResetDonations, onResetAll, townCount, totalDonations }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const themes = [
    { id: "meadow",    label: "Meadow",    sub: "Default — moss + cream",   swatches: ["#FFFDF7","#F4EFE3","oklch(0.55 0.09 150)","oklch(0.62 0.08 230)"] },
    { id: "parchment", label: "Parchment", sub: "Cozy paper + wood",        swatches: ["#F5E9D4","#EFE6D0","#3CA370","#7B5E3B"] },
    { id: "midnight",  label: "Midnight",  sub: "Low-light reading",        swatches: ["#1E212A","#16181F","oklch(0.7 0.12 165)","oklch(0.7 0.1 230)"] },
    { id: "sakura",    label: "Sakura",    sub: "Spring blossom",           swatches: ["#FFFCFB","#FBF0EE","oklch(0.62 0.13 5)","oklch(0.62 0.1 250)"] },
  ];

  return (
    <div className="ac-settings">
      <header className="ac-settings-head">
        <div>
          <div className="ac-settings-eyebrow">Curator</div>
          <h1 className="ac-settings-title"><em>Settings</em></h1>
        </div>
        <button className="ac-settings-close" onClick={onClose} aria-label="Close settings">✕</button>
      </header>

      <section className="ac-settings-section">
        <div className="ac-settings-section-head">
          <h2 className="ac-settings-section-title">Appearance</h2>
          <p className="ac-settings-section-sub">Pick a palette. Choice persists across sessions.</p>
        </div>
        <div className="ac-theme-grid">
          {themes.map(t => (
            <button
              key={t.id}
              className={`ac-theme-card ${theme===t.id?"ac-theme-card-active":""}`}
              onClick={()=>onThemeChange(t.id)}
              aria-pressed={theme===t.id}
            >
              <div className="ac-theme-preview">
                {t.swatches.map((s,i) => (
                  <div key={i} className="ac-theme-swatch" style={{background: s}}/>
                ))}
              </div>
              <div className="ac-theme-meta">
                <div className="ac-theme-name">
                  {t.label}
                  {theme===t.id && <span className="ac-theme-check">●</span>}
                </div>
                <div className="ac-theme-sub">{t.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="ac-settings-section">
        <div className="ac-settings-section-head">
          <h2 className="ac-settings-section-title">About</h2>
        </div>
        <div className="ac-settings-card">
          <dl className="ac-about-list">
            <div><dt>Version</dt><dd>v0.9.2-alpha · Curator</dd></div>
            <div><dt>Source</dt><dd><a href="https://github.com/jacuzzicoding/animalcrossingwebapp" target="_blank" rel="noopener">jacuzzicoding/animalcrossingwebapp</a></dd></div>
            <div><dt>Storage</dt><dd>localStorage · {townCount} {townCount===1?"town":"towns"} · {totalDonations} donations</dd></div>
            <div><dt>Credits</dt><dd>Companion app for the Animal Crossing series. Not affiliated with Nintendo.</dd></div>
          </dl>
        </div>
      </section>

      <section className="ac-settings-section">
        <div className="ac-settings-section-head">
          <h2 className="ac-settings-section-title">Danger zone</h2>
          <p className="ac-settings-section-sub">These actions cannot be undone.</p>
        </div>
        <div className="ac-settings-card ac-settings-danger">
          <div className="ac-danger-row">
            <div>
              <div className="ac-danger-name">Reset donations for active town</div>
              <div className="ac-danger-sub">Clears all donation marks. Towns themselves are kept.</div>
            </div>
            <button className="ac-danger-btn" onClick={onResetDonations}>Reset donations</button>
          </div>
          <div className="ac-danger-row">
            <div>
              <div className="ac-danger-name">Reset everything</div>
              <div className="ac-danger-sub">Deletes all towns, donations, and search history.</div>
            </div>
            <button className="ac-danger-btn ac-danger-btn-strong" onClick={onResetAll}>Reset all data</button>
          </div>
        </div>
      </section>
    </div>
  );
}

window.ACAddOns = { TownManager, GlobalSearchDropdown, SettingsPage, GAMES };
