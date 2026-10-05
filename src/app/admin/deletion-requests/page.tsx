'use client';
import { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ACCOUNT_TYPE_LABEL, DELETION_DAYS, deleteAccountData, type DeletionAccountType } from '@/lib/accountDeletion';
import { fallbackFor } from '@/lib/siteTheme';
import styles from '../Admin.module.css';

interface Req {
  id: string;
  phone: string;
  name: string;
  email: string;
  accountTypes: DeletionAccountType[];
  reason: string;
  portal: string;
  verified: boolean;
  status: 'pending' | 'completed' | 'rejected';
  createdAt: Date | null;
  completedAt: Date | null;
  deletedCounts?: Record<string, number>;
  note?: string;
}

const CSS = `
.dr-table{width:100%;border-collapse:collapse;font-size:13px;min-width:980px}
.dr-table th{text-align:left;padding:12px 14px;background:var(--bg-0b1120);color:var(--fg-94a3b8);font-weight:600;border-bottom:1px solid var(--bd-1e293b);white-space:nowrap}
.dr-table td{padding:11px 14px;border-bottom:1px solid var(--bd-1e293b);vertical-align:top}
.dr-sub{display:block;font-size:11.5px;color:var(--fg-64748b);margin-top:2px}
.dr-pill{display:inline-block;font-size:11px;font-weight:700;padding:3px 9px;border-radius:99px;white-space:nowrap}
.dr-btn{border:1px solid var(--bd-334155);background:transparent;color:var(--fg-cbd5e1);border-radius:6px;padding:5px 10px;font-size:12px;cursor:pointer;font-family:inherit;margin:0 5px 5px 0}
.dr-btn.danger{background:#dc2626;border-color:#dc2626;color:#fff}
.dr-tab{background:transparent;border:1px solid var(--bd-334155);color:var(--fg-94a3b8);border-radius:7px;padding:7px 13px;font-size:12.5px;cursor:pointer;font-family:inherit}
.dr-tab.on{background:#ea580c;border-color:#ea580c;color:#fff}
`;

const toDate = (v: any): Date | null => (v?.toDate ? v.toDate() : v ? new Date(v) : null);

