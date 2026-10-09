'use client';
import { useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { fallbackFor } from '@/lib/siteTheme';
import styles from '../Admin.module.css';
import { ageFromDob, heightLabel, STATUS_LABEL, type ProfileStatus } from '@/lib/matrimony';

/* Matrimony profiles — admin approve kare tabhi website par. Number (contact) sirf yahan admin dekhta hai. */

interface Row {
  id: string; name: string; gender: string; dob: string; heightCm: number; maritalStatus: string;
  religion: string; community: string; castePreference: string; motherTongue: string; city: string; state: string;
  education: string; occupation: string; annualIncome: string; diet: string; about: string;
  fatherName: string; motherName: string; grandfatherName: string; brothers: string; sisters: string;
  family: string; partnerPreference: string; photoUrl: string; siteId: string; status: ProfileStatus;
  contactPhone?: string; ownerPhone?: string; interestCount?: number; createdAt?: any;
}

const CSS = `
.mt-tab{background:transparent;border:1px solid var(--bd-334155);color:var(--fg-94a3b8);border-radius:7px;padding:7px 13px;font-size:12.5px;cursor:pointer;font-family:inherit;margin:0 6px 6px 0}
.mt-tab.on{background:#be185d;border-color:#be185d;color:#fff}
.mt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
.mt-card{background:var(--bg-0b1120);border:1px solid var(--bd-1e293b);border-radius:12px;overflow:hidden}
.mt-ph{height:150px;background:#2a1322;display:flex;align-items:center;justify-content:center;font-size:40px}
.mt-body{padding:12px}
.mt-name{font-weight:700;color:var(--fg-f1f5f9);font-size:15px}
.mt-row{font-size:12.5px;color:var(--fg-94a3b8);margin-top:3px}
.mt-row b{color:var(--fg-cbd5e1);font-weight:600}
.mt-pill{display:inline-block;font-size:11px;font-weight:700;padding:3px 9px;border-radius:99px}
.mt-contact{margin-top:8px;font-size:13px;color:#34d399;font-weight:700}
.mt-btn{border:1px solid var(--bd-334155);background:transparent;color:var(--fg-cbd5e1);border-radius:6px;padding:6px 11px;font-size:12px;cursor:pointer;font-family:inherit;margin:8px 6px 0 0}
.mt-btn.ok{border-color:#059669;color:#34d399}
.mt-btn.danger{border-color:#7f1d1d;color:#f87171}
`;

const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  approved: { bg: '#064e3b', fg: '#6ee7b7' },
  pending: { bg: '#78350f', fg: '#fcd34d' },
  rejected: { bg: '#7f1d1d', fg: '#fca5a5' },
  paused: { bg: '#334155', fg: '#cbd5e1' }
};

