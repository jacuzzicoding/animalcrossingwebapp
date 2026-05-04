import React, { useEffect, useState } from 'react';
import type { CategoryId, GameId } from '../lib/types';
import { useManifestState } from './itemIconUtils';

function humanize(id: string): string {
  return id
    .split('-')
    .filter(Boolean)
    .map(p => p[0].toUpperCase() + p.slice(1))
    .join(' ');
}

/**
 * Render an item icon for a given (gameId, category, id) triple.
 *
 * Reserves `size × size` before the image loads so layout never shifts. If the
 * manifest entry is missing, or the `<img>` fails to load, falls back to a
 * neutral placeholder glyph (the item id's monogram on a tinted square).
 *
 * Manifests are loaded lazily, once per gameId, and shared across all mounted
 * instances via a module-level cache (see itemIconUtils.ts).
 */
export function ItemIcon({
  gameId,
  category,
  id,
  size,
  className,
  alt,
}: {
  gameId: GameId;
  category: CategoryId;
  id: string;
  size: number;
  className?: string;
  alt?: string;
}) {
  const state = useManifestState(gameId);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [gameId, category, id]);

  const filename =
    state.status === 'present' ? state.manifest[category]?.[id] : undefined;
  const src = filename
    ? `/icons/${gameId.toLowerCase()}/${category}/${filename}`
    : null;

  const altText = alt ?? `${humanize(id)} icon`;

  const wrapperStyle: React.CSSProperties = {
    width: size,
    height: size,
    position: 'relative',
    flexShrink: 0,
    display: 'inline-block',
  };

  const showPlaceholder = !src || errored;

  return (
    <span
      className={`ac-item-icon${className ? ` ${className}` : ''}`}
      style={wrapperStyle}
      aria-hidden={alt === '' ? true : undefined}
    >
      {showPlaceholder ? (
        <ItemIconPlaceholder id={id} size={size} alt={altText} />
      ) : (
        <img
          src={src}
          alt={altText}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setErrored(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      )}
    </span>
  );
}

function ItemIconPlaceholder({
  id,
  size,
  alt,
}: {
  id: string;
  size: number;
  alt: string;
}) {
  const initials = id
    .split('-')
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0])
    .join('')
    .toUpperCase();
  return (
    <span
      role="img"
      aria-label={alt}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(122, 94, 59, 0.08)',
        border: '1px solid rgba(122, 94, 59, 0.18)',
        borderRadius: Math.max(2, Math.round(size * 0.12)),
        color: 'rgba(90, 74, 53, 0.75)',
        fontSize: Math.max(8, Math.round(size * 0.36)),
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      {initials}
    </span>
  );
}
