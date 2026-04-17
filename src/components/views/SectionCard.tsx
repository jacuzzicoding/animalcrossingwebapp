import React from 'react';

export function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[14px] border"
      style={{
        borderColor: '#E7DAC4',
        backgroundColor: '#FFFDF6',
        padding: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          marginBottom: 14,
        }}
      >
        <h2
          style={{ fontSize: 14, fontWeight: 700, color: '#2A2A2A', margin: 0 }}
        >
          {title}
        </h2>
        {subtitle && (
          <span style={{ fontSize: 11, color: '#5a4a35', opacity: 0.7 }}>
            {subtitle}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