export default function AdminMatrimony() {
  const [profiles, setProfiles] = useState<Row[]>([]);
  const [contacts, setContacts] = useState<Record<string, string>>({});
  const [interestCounts, setInterestCounts] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected' | 'paused' | 'all'>('pending');
  const [error, setError] = useState('');

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'matrimony_profiles'), (s) => {
      setProfiles(s.docs.map((d) => ({ id: d.id, ...(d.data() as any) })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    }, (e) => setError(e.message));
    const u2 = onSnapshot(collection(db, 'matrimony_contacts'), (s) => {
      const m: Record<string, string> = {}; s.docs.forEach((d) => { m[d.id] = (d.data() as any).ownerPhone || ''; }); setContacts(m);
    });
    const u3 = onSnapshot(collection(db, 'matrimony_interests'), (s) => {
      const m: Record<string, number> = {}; s.docs.forEach((d) => { const t = (d.data() as any).toProfileId; if (t) m[t] = (m[t] || 0) + 1; }); setInterestCounts(m);
    });
    return () => { u1(); u2(); u3(); };
  }, []);

  const setStatus = (r: Row, status: ProfileStatus) =>
    updateDoc(doc(db, 'matrimony_profiles', r.id), { status, reviewedAt: serverTimestamp(), ...(status === 'approved' ? { approvedAt: serverTimestamp() } : {}) }).catch((e) => setError(e.message));

  const remove = async (r: Row) => {
    if (!confirm('यह प्रोफ़ाइल हटाएं?')) return;
    try {
      await deleteDoc(doc(db, 'matrimony_profiles', r.id));
      await deleteDoc(doc(db, 'matrimony_contacts', r.id)).catch(() => {});
      const ph = contacts[r.id];
      if (ph) await deleteDoc(doc(db, 'matrimony_index', ph)).catch(() => {});
    } catch (e: any) { setError(e.message); }
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { pending: 0, approved: 0, rejected: 0, paused: 0, all: profiles.length };
    profiles.forEach((p) => { c[p.status] = (c[p.status] || 0) + 1; });
    return c;
  }, [profiles]);

  const rows = profiles.filter((p) => tab === 'all' || p.status === tab);

  return (
    <div style={{ padding: '4px 2px' }}>
      <style>{CSS}</style>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>विवाह प्रोफ़ाइल (Matrimony)</h1>
      <p style={{ color: 'var(--fg-94a3b8)', fontSize: 13, marginBottom: 14 }}>एडमिन स्वीकृति के बाद ही प्रोफ़ाइल वेबसाइट पर दिखती है। संपर्क नंबर सिर्फ़ यहाँ दिखता है।</p>

      {error && <div style={{ background: '#7f1d1d', color: '#fecaca', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>{error}</div>}

      <div style={{ marginBottom: 14 }}>
        {(['pending', 'approved', 'paused', 'rejected', 'all'] as const).map((k) => (
          <button key={k} className={`mt-tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>
            {k === 'pending' ? 'समीक्षा में' : k === 'approved' ? 'स्वीकृत' : k === 'paused' ? 'रोकी' : k === 'rejected' ? 'अस्वीकृत' : 'सभी'} ({counts[k] || 0})
          </button>
        ))}
      </div>

      {rows.length === 0 ? <p style={{ color: 'var(--fg-64748b)', fontSize: 14, padding: 20 }}>कोई प्रोफ़ाइल नहीं।</p> : (
        <div className="mt-grid">
          {rows.map((r) => {
            const sc = STATUS_COLOR[r.status] || STATUS_COLOR.pending;
            return (
              <div key={r.id} className="mt-card">
                <div className="mt-ph">{r.photoUrl ? <img src={r.photoUrl} alt={r.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (r.gender === 'female' ? '👰' : '🤵')}</div>
                <div className="mt-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span className="mt-name">{r.name}, {ageFromDob(r.dob)}</span>
                    <span className="mt-pill" style={{ background: sc.bg, color: sc.fg }}>{STATUS_LABEL[r.status]}</span>
                  </div>
                  <div className="mt-row"><b>{heightLabel(r.heightCm)}</b> · {r.maritalStatus} · {r.gender === 'female' ? 'वधू' : 'वर'}</div>
                  <div className="mt-row">{r.religion}{r.community ? ` · ${r.community}` : ''} · {r.motherTongue}</div>
                  {r.castePreference && <div className="mt-row">💑 {r.castePreference}</div>}
                  <div className="mt-row">📍 {r.city}, {r.state}</div>
                  <div className="mt-row">🎓 {r.education} · 💼 {r.occupation}</div>
                  {r.annualIncome && <div className="mt-row">💰 {r.annualIncome}</div>}
                  {r.diet && <div className="mt-row">🍽 {r.diet}</div>}
                  {(r.fatherName || r.motherName) && <div className="mt-row"><b>माता-पिता:</b> {[r.fatherName, r.motherName].filter(Boolean).join(' / ')}</div>}
                  {r.grandfatherName && <div className="mt-row"><b>दादाजी:</b> {r.grandfatherName}</div>}
                  {((r.brothers && r.brothers !== '0') || (r.sisters && r.sisters !== '0')) && <div className="mt-row">👨‍👩‍👧 {r.brothers || 0} भाई · {r.sisters || 0} बहन</div>}
                  {r.family && <div className="mt-row"><b>परिवार:</b> {r.family}</div>}
                  {r.about && <div className="mt-row"><b>बारे में:</b> {r.about}</div>}
                  {r.partnerPreference && <div className="mt-row"><b>चाहिए:</b> {r.partnerPreference}</div>}
                  <div className="mt-row" style={{ marginTop: 4 }}>पोर्टल: {fallbackFor(r.siteId).name} · रुचि: {interestCounts[r.id] || 0}</div>
                  <div className="mt-contact">📞 {contacts[r.id] ? `+91 ${contacts[r.id]}` : '—'}</div>

                  <div>
                    {r.status !== 'approved' && <button className="mt-btn ok" onClick={() => setStatus(r, 'approved')}>✓ स्वीकृत</button>}
                    {r.status !== 'paused' && <button className="mt-btn" onClick={() => setStatus(r, 'paused')}>⏸ रोकें</button>}
                    {r.status !== 'rejected' && <button className="mt-btn" onClick={() => setStatus(r, 'rejected')}>✕ अस्वीकृत</button>}
                    <button className="mt-btn danger" onClick={() => remove(r)}>🗑 हटाएं</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
