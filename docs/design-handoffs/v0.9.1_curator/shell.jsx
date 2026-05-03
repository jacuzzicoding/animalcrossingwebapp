/* global React, ACComponents */
const { useState, useMemo } = React;
const { Glyph, Pill, MonthDots, MonthGrid, ItemRow, MONTHS, MONTHS_LONG } = ACComponents;

// ── Header / sidebar / shell ──
function Sidebar({ town, currentTab, onTab, stats, onOpenTowns }) {
  const hasSea = town.gameId === "acnh" || town.gameId === "acnl";
  const tabs = [
    { id: "home", label: "Home" },
    { id: "fish", label: "Fish", n: stats.fish },
    { id: "bugs", label: "Bugs", n: stats.bugs },
    { id: "fossils", label: "Fossils", n: stats.fossils },
    { id: "art", label: "Art", n: stats.art },
    ...(hasSea ? [{ id: "sea", label: "Sea", n: stats.sea }] : []),
    { id: "stats", label: "Stats" },
  ];
  return (
    <aside className="ac-sidebar">
      <div className="ac-brand">
        <div className="ac-brand-mark">
          <svg viewBox="0 0 32 32" width="22" height="22">
            <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10 18 Q16 8 22 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="16" cy="20" r="1.6" fill="currentColor"/>
          </svg>
        </div>
        <div className="ac-brand-text">
          <div className="ac-brand-name">Curator</div>
          <div className="ac-brand-sub">a museum companion</div>
        </div>
      </div>

      <div className="ac-town-card">
        <div className="ac-town-label">Active town</div>
        <div className="ac-town-name">{town.townName}</div>
        <div className="ac-town-meta">
          <span>{town.game}</span>
          <span className="ac-dot-sep">·</span>
          <span>Hem. {town.hemisphere}</span>
        </div>
        <button className="ac-town-switch" onClick={onOpenTowns}>Switch town ›</button>
      </div>

      <nav className="ac-nav">
        {tabs.map(t => (
          <button
            key={t.id}
            className={`ac-nav-item ${currentTab===t.id?"ac-nav-item-active":""}`}
            onClick={()=>onTab(t.id)}
          >
            <span>{t.label}</span>
            {t.n && <span className="ac-nav-count">{t.n.donated}<span className="ac-nav-count-slash">/</span>{t.n.total}</span>}
          </button>
        ))}
      </nav>

      <div className="ac-sidebar-foot">
        <button className="ac-foot-link">Export CSV</button>
        <button className="ac-foot-link">Settings</button>
      </div>
    </aside>
  );
}

function MonthStrip({ current }) {
  return (
    <div className="ac-monthstrip">
      {MONTHS.map((m,i) => (
        <div key={m} className={`ac-monthstrip-cell ${i+1===current?"is-now":""}`}>
          <span className="ac-monthstrip-num">{String(i+1).padStart(2,"0")}</span>
          <span className="ac-monthstrip-name">{m}</span>
        </div>
      ))}
    </div>
  );
}

function ProgressMeter({ stats }) {
  const total = stats.fish.total + stats.bugs.total + stats.fossils.total + stats.art.total;
  const done  = stats.fish.donated + stats.bugs.donated + stats.fossils.donated + stats.art.donated;
  const pct = Math.round((done/total)*100);
  return (
    <div className="ac-meter">
      <div className="ac-meter-head">
        <div>
          <div className="ac-meter-eyebrow">Museum progress</div>
          <div className="ac-meter-num">
            <span className="ac-meter-done">{done}</span>
            <span className="ac-meter-of"> / {total}</span>
          </div>
        </div>
        <div className="ac-meter-pct">{pct}<span className="ac-meter-pct-sym">%</span></div>
      </div>
      <div className="ac-meter-bar">
        {["fish","bugs","fossils","art"].map(k => {
          const seg = stats[k];
          const frac = seg.total/total;
          return (
            <div key={k} className="ac-meter-seg" style={{flex: frac}}>
              <div className="ac-meter-seg-fill" style={{
                width: `${(seg.donated/seg.total)*100}%`,
                background: `var(--chip-${k})`
              }}/>
              <div className="ac-meter-seg-label">
                <span className="ac-meter-seg-dot" style={{background:`var(--chip-${k})`}}/>
                <span>{k}</span>
                <span className="ac-meter-seg-frac">{seg.donated}/{seg.total}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.ACShell = { Sidebar, MonthStrip, ProgressMeter };