export default function DeletionRequestsPage() {
  const [rows, setRows] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'completed' | 'rejected'>('pending');
  const [busyId, setBusyId] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    return onSnapshot(
      collection(db, 'account_deletion_requests'),
      (snap) => {
        setRows(
          snap.docs
            .map((d) => {
              const x = d.data();
              return {
                id: d.id,
                phone: x.phone || d.id,
                name: x.name || '',
                email: x.email || '',
                accountTypes: x.accountTypes || [],
                reason: x.reason || '',
                portal: x.portal || '',
                verified: x.verified === true,
                status: x.status || 'pending',
                createdAt: toDate(x.createdAt),
                completedAt: toDate(x.completedAt),
                deletedCounts: x.deletedCounts,
                note: x.note
              } as Req;
            })
            .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
        );
        setLoading(false);
      },
      (err) => {
        setMsg('अनुरोध लोड नहीं हुए: ' + err.message);
        setLoading(false);
      }
    );
  }, []);

  const visible = useMemo(() => rows.filter((r) => r.status === tab), [rows, tab]);
  const overdue = rows.filter((r) => r.status === 'pending' && r.createdAt && Date.now() - r.createdAt.getTime() > (DELETION_DAYS - 5) * 864e5).length;

  const runDelete = async (r: Req) => {
    if (!window.confirm(`+91 ${r.phone} का पूरा खाता और व्यक्तिगत डेटा स्थायी रूप से हटाएं?\n(भुगतान रिकॉर्ड कानूनी कारणों से रखे जाएंगे)\nयह वापस नहीं होगा।`)) return;
    setBusyId(r.id);
    setMsg('');
    try {
      const counts = await deleteAccountData(r.phone);
      await updateDoc(doc(db, 'account_deletion_requests', r.id), { status: 'completed', completedAt: serverTimestamp(), deletedCounts: counts });
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      setMsg(`✓ +91 ${r.phone} — ${total} रिकॉर्ड हटाए गए। उपयोगकर्ता को SMS/ईमेल से सूचित करें।`);
    } catch (err: any) {
      setMsg('हटाने में त्रुटि: ' + err.message);
    } finally {
      setBusyId('');
    }
  };

  const reject = async (r: Req) => {
    const note = window.prompt('अस्वीकार करने का कारण (उपयोगकर्ता को बताने हेतु):', 'मोबाइल नंबर से कोई खाता नहीं मिला');
    if (note === null) return;
    await updateDoc(doc(db, 'account_deletion_requests', r.id), { status: 'rejected', note, completedAt: serverTimestamp() }).catch((e) => setMsg(e.message));
  };

  return (
    <div style={{ color: 'var(--fg-fff)' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div style={{ marginBottom: '18px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700 }}>🗑️ Account Deletion Requests</h1>
        <p style={{ fontSize: '13px', color: 'var(--fg-94a3b8)' }}>
          /delete-account पेज से OTP-सत्यापित अनुरोध। Google Play और गोपनीयता नीति के अनुसार {DELETION_DAYS} दिनों में पूरा करना ज़रूरी है।
        </p>
      </div>

      {overdue > 0 && (
        <div style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.45)', color: 'var(--fg-fca5a5)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', marginBottom: '12px' }}>
          ⚠️ {overdue} अनुरोध की {DELETION_DAYS} दिन की समय-सीमा पास है — जल्द पूरा करें।
        </div>
      )}
      {msg && (
        <div style={{ background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.4)', color: 'var(--fg-6ee7b7)', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', marginBottom: '12px' }}>
          {msg}
        </div>
      )}

      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        {(
          [
            ['pending', 'बाकी'],
            ['completed', 'पूरे हुए'],
            ['rejected', 'अस्वीकृत']
          ] as const
        ).map(([k, l]) => (
          <button key={k} className={`dr-tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>
            {l} ({rows.filter((r) => r.status === k).length})
          </button>
        ))}
      </div>

      <div className={styles.formCard} style={{ overflowX: 'auto', padding: 0 }}>
        <table className="dr-table">
          <thead>
            <tr>
              <th>मोबाइल / नाम</th>
              <th>खाता प्रकार</th>
              <th>कारण</th>
              <th>पोर्टल</th>
              <th>अनुरोध की तारीख</th>
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
                  कोई अनुरोध नहीं
                </td>
              </tr>
            ) : (
              visible.map((r) => {
                const days = r.createdAt ? Math.floor((Date.now() - r.createdAt.getTime()) / 864e5) : 0;
                return (
                  <tr key={r.id}>
                    <td>
                      +91 {r.phone}
                      <span className="dr-sub">{[r.name, r.email].filter(Boolean).join(' · ') || '—'}</span>
                      {r.verified && <span className="dr-sub" style={{ color: 'var(--fg-34d399)' }}>✓ OTP सत्यापित</span>}
                    </td>
                    <td>{r.accountTypes.map((t) => ACCOUNT_TYPE_LABEL[t] || t).join(', ')}</td>
                    <td style={{ maxWidth: '220px' }}>{r.reason || '—'}</td>
                    <td>{r.portal ? fallbackFor(r.portal).name : '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {r.createdAt ? r.createdAt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      {r.status === 'pending' && <span className="dr-sub" style={{ color: days > DELETION_DAYS - 5 ? 'var(--fg-f87171)' : undefined }}>{days} दिन पहले</span>}
                    </td>
                    <td>
                      {r.status === 'pending' && <span className="dr-pill" style={{ background: 'var(--bg-451a03)', color: 'var(--fg-fbbf24)' }}>बाकी</span>}
                      {r.status === 'completed' && (
                        <>
                          <span className="dr-pill" style={{ background: 'var(--bg-065f46)', color: 'var(--fg-34d399)' }}>हटाया गया</span>
                          {r.deletedCounts && (
                            <span className="dr-sub">
                              {Object.entries(r.deletedCounts)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(', ') || 'कोई डेटा नहीं मिला'}
                            </span>
                          )}
                        </>
                      )}
                      {r.status === 'rejected' && (
                        <>
                          <span className="dr-pill" style={{ background: 'var(--bg-7f1d1d)', color: 'var(--fg-fca5a5)' }}>अस्वीकृत</span>
                          {r.note && <span className="dr-sub">{r.note}</span>}
                        </>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {r.status === 'pending' && (
                        <>
                          <button className="dr-btn danger" disabled={busyId === r.id} onClick={() => runDelete(r)}>
                            {busyId === r.id ? 'हटाया जा रहा है…' : '🗑️ डेटा हटाएं'}
                          </button>
                          <button className="dr-btn" onClick={() => reject(r)}>
                            अस्वीकार
                          </button>
                        </>
                      )}
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
