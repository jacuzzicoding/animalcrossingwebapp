import React from 'react';
import { MonthGrid } from './shared/MonthGrid';
import {
  itemBells,
  itemMonths,
  itemNotes,
  isSeaCreature,
  isArtPiece,
  formatTimestamp,
  type AnyItem,
} from '../lib/utils';
import type { CategoryId, GameId } from '../lib/types';
import { ItemIcon } from './ItemIcon';
import { useHasIcon } from './itemIconUtils';

export function ItemExpandPanel({
  item,
  category,
  checked,
  donatedAt,
  onToggle,
  hemisphere,
  currentMonth,
  gameId,
}: {
  item: AnyItem;
  category: CategoryId;
  checked: boolean;
  donatedAt?: string;
  onToggle: () => void;
  hemisphere?: 'NH' | 'SH';
  currentMonth?: number;
  gameId?: GameId;
}) {
  const bells = itemBells(item, category);
  const months = itemMonths(item, category, hemisphere);
  // Sea creatures render `time` as the "active hours" stat below; suppress the
  // notes block to avoid showing the same string twice.
  const notes = isSeaCreature(item) ? undefined : itemNotes(item);
  const cm = currentMonth ?? new Date().getMonth() + 1;
  const shadow = isSeaCreature(item) ? item.shadow : undefined;
  const time = isSeaCreature(item) ? item.time : undefined;
  const art = isArtPiece(item) ? item : undefined;

  const hasMonths = !!(months && months.length > 0);

  const showIcon = useHasIcon(category, item.id);

  return (
    <div className={`ac-expand${hasMonths ? '' : ' ac-expand-no-months'}`}>
      {showIcon && (
        <div className="ac-expand-icon">
          <ItemIcon
            gameId={gameId}
            category={category}
            id={item.id}
            size={64}
            alt=""
          />
        </div>
      )}
      {hasMonths && (
        <div className="ac-expand-section">
          <div className="ac-expand-label">Available in</div>
          <MonthGrid months={months!} current={cm} />
        </div>
      )}
      <div className="ac-expand-side">
        {art && (
          <div className="ac-stat ac-stat-art">
            <div className="ac-stat-num ac-stat-num-text">{art.basedOn}</div>
            <div className="ac-stat-label">based on</div>
          </div>
        )}
        {art?.hasFake !== undefined && (
          <div
            className={`ac-art-fake-note ${art.hasFake ? 'ac-art-fake-note-warn' : 'ac-art-fake-note-ok'}`}
          >
            {art.hasFake
              ? 'Crazy Redd may sell a counterfeit — verify before donating.'
              : 'No known counterfeit — always genuine.'}
          </div>
        )}
        {bells != null && (
          <div className="ac-stat">
            <div className="ac-stat-num">{bells.toLocaleString()}</div>
            <div className="ac-stat-label">bells · sell value</div>
          </div>
        )}
        {shadow && (
          <div className="ac-stat">
            <div className="ac-stat-num ac-stat-num-text">{shadow}</div>
            <div className="ac-stat-label">shadow size</div>
          </div>
        )}
        {time && (
          <div className="ac-stat">
            <div className="ac-stat-num ac-stat-num-text">{time}</div>
            <div className="ac-stat-label">active hours</div>
          </div>
        )}
        {notes && <div className="ac-note">{notes}</div>}
        {checked && donatedAt && (
          <div className="ac-stat">
            <div className="ac-stat-num ac-stat-num-text">
              {formatTimestamp(donatedAt)}
            </div>
            <div className="ac-stat-label">donated</div>
          </div>
        )}
        <button
          type="button"
          className={`ac-donate-btn ${checked ? 'ac-donate-btn-on' : ''}`}
          onClick={e => {
            e.stopPropagation();
            onToggle();
          }}
        >
          {checked ? 'Donated ✓ — undonate' : 'Mark as donated'}
        </button>
      </div>
    </div>
  );
}
