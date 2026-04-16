import React from 'react';
import { AlertTriangle, WifiOff, RefreshCw } from 'lucide-react';
import type { AppErrorKind } from '../lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ErrorStateProps {
  error?: AppErrorKind;
  onRetry?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ErrorState({ error, onRetry }: ErrorStateProps) {
  const isNetwork = error?.type === 'networkError';
  const Icon = isNetwork ? WifiOff : AlertTriangle;
  const heading = isNetwork ? 'No Connection' : "Couldn't Load Museum Data";
  const body =
    error?.message ??
    (isNetwork
      ? 'Check your internet connection and try again.'
      : 'Something went wrong while fetching the museum collection.');

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{
        background: 'linear-gradient(180deg, #f7f3ea 0%, #efe6d6 100%)',
      }}
    >
      {/* Parchment card */}
      <div
        style={{
          backgroundColor: '#FDF9F1',
          border: '1px solid #E7DAC4',
          borderRadius: '20px',
          padding: '40px 32px',
          maxWidth: '360px',
          width: '100%',
          margin: '0 16px',
          textAlign: 'center',
        }}
      >
        {/* Icon circle */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(200,102,58,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <Icon size={26} style={{ color: '#C8663A' }} aria-hidden />
        </div>

        <h2
          style={{
            margin: '0 0 8px',
            fontSize: '17px',
            fontWeight: 700,
            color: '#2A2A2A',
            lineHeight: '1.3',
          }}
        >
          {heading}
        </h2>

        <p
          style={{
            margin: '0 0 28px',
            fontSize: '14px',
            color: '#5a4a35',
            lineHeight: '1.5',
          }}
        >
          {body}
        </p>

        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#7B5E3B',
              color: '#F5E9D4',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 22px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} aria-hidden />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
