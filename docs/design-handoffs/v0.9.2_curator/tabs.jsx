/* global React, ACComponents, ACShell */
const { useState, useMemo, useEffect } = React;
const { ItemRow, Pill, MonthDots, MONTHS, MONTHS_LONG } = ACComponents;
const { MonthStrip, ProgressMeter } = ACShell;

// ── Home tab ──
function HomeTab({ data, donated, currentMonth, onJump, onToggle, showLeavingShelf = true, showNewShelf = true, gameId }) {
  const hasSea = (gameId === "acnh" || gameId === "acnl") && data.sea && data.sea.length > 0;
  const allItems = useMemo(() => [
    ...data.fish.map(x=>({...x, _cat:"fish"})),
    ...data.bugs.map(x=>({...x, _cat:"bugs"})),
    ...(hasSea ? data.sea.map(x=>({...x, _cat:"sea"})) : []),
  ], [data, hasSea]);

  const leavingSoon = allItems.filter(it =>
    it.months && it.months.includes(currentMonth) &&
    !it.months.includes(currentMonth === 12 ? 1 : currentMonth+1) &&
    !donated[it._cat].has(it.id)
  );

  const newThisMonth = allItems.filter(it =>
    it.months && it.months.includes(currentMonth) &&
    !it.months.includes(currentMonth === 1 ? 12 : currentMonth-1) &&
    !donated[it._cat].has(it.id)
  );

  const stillNeeded = allItems.filter(it =>
    it.months && it.months.includes(currentMonth) && !donated[it._cat].has(it.id)
  ).length;

  return (
    <div className="ac-home">
      <div className="ac-hero">
        <div className="ac-hero-eyebrow">Available in {MONTHS_LONG[currentMonth-1]}</div>
        <h1 className="ac-hero-title">
          <em>{stillNeeded}</em> creatures still to donate this month.
          {leavingSoon.length > 0 && <><br/><span className="ac-hero-aside">{leavingSoon.length} are leaving soon.</span></>}
        </h1>
        <MonthStrip current={currentMonth} />
      </div>

      <ProgressMeter
        gameId={gameId}
        stats={{
          fish: { donated: donated.fish.size, total: data.fish.length },
          bugs: { donated: donated.bugs.size, total: data.bugs.length },
          fossils: { donated: donated.fossils.size, total: data.fossils.length },
          art: { donated: donated.art.size, total: data.art.length },
          sea: { donated: (donated.sea||new Set()).size, total: (data.sea||[]).length },
        }}
      />

      {showLeavingShelf && leavingSoon.length > 0 && (
        <section className="ac-shelf">
          <div className="ac-shelf-head">
            <div>
              <div className="ac-shelf-eyebrow ac-shelf-eyebrow-warn">Leaving end of month</div>
              <h2 className="ac-shelf-title">Catch these before {MONTHS_LONG[currentMonth-1]} ends</h2>
            </div>
            <span className="ac-shelf-count">{leavingSoon.length}</span>
          </div>
          <div className="ac-cards">
            {leavingSoon.slice(0,6).map(it => (
              <button key={it._cat+it.id} className="ac-card" onClick={()=>onJump(it._cat, it.id)}>
                <div className="ac-card-glyph" style={{borderColor:`var(--chip-${it._cat})`,color:`var(--chip-${it._cat})`}}>
                  {it.name.split(/\s|-/).slice(0,2).map(s=>s[0]).join("").toUpperCase()}
                </div>
                <div className="ac-card-body">
                  <div className="ac-card-name">{it.name}</div>
                  <div className="ac-card-meta">
                    <span style={{color:`var(--chip-${it._cat})`}}>{it._cat}</span>
                    <span> · {it.value.toLocaleString()} ✦</span>
                  </div>
                  <MonthDots months={it.months} current={currentMonth} />
                </div>
                <div className="ac-card-warn">⚠</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {showNewShelf && newThisMonth.length > 0 && (
      <section className="ac-shelf">
        <div className="ac-shelf-head">
          <div>
            <div className="ac-shelf-eyebrow">Just arrived</div>
            <h2 className="ac-shelf-title">New this month</h2>
          </div>
          <span className="ac-shelf-count">{newThisMonth.length}</span>
        </div>
        <div className="ac-cards">
          {newThisMonth.slice(0,6).map(it => (
            <button key={it._cat+it.id} className="ac-card" onClick={()=>onJump(it._cat, it.id)}>
              <div className="ac-card-glyph" style={{borderColor:`var(--chip-${it._cat})`,color:`var(--chip-${it._cat})`}}>
                {it.name.split(/\s|-/).slice(0,2).map(s=>s[0]).join("").toUpperCase()}
              </div>
              <div className="ac-card-body">
                <div className="ac-card-name">{it.name}</div>
                <div className="ac-card-meta">
                  <span style={{color:`var(--chip-${it._cat})`}}>{it._cat}</span>
                  <span> · {it.value.toLocaleString()} ✦</span>
                </div>
                <MonthDots months={it.months} current={currentMonth} />
              </div>
            </button>
          ))}
        </div>
      </section>
      )}

      <section className="ac-shelf">
        <div className="ac-shelf-head">
          <div>
            <div className="ac-shelf-eyebrow">Recent</div>
            <h2 className="ac-shelf-title">Latest donations</h2>
          </div>
        </div>
        <div className="ac-activity">
          {data.recentActivity.map((a,i) => (
            <div key={i} className="ac-activity-row">
              <div className="ac-activity-dot" style={{background:`var(--chip-${a.category})`}}/>
              <div className="ac-activity-name">{a.item}</div>
              <div className="ac-activity-cat">{a.category}</div>
              <div className="ac-activity-when">{a.when}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ── Category tab (sectioned list) ──
function CategoryTab({ category, items, donated, onToggle, currentMonth, search, highlightId, onHighlightConsumed }) {
  const [expanded, setExpanded] = useState(null);

  // Scroll-to + highlight when highlightId arrives
  useEffect(() => {
    if (!highlightId) return;
    setExpanded(highlightId);
    // wait a frame for expand to render
    const raf = requestAnimationFrame(() => {
      const el = document.querySelector(`[data-row-id="${CSS.escape(highlightId)}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ac-row-pulse");
        setTimeout(() => el.classList.remove("ac-row-pulse"), 1400);
      }
      onHighlightConsumed && onHighlightConsumed();
    });
    return () => cancelAnimationFrame(raf);
  }, [highlightId, onHighlightConsumed]);

  const lowered = search.trim().toLowerCase();
  const filtered = lowered
    ? items.filter(i => i.name.toLowerCase().includes(lowered) || (i.basedOn||"").toLowerCase().includes(lowered))
    : items;

  const isAvail = (it) => it.months ? it.months.includes(currentMonth) : true;
  const isLeavingSoon = (it) => it.months && it.months.includes(currentMonth) &&
    !it.months.includes(currentMonth===12?1:currentMonth+1);

  const groups = useMemo(() => {
    const leaving = [], avail = [], done = [], locked = [];
    for (const it of filtered) {
      const isDonated = donated.has(it.id);
      if (isDonated) done.push(it);
      else if (isLeavingSoon(it)) leaving.push(it);
      else if (isAvail(it)) avail.push(it);
      else locked.push(it);
    }
    const byName = (a,b)=>a.name.localeCompare(b.name);
    return [
      { id: "leaving", label: "Leaving this month", items: leaving.sort(byName), tone: "warn" },
      { id: "avail",   label: "Available now",       items: avail.sort(byName),   tone: "accent" },
      { id: "locked",  label: "Out of season",       items: locked.sort(byName),  tone: "muted" },
      { id: "done",    label: "Already donated",     items: done.sort(byName),    tone: "done" },
    ].filter(g => g.items.length > 0);
  }, [filtered, donated, currentMonth]);

  return (
    <div className="ac-category">
      {groups.map(g => (
        <section key={g.id} className={`ac-group ac-group-${g.tone}`}>
          <header className="ac-group-head">
            <h3 className="ac-group-title">{g.label}</h3>
            <span className="ac-group-count">{g.items.length}</span>
          </header>
          <div className="ac-list">
            {g.items.map(it => (
              <ItemRow
                key={it.id}
                item={it}
                category={category}
                donated={donated.has(it.id)}
                onToggle={()=>onToggle(it.id)}
                currentMonth={currentMonth}
                expanded={expanded === it.id}
                onExpand={()=>setExpanded(expanded===it.id?null:it.id)}
              />
            ))}
          </div>
        </section>
      ))}
      {groups.length === 0 && (
        <div className="ac-empty">No matches for "{search}"</div>
      )}
    </div>
  );
}

// ── Stats tab ──
function StatsTab({ data, donated, currentMonth }) {
  const counts = {
    fish: { donated: donated.fish.size, total: data.fish.length },
    bugs: { donated: donated.bugs.size, total: data.bugs.length },
    fossils: { donated: donated.fossils.size, total: data.fossils.length },
    art: { donated: donated.art.size, total: data.art.length },
  };

  // monthly bars: how many fish+bugs available per month
  const monthlyAvail = MONTHS.map((_, i) => {
    const m = i+1;
    let avail = 0, donatedCount = 0;
    for (const cat of ["fish","bugs"]) {
      for (const it of data[cat]) {
        if (it.months && it.months.includes(m)) {
          avail++;
          if (donated[cat].has(it.id)) donatedCount++;
        }
      }
    }
    return { avail, donatedCount, m };
  });
  const maxAvail = Math.max(...monthlyAvail.map(x=>x.avail));

  return (
    <div className="ac-stats">
      <div className="ac-stats-grid">
        {Object.entries(counts).map(([k,v]) => (
          <div key={k} className="ac-statcard">
            <div className="ac-statcard-cat" style={{color:`var(--chip-${k})`}}>{k}</div>
            <div className="ac-statcard-num">
              <span>{v.donated}</span>
              <span className="ac-statcard-of">/ {v.total}</span>
            </div>
            <div className="ac-statcard-bar">
              <div className="ac-statcard-fill" style={{
                width: `${(v.donated/v.total)*100}%`,
                background:`var(--chip-${k})`
              }}/>
            </div>
            <div className="ac-statcard-pct">{Math.round((v.donated/v.total)*100)}% complete</div>
          </div>
        ))}
      </div>

      <section className="ac-chartcard">
        <header className="ac-shelf-head">
          <div>
            <div className="ac-shelf-eyebrow">Yearly rhythm</div>
            <h2 className="ac-shelf-title">Fish &amp; bug availability by month</h2>
          </div>
        </header>
        <div className="ac-chart">
          {monthlyAvail.map(({avail, donatedCount, m}, i) => (
            <div key={m} className={`ac-chart-col ${m===currentMonth?"is-now":""}`}>
              <div className="ac-chart-bar">
                <div className="ac-chart-bar-bg" style={{height: `${(avail/maxAvail)*100}%`}}>
                  <div className="ac-chart-bar-fill" style={{height: `${(donatedCount/avail)*100}%`}}/>
                </div>
              </div>
              <div className="ac-chart-num">{avail}</div>
              <div className="ac-chart-month">{MONTHS[i]}</div>
            </div>
          ))}
        </div>
        <div className="ac-chart-legend">
          <span><span className="ac-chart-legend-dot ac-chart-legend-dot-bg"/>Available</span>
          <span><span className="ac-chart-legend-dot ac-chart-legend-dot-fill"/>Already donated</span>
        </div>
      </section>
    </div>
  );
}

window.ACTabs = { HomeTab, CategoryTab, StatsTab };
