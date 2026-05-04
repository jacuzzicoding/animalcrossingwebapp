import React from 'react';
import {
  displayName,
  itemBells,
  itemMonths,
  isFish,
  isFossil,
  isArtPiece,
  isSeaCreature,
  type AnyItem,
} from '../lib/utils';
import type { CategoryId, GameId } from '../lib/types';
import { ItemIcon } from './ItemIcon';
import { useGameHasIcons } from './itemIconUtils';

function getInitials(name: string): string {
  return name
    .split(/\s|-/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0])
    .join('')
    .toUpperCase();
}

function Glyph({
  name,
  category,
  donated,
}: {
  name: string;
  category: CategoryId;
  donated: boolean;
}) {
  const tintVar =
    category === 'sea_creatures'
      ? 'var(--chip-sea)'
      : `var(--chip-${category})`;
  return (
    <div
      className="ac-glyph"
      style={{
        background: donated ? tintVar : 'transparent',
        borderColor: tintVar,
        color: donated ? 'var(--surface)' : tintVar,
      }}
    >
      <span>{getInitials(name)}</span>
    </div>
  );
}

function metaBits(
  item: AnyItem,
  category: CategoryId,
  bells: number | null
): { text: string; italic?: boolean; bells?: boolean }[] {
  const out: { text: string; italic?: boolean; bells?: boolean }[] = [];
  if (isFish(item) && item.habitat) {
    out.push({ text: item.habitat.replace('-', ' · ') });
  }
  if (isFossil(item) && item.part) {
    out.push({ text: item.part });
  }
  if (isSeaCreature(item) && item.shadow) {
    out.push({ text: item.shadow });
  }
  if (isArtPiece(item) && item.basedOn) {
    out.push({ text: item.basedOn, italic: true });
  }
  if (bells != null) {
    out.push({ text: `${bells.toLocaleString()} ✦`, bells: true });
  }
  return out;
}

export function CollectibleRow({
  item,
  category,
  checked,
  onClick,
  expanded,
  highlighted,
  hemisphere,
  currentMonth,
  gameId,
}: {
  item: AnyItem;
  category: CategoryId;
  checked: boolean;
  onClick: () => void;
  expanded?: boolean;
  highlighted?: boolean;
  hemisphere?: 'NH' | 'SH';
  currentMonth?: number;
  gameId?: GameId;
}) {
  const useIcons = useGameHasIcons(gameId ?? 'ACGCN') && !!gameId;
  const name = displayName(item, category);
  const bells = itemBells(item, category);
  const months = itemMonths(item, category, hemisphere);
  const cm = currentMonth ?? new Date().getMonth() + 1;

  const hasMonths = !!(months && months.length > 0);
  const inThisMonth = hasMonths && months!.includes(cm);
  const next = cm === 12 ? 1 : cm + 1;
  const prev = cm === 1 ? 12 : cm - 1;
  const leavingSoon = inThisMonth && !months!.includes(next);
  const newThisMonth = inThisMonth && !months!.includes(prev);

  const time = isSeaCreature(item) ? item.time : undefined;

  const bits = metaBits(item, category, bells);

  const classes = [
    'ac-row',
    expanded ? 'ac-row-expanded' : '',
    checked ? 'ac-row-donated' : '',
    highlighted ? 'ac-row-pulse' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div data-row-id={item.id} className={classes}>
      <button type="button" className="ac-row-main" onClick={onClick}>
        {useIcons ? (
          <ItemIcon
            gameId={gameId!}
            category={category}
            id={item.id}
            size={32}
            className="ac-row-icon"
            alt=""
          />
        ) : (
          <Glyph name={name} category={category} donated={checked} />
        )}
        <div className="ac-row-text">
          <div className="ac-row-name">
            <span>{name}</span>
            {checked && (
              <span
                className="ac-row-checkmark"
                role="img"
                aria-label="donated"
              >
                ●
              </span>
            )}
          </div>
          {bits.length > 0 && (
            <div className="ac-row-meta">
              {bits.map((b, i) => (
                <span
                  key={i}
                  className={[
                    'ac-row-meta-bit',
                    b.italic ? 'ac-row-meta-italic' : '',
                    b.bells ? 'ac-row-meta-bells' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {b.text}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="ac-row-side">
          {leavingSoon && !checked && (
            <span className="ac-pill ac-pill-warn">Leaving soon</span>
          )}
          {newThisMonth && !leavingSoon && !checked && (
            <span className="ac-pill ac-pill-accent">New this month</span>
          )}
          {time && time !== 'all day' && (
            <span className="ac-row-time">{time}</span>
          )}
          {expanded !== undefined && (
            <span
              className={`ac-chevron ${expanded ? 'ac-chevron-open' : ''}`}
              aria-hidden
            >
              ›
            </span>
          )}
        </div>
      </button>
    </div>
  );
}
