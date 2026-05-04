/* global React */
const { useState, useMemo } = React;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// ── Glyph: a simple monogram tile, category-tinted. No copyrighted sprites. ──
function Glyph({ name, category, donated }) {
  const initials = name.split(/\s|-/).filter(Boolean).slice(0, 2).map((s) => s[0]).join("").toUpperCase();
  const tint = `var(--chip-${category})`;
  return (
    <div className="ac-glyph" style={{
      background: donated ? tint : "transparent",
      borderColor: tint,
      color: donated ? "var(--surface)" : tint
    }}>
      <span>{initials}</span>
    </div>);

}

function Pill({ children, tone = "default", size = "sm" }) {
  return <span className={`ac-pill ac-pill-${tone} ac-pill-${size}`}>{children}</span>;
}

function MonthDots({ months, current }) {
  return (
    <div className="ac-monthdots" role="img" aria-label="Month availability">
      {Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        const on = months.includes(m);
        const here = m === current;
        return <span key={m} className={`ac-monthdot ${on ? "on" : ""} ${here ? "here" : ""}`} title={MONTHS[i]} />;
      })}
    </div>);

}

function MonthGrid({ months, current }) {
  return (
    <div className="ac-monthgrid">
      {MONTHS.map((m, i) => {
        const on = months.includes(i + 1);
        const here = i + 1 === current;
        return (
          <div key={m} className={`ac-monthcell ${on ? "on" : ""} ${here ? "here" : ""}`}>
            <span className="ac-monthcell-label">{m}</span>
          </div>);

      })}
    </div>);

}

// ── Item row with inline expand panel ──
function ItemRow({ item, category, donated, onToggle, currentMonth, expanded, onExpand }) {
  const leavingSoon = item.months && item.months.includes(currentMonth) && !item.months.includes(currentMonth === 12 ? 1 : currentMonth + 1);
  const newThisMonth = item.months && item.months.includes(currentMonth) && !item.months.includes(currentMonth === 1 ? 12 : currentMonth - 1);

  return (
    <div className={`ac-row ${expanded ? "ac-row-expanded" : ""} ${donated ? "ac-row-donated" : ""}`}>
      <button className="ac-row-main" onClick={onExpand}>
        <Glyph name={item.name} category={category} donated={donated} />
        <div className="ac-row-text">
          <div className="ac-row-name">
            <span>{item.name}</span>
            {donated && <span className="ac-row-checkmark" aria-label="donated">●</span>}
          </div>
          <div className="ac-row-meta">
            {item.habitat && <span className="ac-row-meta-bit">{item.habitat.replace("-", " · ")}</span>}
            {item.location && <span className="ac-row-meta-bit">{item.location}</span>}
            {item.part && <span className="ac-row-meta-bit">{item.part}</span>}
            {item.basedOn && <span className="ac-row-meta-bit ac-row-meta-italic">{item.basedOn}</span>}
            {item.value != null && <span className="ac-row-meta-bit ac-row-meta-bells">{item.value.toLocaleString()} ✦</span>}
          </div>
        </div>
        <div className="ac-row-side">
          {leavingSoon && !donated && <Pill tone="warn">Leaving soon</Pill>}
          {newThisMonth && !donated && !leavingSoon && <Pill tone="accent">New this month</Pill>}
          {item.time && item.time !== "all day" && <span className="ac-row-time">{item.time}</span>}
          <span className={`ac-chevron ${expanded ? "ac-chevron-open" : ""}`}>›</span>
        </div>
      </button>
      {expanded &&
      <div className="ac-expand">
          {item.months &&
        <div className="ac-expand-section">
              <div className="ac-expand-label">Available in</div>
              <MonthGrid months={item.months} current={currentMonth} />
            </div>
        }
          <div className="ac-expand-side">
            {item.value != null &&
          <div className="ac-stat">
                <div className="ac-stat-num">{item.value.toLocaleString()}</div>
                <div className="ac-stat-label">bells · sell value</div>
              </div>
          }
            {item.shadow &&
          <div className="ac-stat">
                <div className="ac-stat-num ac-stat-num-text">{item.shadow}</div>
                <div className="ac-stat-label">shadow size</div>
              </div>
          }
            {item.time &&
          <div className="ac-stat">
                <div className="ac-stat-num ac-stat-num-text">{item.time}</div>
                <div className="ac-stat-label">active hours</div>
              </div>
          }
            {item.notes &&
          <div className="ac-note">{item.notes}</div>
          }
            <button
            className={`ac-donate-btn ${donated ? "ac-donate-btn-on" : ""}`}
            onClick={(e) => {e.stopPropagation();onToggle();}}>
            
              {donated ? "Donated ✓ — undonate" : "Mark as donated"}
            </button>
          </div>
        </div>
      }
    </div>);

}

window.ACComponents = { Glyph, Pill, MonthDots, MonthGrid, ItemRow, MONTHS, MONTHS_LONG };