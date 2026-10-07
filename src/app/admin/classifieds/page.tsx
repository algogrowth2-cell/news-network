'use client';
import { useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { fallbackFor } from '@/lib/siteTheme';
import styles from '../Admin.module.css';

/* Advertiser ke classified vigyapan — admin ki manzoori ke baad hi homepage par (status: active) */

interface Classified {
  id: string;
  title: string;
  category: string;
  city: string;
  price: string;
  contactNumber: string;
  imageUrl: string;
  siteId: string;
  status: string;
  advertiserName: string;
  advertiserPhone: string;
  paymentId: string;
  amountPaid: number;
  testMode: boolean;
  createdAt: Date | null;
}

const CSS = `
.cl-tab{background:transparent;border:1px solid var(--bd-334155);color:var(--fg-94a3b8);border-radius:7px;padding:7px 13px;font-size:12.5px;cursor:pointer;font-family:inherit}
.cl-tab.on{background:#ea580c;border-color:#ea580c;color:#fff}
.cl-table{width:100%;border-collapse:collapse;text-align:left;font-size:13px;min-width:960px}
.cl-table th{padding:12px 14px;background:var(--bg-0b1120);color:var(--fg-94a3b8);font-weight:600;border-bottom:1px solid var(--bd-1e293b)}
.cl-table td{padding:10px 14px;border-bottom:1px solid var(--bd-1e293b);vertical-align:top}
.cl-sub{display:block;font-size:11.5px;color:var(--fg-64748b);margin-top:2px}
.cl-pill{display:inline-block;font-size:11px;font-weight:700;padding:3px 9px;border-radius:99px}
.cl-btn{border:1px solid var(--bd-334155);background:transparent;color:var(--fg-cbd5e1);border-radius:6px;padding:5px 10px;font-size:12px;cursor:pointer;font-family:inherit;margin:0 5px 5px 0}
.cl-btn.ok{background:#16a34a;border-color:#16a34a;color:#fff}
.cl-btn.danger{border-color:#ef4444;color:var(--fg-f87171)}
`;

const toDate = (v: any): Date | null => (v?.toDate ? v.toDate() : v ? new Date(v) : null);
const PILL: Record<string, [string, string, string]> = {
  pending: ['मंज़ूरी बाकी', 'var(--bg-451a03)', 'var(--fg-fbbf24)'],
  active: ['Live', 'var(--bg-065f46)', 'var(--fg-34d399)'],
  approved: ['Live', 'var(--bg-065f46)', 'var(--fg-34d399)'],
  paused: ['रुका', 'var(--bg-1e293b)', 'var(--fg-cbd5e1)'],
  rejected: ['अस्वीकृत', 'var(--bg-7f1d1d)', 'var(--fg-fca5a5)']
};

export default function ClassifiedsPage() {
  const [rows, setRows] = useState<Classified[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'live' | 'other'>('pending');
  const [error, setError] = useState('');

  useEffect(() => {
    return onSnapshot(
      collection(db, 'classifieds'),
      (snap) => {
        setRows(
          snap.docs
            .map((d) => {
              const x = d.data();
              return {
                id: d.id,
                title: x.title || x.name || '—',
                category: x.category || '',
                city: x.city || '',
                price: x.price || '',
                contactNumber: x.contactNumber || '',
                imageUrl: x.imageUrl || '',
                siteId: x.siteId || '',
                status: String(x.status || 'active').toLowerCase(),
                advertiserName: x.advertiserName || '',
                advertiserPhone: x.advertiserPhone || '',
                paymentId: x.paymentId || '',
                amountPaid: Number(x.amountPaid || 0),
                testMode: !!x.testMode,
                createdAt: toDate(x.timestamp) || toDate(x.createdAt)
              };
            })
            .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
        );
        setLoading(false);
      },
      (err) => {
        setError('Classifieds लोड नहीं हुए: ' + err.message);
        setLoading(false);
      }
    );
  }, []);

  const isLive = (s: string) => s === 'active' || s === 'approved';
  const visible = useMemo(
    () => rows.filter((r) => (tab === 'pending' ? r.status === 'pending' : tab === 'live' ? isLive(r.status) : !isLive(r.status) && r.status !== 'pending')),
    [rows, tab]
  );
  const count = (t: typeof tab) => rows.filter((r) => (t === 'pending' ? r.status === 'pending' : t === 'live' ? isLive(r.status) : !isLive(r.status) && r.status !== 'pending')).length;

  const setStatus = (r: Classified, status: string) =>
    updateDoc(doc(db, 'classifieds', r.id), { status, reviewedAt: serverTimestamp() }).catch((e) => setError(e.message));
  const remove = async (r: Classified) => {
    if (!window.confirm(`"${r.title}" हमेशा के लिए हटाएं?`)) return;
    await deleteDoc(doc(db, 'classifieds', r.id)).catch((e) => setError(e.message));
  };

  return (
    <div style={{ color: 'var(--fg-fff)' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div style={{ marginBottom: '18px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Classified Ads ({rows.length})</h1>
        <p style={{ fontSize: '13px', color: 'var(--fg-94a3b8)' }}>विज्ञापनदाता के क्लासिफाइड — आपकी स्वीकृति के बाद ही वेबसाइट के साइडबार में दिखते हैं</p>
      </div>
      {error && <div style={{ color: 'var(--fg-fca5a5)', fontSize: '13px', marginBottom: '12px' }}>⚠️ {error}</div>}

      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {(
          [
            ['pending', 'मंज़ूरी बाकी'],
            ['live', 'Live'],
            ['other', 'रुके / अस्वीकृत']
          ] as const
        ).map(([k, l]) => (
          <button key={k} className={`cl-tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>
            {l} ({count(k)})
          </button>
        ))}
      </div>

      <div className={styles.formCard} style={{ overflowX: 'auto', padding: 0 }}>
        <table className="cl-table">
          <thead>
            <tr>
              <th>विज्ञापन</th>
              <th>श्रेणी / शहर</th>
              <th>कीमत / संपर्क</th>
              <th>विज्ञापनदाता</th>
              <th>पोर्टल</th>
              <th>स्थिति</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--fg-94a3b8)' }}>
                  लोड हो रहा है…
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: 'var(--fg-94a3b8)' }}>
                  कोई क्लासिफाइड नहीं
                </td>
              </tr>
            ) : (
              visible.map((r) => {
                const [label, bg, fg] = PILL[r.status] || PILL.pending;
                return (
                  <tr key={r.id}>
                    <td style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      {r.imageUrl && <img src={r.imageUrl} alt="" style={{ width: '64px', height: '48px', objectFit: 'cover', borderRadius: '6px' }} />}
                      <span>
                        <b>{r.title}</b>
                        <span className="cl-sub">{r.createdAt ? r.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</span>
                      </span>
                    </td>
                    <td>
                      {r.category || '—'}
                      <span className="cl-sub">{r.city}</span>
                    </td>
                    <td>
                      {r.price || '—'}
                      <span className="cl-sub">{r.contactNumber}</span>
                    </td>
                    <td>
                      {r.advertiserName || '—'}
                      <span className="cl-sub">{r.advertiserPhone ? `+91 ${r.advertiserPhone}` : ''}</span>
                      {r.paymentId ? (
                        <span className="cl-sub" style={{ color: '#10b981', fontWeight: 600 }} title={r.paymentId}>
                          💳 ₹{r.amountPaid || '—'} भुगतान ✓{r.testMode ? ' (टेस्ट)' : ''}
                        </span>
                      ) : (
                        <span className="cl-sub" style={{ color: '#f59e0b' }}>भुगतान नहीं (पुराना/एडमिन)</span>
                      )}
                    </td>
                    <td>{r.siteId === 'all' ? 'सभी पोर्टल' : r.siteId ? fallbackFor(r.siteId).name : '—'}</td>
                    <td>
                      <span className="cl-pill" style={{ background: bg, color: fg }}>
                        {label}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {!isLive(r.status) && (
                        <button className="cl-btn ok" onClick={() => setStatus(r, 'active')}>
                          ✓ स्वीकृत करें
                        </button>
                      )}
                      {isLive(r.status) && (
                        <button className="cl-btn" onClick={() => setStatus(r, 'paused')}>
                          रोकें
                        </button>
                      )}
                      {r.status !== 'rejected' && (
                        <button className="cl-btn" onClick={() => setStatus(r, 'rejected')}>
                          अस्वीकार
                        </button>
                      )}
                      <button className="cl-btn danger" onClick={() => remove(r)}>
                        🗑
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
