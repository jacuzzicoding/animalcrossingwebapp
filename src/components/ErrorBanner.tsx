import React from 'react';
import { AlertTriangle, WifiOff, AlertCircle, X } from 'lucide-react';
import type { AppErrorKind } from '../lib/types';

export type { AppErrorKind };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function iconFor(kind: AppErrorKind['type']) {
  switch (kind) {
    case 'dataLoadFailed':
      return AlertTriangle;
    case 'networkError':
      return WifiOff;
    case 'operationFailed':
      return AlertCircle;
    case 'validationFailed':
      return AlertCircle;
  }
}

function colorFor(kind: AppErrorKind['type']): string {
  switch (kind) {
    case 'dataLoadFailed':
    case 'networkError':
      return '#C8663A'; // warm orange-brown (matches Fall season colour)
    case 'operationFailed':
    case 'validationFailed':
      return '#B94040'; // muted red
  }
}

function bgFor(kind: AppErrorKind['type']): string {
  switch (kind) {
    case 'dataLoadFailed':
    case 'networkError':
      return 'rgba(200,102,58,0.10)';
    case 'operationFailed':
    case 'validationFailed':
      return 'rgba(185,64,64,0.10)';
  }
}

function recoverySuggestionFor(error: AppErrorKind): string | undefined {
  if (error.type === 'networkError')
    return 'Check your connection and try again.';
  if (error.type === 'validationFailed')
    return 'Please correct the error and try again.';
  if (error.type === 'operationFailed') return error.recoverySuggestion;
  return undefined;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ErrorBannerProps {
  error: AppErrorKind;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export default function ErrorBanner({
  error,
  onDismiss,
  onRetry,
}: ErrorBannerProps) {
  const Icon = iconFor(error.type);
  const color = colorFor(error.type);
  const bg = bgFor(error.type);
  const suggestion = recoverySuggestionFor(error);

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        padding: '12px 14px',
        borderRadius: '10px',
        backgroundColor: bg,
        border: `1px solid ${color}33`,
      }}
    >
      <Icon
        aria-hidden
        style={{ color, flexShrink: 0, marginTop: '1px' }}
        size={16}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: '13px',
            fontWeight: 600,
            color: '#2A2A2A',
            lineHeight: '1.4',
          }}
        >
          {error.message}
        </p>
        {suggestion && (
          <p
            style={{
              margin: '3px 0 0',
              fontSize: '12px',
              color: '#5a4a35',
              lineHeight: '1.4',
            }}
          >
            {suggestion}
          </p>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexShrink: 0,
        }}
      >
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color,
              background: 'none',
              border: `1px solid ${color}66`,
              borderRadius: '6px',
              padding: '2px 8px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Dismiss error"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#5a4a35',
              opacity: 0.6,
              padding: '2px',
              display: 'flex',
            }}
          >
            <X size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
