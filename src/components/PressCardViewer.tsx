'use client';

import React, { useEffect, useRef, useState } from 'react';
import { drawCertificate, drawIdCard, type PressCardData } from '@/lib/pressCard';

interface Props {
  data: PressCardData;
  /** Download hone par (admin me ginti ke liye) */
  onDownload?: (kind: 'id-card' | 'certificate', format: 'png' | 'pdf') => void;
  compact?: boolean;
}

const fileSafe = (s: string) => s.replace(/[^A-Za-z0-9-]+/g, '_');

export default function PressCardViewer({ data, onDownload, compact = false }: Props) {
  const idRef = useRef<HTMLCanvasElement>(null);
  const certRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(true);
  const [error, setError] = useState('');
  const key = JSON.stringify({ ...data, issuedOn: data.issuedOn.getTime(), validTill: data.validTill.getTime() });

  useEffect(() => {
    let cancelled = false;
    setRendering(true);
    setError('');
    (async () => {
      try {
        if (idRef.current) await drawIdCard(idRef.current, data);
        if (certRef.current) await drawCertificate(certRef.current, data);
      } catch (err) {
        console.error('Press card render error:', err);
        if (!cancelled) setError('कार्ड बनाने में समस्या आई, कृपया पेज रीफ़्रेश करें।');
      } finally {
        if (!cancelled) setRendering(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const downloadPng = (kind: 'id-card' | 'certificate') => {
    const canvas = kind === 'id-card' ? idRef.current : certRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${fileSafe(data.pressId)}_${kind}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      onDownload?.(kind, 'png');
    }, 'image/png');
  };

  // Browser ka print dialog — "Save as PDF" se PDF banti hai (sahi naap ke page par)
  const printPdf = (kind: 'id-card' | 'certificate') => {
    const canvas = kind === 'id-card' ? idRef.current : certRef.current;
    if (!canvas) return;
    const img = canvas.toDataURL('image/png');
    const w = window.open('', '_blank');
    if (!w) {
      alert('पॉप-अप ब्लॉक है — कृपया इस साइट के लिए पॉप-अप चालू करें।');
      return;
    }
    const page = kind === 'id-card' ? 'size: 54mm 86mm; margin: 0' : 'size: A4; margin: 0';
    const imgCss = kind === 'id-card' ? 'width:54mm;height:86mm' : 'width:210mm;height:297mm';
    w.document.write(
      `<!doctype html><html><head><title>${data.pressId} ${kind === 'id-card' ? 'ID Card' : 'Authorization Letter'}</title>` +
        `<style>@page{${page}}html,body{margin:0;padding:0}img{display:block;${imgCss}}</style></head>` +
        `<body><img src="${img}" onload="setTimeout(function(){window.print()},150)"></body></html>`
    );
    w.document.close();
    onDownload?.(kind, 'pdf');
  };

  const btn: React.CSSProperties = {
    border: 'none',
    borderRadius: '8px',
    padding: '9px 14px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: rendering ? 'wait' : 'pointer',
    fontFamily: 'inherit',
    opacity: rendering ? 0.6 : 1
  };
  const primaryBtn: React.CSSProperties = { ...btn, background: data.brand, color: '#fff' };
  const ghostBtn: React.CSSProperties = { ...btn, background: '#fff', color: data.brand, border: `1.5px solid ${data.brand}` };

  return (
    <div>
      {error && <div style={{ background: '#fef2f2', color: '#b91c1c', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: compact ? 'minmax(0,0.75fr) minmax(0,1.25fr)' : 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>🪪 मीडिया आईडी कार्ड</div>
          <canvas
            ref={idRef}
            aria-label={`${data.name} का मीडिया आईडी कार्ड`}
            style={{ width: '100%', maxWidth: compact ? '260px' : '340px', height: 'auto', display: 'block', borderRadius: '10px', boxShadow: '0 10px 28px rgba(0,0,0,0.12)', background: '#fff' }}
          />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
            <button type="button" style={primaryBtn} disabled={rendering || !!error} onClick={() => downloadPng('id-card')}>
              📥 PNG डाउनलोड
            </button>
            <button type="button" style={ghostBtn} disabled={rendering || !!error} onClick={() => printPdf('id-card')}>
              🖨️ प्रिंट / PDF
            </button>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>📜 प्राधिकरण पत्र (प्रमाणपत्र)</div>
          <canvas
            ref={certRef}
            aria-label={`${data.name} का प्राधिकरण पत्र`}
            style={{ width: '100%', maxWidth: compact ? '420px' : '520px', height: 'auto', display: 'block', borderRadius: '6px', boxShadow: '0 10px 28px rgba(0,0,0,0.12)', background: '#fff' }}
          />
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
            <button type="button" style={primaryBtn} disabled={rendering || !!error} onClick={() => downloadPng('certificate')}>
              📥 PNG डाउनलोड
            </button>
            <button type="button" style={ghostBtn} disabled={rendering || !!error} onClick={() => printPdf('certificate')}>
              🖨️ प्रिंट / PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
