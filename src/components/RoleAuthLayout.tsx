'use client';

import React from 'react';
import Link from 'next/link';

// Patrakar / Advertiser login-signup pages ka common card layout
export const authLabel: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '6px' };
export const authInput: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1.5px solid #cbd5e1',
  borderRadius: '8px',
  padding: '11px 14px',
  fontSize: '14px',
  outline: 'none',
  background: '#fff'
};
export const authButton = (disabled: boolean): React.CSSProperties => ({
  backgroundColor: '#ea580c',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  padding: '13px',
  fontSize: '15px',
  fontWeight: 600,
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.7 : 1,
  width: '100%'
});
export const authLinkButton: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#64748b',
  fontSize: '12.5px',
  cursor: 'pointer',
  textDecoration: 'underline'
};

export function PhoneInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', color: '#475569', fontSize: '14px', fontWeight: 600 }}>
        +91
      </span>
      <input
        type="tel"
        inputMode="numeric"
        required
        maxLength={10}
        placeholder="10 अंकों का मोबाइल नंबर"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))}
        style={authInput}
      />
    </div>
  );
}

export function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      required
      maxLength={6}
      placeholder="उदा. 482910"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))}
      style={{ ...authInput, fontSize: '16px', letterSpacing: '4px', textAlign: 'center' }}
      autoFocus
    />
  );
}

export default function RoleAuthLayout({
  icon,
  title,
  subtitle,
  message,
  error,
  errorAction,
  footer,
  children
}: {
  icon: string;
  title: string;
  subtitle: string;
  message?: string;
  error?: string;
  errorAction?: { href: string; label: string } | null; // error ke saath "लॉगिन करें" / "साइन अप करें" jaisa link
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eef2f6', padding: '20px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '440px', background: '#ffffff', borderRadius: '16px', padding: '32px 26px', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{ width: '48px', height: '48px', margin: '0 auto 12px', background: '#fff7ed', borderRadius: '12px', display: 'grid', placeItems: 'center', fontSize: '24px' }}>
            {icon}
          </div>
          <h1 style={{ fontSize: '21px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>{title}</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>{subtitle}</p>
        </div>

        {message && (
          <div style={{ backgroundColor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
            {message}
          </div>
        )}
        {error && (
          <div role="alert" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', textAlign: 'center' }}>
            {error}
            {errorAction && (
              <Link href={errorAction.href} style={{ display: 'block', marginTop: '6px', color: '#ea580c', fontWeight: 700, textDecoration: 'underline' }}>
                {errorAction.label}
              </Link>
            )}
          </div>
        )}

        {children}

        <div style={{ textAlign: 'center', marginTop: '22px', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#64748b' }}>
          {footer}
          <Link href="/" style={{ fontSize: '12.5px', color: '#64748b', textDecoration: 'none' }}>
            ← होम पेज पर वापस जाएं
          </Link>
        </div>
      </div>
    </div>
  );
}
