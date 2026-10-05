'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { addYears, fmtCardDate, toDate } from '@/lib/pressCard';
import { fallbackFor } from '@/lib/siteTheme';

type Result =
  | { state: 'loading' }
  | { state: 'missing' }
  | { state: 'error' }
  | {
      state: 'found';
      name: string;
      photo: string;
      designation: string;
      siteName: string;
      brand: string;
      pressId: string;
      area: string;
      validTill: Date;
      status: 'valid' | 'expired' | 'revoked';
    };

/* ID card ka QR yahan laata hai: ye Press ID asli hai ya nahi (naam, photo, portal, vaidhta) */
export default function VerifyPressPage() {
  const [pressId, setPressId] = useState('');
  const [result, setResult] = useState<Result>({ state: 'loading' });

  useEffect(() => {
    const id = (new URLSearchParams(window.location.search).get('id') || '').trim().toUpperCase();
    setPressId(id);
    if (!id) {
      setResult({ state: 'missing' });
      return;
    }
    getDocs(query(collection(db, 'reporters'), where('pressIdList', 'array-contains', id), limit(1)))
      .then((snap) => {
        if (snap.empty) return setResult({ state: 'missing' });
        const r = snap.docs[0].data();
        const slug = Object.keys(r.pressIds || {}).find((k) => r.pressIds[k] === id) || r.cardSiteId || 'the-local-leader';
        const fb = fallbackFor(slug);
        const issuedOn = toDate(r.pressIdIssuedOn?.[slug]) || new Date();
        const validTill = toDate(r.cardValidTill) || addYears(issuedOn, 1);
        const approved = ['approved', 'active'].includes(String(r.status || '').toLowerCase());
        setResult({
          state: 'found',
          name: r.name || '—',
          photo: r.photoUrl || '',
          designation: r.designation || 'Reporter',
          siteName: fb.name,
          brand: fb.primaryColor,
          pressId: id,
          area: r.workArea || r.city || '',
          validTill,
          status: r.cardStatus === 'revoked' || !approved ? 'revoked' : validTill.getTime() < Date.now() ? 'expired' : 'valid'
        });
      })
      .catch((err) => {
        console.error('Verify error:', err);
        setResult({ state: 'error' });
      });
  }, []);

  const badge = {
    valid: { text: '✓ मान्य (Valid)', bg: '#dcfce7', fg: '#166534' },
    expired: { text: '⏱ अवधि समाप्त (Expired)', bg: '#fef3c7', fg: '#92400e' },
    revoked: { text: '✕ निरस्त (Not valid)', bg: '#fee2e2', fg: '#991b1b' }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f6f4f0', padding: '32px 16px', fontFamily: "'Noto Sans Devanagari', system-ui, sans-serif" }}>
      <div style={{ maxWidth: '440px', margin: '0 auto', background: '#fff', borderRadius: '18px', border: '1px solid #ebe7e0', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.06)' }}>
        <div style={{ background: '#3d4246', color: '#fff', padding: '16px 20px', textAlign: 'center', fontWeight: 800, letterSpacing: '1px' }}>PRESS ID VERIFICATION</div>
        <div style={{ padding: '22px 20px' }}>
          {result.state === 'loading' && <p style={{ textAlign: 'center', color: '#64748b' }}>जांच हो रही है…</p>}
          {result.state === 'missing' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px' }}>⚠️</div>
              <h2 style={{ fontSize: '18px', margin: '8px 0' }}>यह प्रेस आईडी पंजीकृत नहीं है</h2>
              <p style={{ color: '#64748b', fontSize: '13.5px' }}>{pressId ? `आईडी: ${pressId}` : 'कोई आईडी नहीं दी गई।'} संदेह हो तो कार्यालय से संपर्क करें: +91 8103333381</p>
            </div>
          )}
          {result.state === 'error' && <p style={{ textAlign: 'center', color: '#b91c1c' }}>जांच नहीं हो पाई, कृपया पुनः प्रयास करें।</p>}
          {result.state === 'found' && (
            <div style={{ textAlign: 'center' }}>
              {result.photo ? (
                <img src={result.photo} alt={result.name} style={{ width: '120px', height: '150px', objectFit: 'cover', borderRadius: '10px', border: `3px solid ${result.brand}` }} />
              ) : (
                <div style={{ width: '120px', height: '150px', margin: '0 auto', borderRadius: '10px', border: `3px solid ${result.brand}`, display: 'grid', placeItems: 'center', fontSize: '40px' }}>👤</div>
              )}
              <h2 style={{ fontSize: '21px', margin: '12px 0 2px' }}>{result.name}</h2>
              <div style={{ color: result.brand, fontWeight: 700, fontSize: '14px' }}>
                {result.designation} · {result.siteName}
              </div>
              <span style={{ display: 'inline-block', marginTop: '12px', background: badge[result.status].bg, color: badge[result.status].fg, borderRadius: '99px', padding: '6px 14px', fontWeight: 800, fontSize: '13.5px' }}>
                {badge[result.status].text}
              </span>
              <div style={{ marginTop: '18px', textAlign: 'left', fontSize: '14px', display: 'grid', gap: '8px', borderTop: '1px dashed #e2e8f0', paddingTop: '14px' }}>
                <div>
                  <b>प्रेस आईडी:</b> {result.pressId}
                </div>
                {result.area && (
                  <div>
                    <b>कार्यक्षेत्र:</b> {result.area}
                  </div>
                )}
                <div>
                  <b>वैधता:</b> {fmtCardDate(result.validTill)} तक
                </div>
              </div>
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link href="/" style={{ color: '#475569', fontSize: '13px', fontWeight: 600 }}>
              ← होम
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
