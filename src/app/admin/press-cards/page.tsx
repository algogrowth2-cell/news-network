'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { NETWORK_SITES } from '@/lib/portals';
import { fallbackFor } from '@/lib/siteTheme';
import PressCardViewer from '@/components/PressCardViewer';
import { addYears, BLOOD_GROUPS, buildPressCardData, DEFAULT_DESIGNATION, fmtCardDate, issuePressId, toDate } from '@/lib/pressCard';

interface Row {
  id: string;
  raw: any;
  name: string;
  phone: string;
  approved: boolean;
  siteSlug: string;
  pressId: string;
  hasCard: boolean;
  photo: string;
  designation: string;
  bloodGroup: string;
  area: string;
  issuedOn: Date | null;
  validTill: Date | null;
  downloads: number;
  revoked: boolean;
  lastDownload: Date | null;
}

const PC_CSS = `
.pc-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;margin-bottom:20px}
.pc-card{background:var(--bg-0f172a);border:1px solid var(--bd-1e293b);border-radius:12px;padding:16px}
.pc-card-label{font-size:12px;color:var(--fg-94a3b8);font-weight:600}
.pc-card-value{font-size:28px;font-weight:800;color:var(--fg-fff);margin-top:6px}
.pc-toolbar{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.pc-input,.pc-select{background:var(--bg-0b1120);border:1px solid var(--bd-334155);color:var(--fg-fff);border-radius:8px;padding:9px 12px;font-size:13px;outline:none;font-family:inherit}
.pc-input{flex:1;min-width:220px}
.pc-tab{background:var(--bg-1e293b);border:1px solid var(--bd-334155);color:var(--fg-cbd5e1);border-radius:8px;padding:9px 14px;font-size:13px;cursor:pointer;font-family:inherit}
.pc-tab.on{background:#ea580c;border-color:#ea580c;color:#fff}
.pc-wrap{background:var(--bg-0f172a);border:1px solid var(--bd-1e293b);border-radius:12px;overflow-x:auto}
.pc-table{width:100%;border-collapse:collapse;font-size:13px;min-width:1100px}
.pc-table th{text-align:left;padding:12px 14px;background:var(--bg-0b1120);color:var(--fg-94a3b8);font-weight:600;border-bottom:1px solid var(--bd-1e293b);white-space:nowrap}
.pc-table td{padding:10px 14px;border-bottom:1px solid var(--bd-1e293b);color:var(--fg-e2e8f0);vertical-align:middle}
.pc-sub{display:block;font-size:11.5px;color:#64748b;margin-top:2px}
.pc-badge{display:inline-block;font-size:11px;font-weight:700;padding:3px 9px;border-radius:99px;white-space:nowrap}
.pc-btn{background:#ea580c;border:0;color:#fff;border-radius:8px;padding:7px 12px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit}
.pc-btn.ghost{background:transparent;border:1px solid var(--bd-475569);color:var(--fg-e2e8f0)}
.pc-btn.danger{background:var(--bg-7f1d1d);color:var(--fg-fecaca)}
.pc-empty{padding:40px;text-align:center;color:#64748b}
.pc-modal{position:fixed;inset:0;background:rgba(2,6,23,.75);z-index:200;display:flex;align-items:flex-start;justify-content:center;padding:24px 12px;overflow-y:auto}
.pc-box{background:var(--bg-0f172a);border:1px solid var(--bd-1e293b);border-radius:16px;width:100%;max-width:1060px;padding:20px;color:var(--fg-e2e8f0)}
.pc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:16px}
.pc-grid label{display:block;font-size:12px;color:var(--fg-94a3b8);font-weight:600;margin-bottom:5px}
.pc-grid .pc-input,.pc-grid .pc-select{width:100%;box-sizing:border-box;min-width:0}
.pc-preview{background:#f8fafc;border-radius:12px;padding:16px;color:#0f172a}
`;

const statusBadge = (r: Row) => {
  if (r.revoked) return { text: 'Revoked', bg: 'rgba(239,68,68,.15)', fg: 'var(--fg-fca5a5)' };
  if (!r.approved) return { text: 'Reporter not approved', bg: 'rgba(148,163,184,.15)', fg: 'var(--fg-cbd5e1)' };
  if (!r.hasCard) return { text: 'Card nahi bana', bg: 'rgba(148,163,184,.15)', fg: 'var(--fg-cbd5e1)' };
  if (r.validTill && r.validTill.getTime() < Date.now()) return { text: 'Expired', bg: 'rgba(251,191,36,.15)', fg: 'var(--fg-fcd34d)' };
  return { text: '✓ Active', bg: 'rgba(16,185,129,.15)', fg: 'var(--fg-6ee7b7)' };
};

const isoDay = (d: Date | null) => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : '');

export default function AdminPressCardsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'issued' | 'pending' | 'revoked'>('all');
  const [portal, setPortal] = useState('');
  const [editing, setEditing] = useState<Row | null>(null);
  const [origin, setOrigin] = useState('');

  useEffect(() => setOrigin(window.location.origin), []);

  useEffect(() => {
    return onSnapshot(
      collection(db, 'reporters'),
      (snap) => {
        setRows(
          snap.docs.map((d) => {
            const x = d.data();
            const siteSlug = x.cardSiteId || 'the-local-leader';
            const pressId = x.pressIds?.[siteSlug] || '';
            const issuedOn = toDate(x.pressIdIssuedOn?.[siteSlug]);
            return {
              id: d.id,
              raw: x,
              name: x.name || '—',
              phone: x.phone || x.mobile || '',
              approved: ['approved', 'active'].includes(String(x.status || '').toLowerCase()),
              siteSlug,
              pressId,
              hasCard: !!pressId,
              photo: x.photoUrl || '',
              designation: x.designation || DEFAULT_DESIGNATION,
              bloodGroup: x.bloodGroup || '',
              area: x.workArea || x.city || '',
              issuedOn,
              validTill: toDate(x.cardValidTill) || (issuedOn ? addYears(issuedOn, 1) : null),
              downloads: Number(x.idCardDownloads || 0) + Number(x.certificateDownloads || 0),
              revoked: x.cardStatus === 'revoked',
              lastDownload: toDate(x.lastCardDownloadAt)
            } as Row;
          })
        );
        setLoading(false);
        setError('');
      },
      (err) => {
        console.error('Reporters listener error:', err);
        setError('Reporters load nahi ho paaye: ' + err.message);
        setLoading(false);
      }
    );
  }, []);

  // Edit modal khula ho toh live data se sync
  const editingLive = editing ? rows.find((r) => r.id === editing.id) || editing : null;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => (tab === 'issued' ? r.hasCard && !r.revoked : tab === 'pending' ? r.approved && !r.hasCard : tab === 'revoked' ? r.revoked : true))
      .filter((r) => !portal || r.siteSlug === portal)
      .filter((r) => !q || r.name.toLowerCase().includes(q) || r.phone.includes(q) || r.pressId.toLowerCase().includes(q) || r.area.toLowerCase().includes(q))
      .sort((a, b) => (b.issuedOn?.getTime() || 0) - (a.issuedOn?.getTime() || 0));
  }, [rows, search, tab, portal]);

  const issued = rows.filter((r) => r.hasCard).length;
  const withPhoto = rows.filter((r) => r.hasCard && r.photo).length;
  const totalDownloads = rows.reduce((s, r) => s + r.downloads, 0);
  const revokedCount = rows.filter((r) => r.revoked).length;

  return (
    <div style={{ color: 'var(--fg-fff)' }}>
      <style dangerouslySetInnerHTML={{ __html: PC_CSS }} />
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700 }}>🪪 Press ID Cards</h1>
        <p style={{ fontSize: '13px', color: 'var(--fg-94a3b8)' }}>
          Har patrakar ka Media ID Card aur Pradhikaran Patra — portal, Press ID, photo, padnaam, vaidhta aur downloads. Yahin se edit, revoke aur download karein.
        </p>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.4)', color: 'var(--fg-fca5a5)', borderRadius: '10px', padding: '10px 12px', fontSize: '13px', marginBottom: '16px' }}>
          ⚠️ {error}
        </div>
      )}

      <div className="pc-cards">
        <div className="pc-card">
          <div className="pc-card-label">Cards Issued</div>
          <div className="pc-card-value">{issued}</div>
        </div>
        <div className="pc-card">
          <div className="pc-card-label">Photo ke saath</div>
          <div className="pc-card-value" style={{ color: 'var(--fg-6ee7b7)' }}>{withPhoto}</div>
        </div>
        <div className="pc-card">
          <div className="pc-card-label">Total Downloads</div>
          <div className="pc-card-value" style={{ color: 'var(--fg-fcd34d)' }}>{totalDownloads}</div>
        </div>
        <div className="pc-card">
          <div className="pc-card-label">Revoked</div>
          <div className="pc-card-value" style={{ color: revokedCount ? 'var(--fg-fca5a5)' : 'var(--fg-fff)' }}>{revokedCount}</div>
        </div>
      </div>

      <div className="pc-toolbar">
        <input className="pc-input" placeholder="Naam, mobile, Press ID ya kshetra search karein…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="pc-select" value={portal} onChange={(e) => setPortal(e.target.value)}>
          <option value="">Sabhi portals</option>
          {NETWORK_SITES.map((s) => (
            <option key={s.slug} value={s.slug}>
              {fallbackFor(s.slug).name}
            </option>
          ))}
        </select>
        {(
          [
            ['all', 'Sabhi'],
            ['issued', 'Card bane'],
            ['pending', 'Card baaki'],
            ['revoked', 'Revoked']
          ] as const
        ).map(([k, l]) => (
          <button key={k} className={`pc-tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>
            {l}
          </button>
        ))}
      </div>

      <div className="pc-wrap">
        {loading ? (
          <div className="pc-empty">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="pc-empty">Koi patrakar nahi mila</div>
        ) : (
          <table className="pc-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Patrakar</th>
                <th>Portal</th>
                <th>Press ID</th>
                <th>Padnaam</th>
                <th>Blood</th>
                <th>Kshetra</th>
                <th>Jaari / Vaidhta</th>
                <th>Downloads</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => {
                const b = statusBadge(r);
                return (
                  <tr key={r.id}>
                    <td>
                      {r.photo ? (
                        <img src={r.photo} alt={r.name} style={{ width: '36px', height: '45px', objectFit: 'cover', borderRadius: '5px' }} />
                      ) : (
                        <span className="pc-sub">—</span>
                      )}
                    </td>
                    <td>
                      {r.name}
                      <span className="pc-sub">{r.phone ? `+91 ${r.phone}` : ''}</span>
                    </td>
                    <td>{fallbackFor(r.siteSlug).name}</td>
                    <td style={{ fontFamily: 'ui-monospace, Menlo, Consolas, monospace', whiteSpace: 'nowrap' }}>{r.pressId || '—'}</td>
                    <td>{r.designation}</td>
                    <td>{r.bloodGroup || '—'}</td>
                    <td>{r.area || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {r.issuedOn ? fmtCardDate(r.issuedOn) : '—'}
                      <span className="pc-sub">{r.validTill ? `${fmtCardDate(r.validTill)} tak` : ''}</span>
                    </td>
                    <td>
                      {r.downloads}
                      <span className="pc-sub">{r.lastDownload ? fmtCardDate(r.lastDownload) : ''}</span>
                    </td>
                    <td>
                      <span className="pc-badge" style={{ background: b.bg, color: b.fg }}>
                        {b.text}
                      </span>
                    </td>
                    <td>
                      <button className="pc-btn" onClick={() => setEditing(r)}>
                        View / Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {editingLive && <EditModal key={editingLive.id} row={editingLive} origin={origin} onClose={() => setEditing(null)} />}
    </div>
  );
}

function EditModal({ row, origin, onClose }: { row: Row; origin: string; onClose: () => void }) {
  const [name, setName] = useState(row.name === '—' ? '' : row.name);
  const [designation, setDesignation] = useState(row.designation);
  const [bloodGroup, setBloodGroup] = useState(row.bloodGroup);
  const [area, setArea] = useState(row.area);
  const [validTill, setValidTill] = useState(isoDay(toDate(row.raw.cardValidTill)));
  const [siteSlug, setSiteSlug] = useState(row.siteSlug);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const fb = fallbackFor(siteSlug);
  const previewRep = {
    ...row.raw,
    name: name.trim() || row.raw.name,
    designation: designation.trim() || DEFAULT_DESIGNATION,
    bloodGroup,
    workArea: area,
    cardValidTill: validTill || row.raw.cardValidTill || null
  };
  const hasId = !!row.raw.pressIds?.[siteSlug];
  const data = hasId ? buildPressCardData(previewRep, { slug: siteSlug, name: fb.name, primaryColor: fb.primaryColor, logoUrl: fb.logoUrl, tagline: fb.tagline }, origin) : null;

  const save = async () => {
    if (!name.trim()) {
      setMsg('Naam khaali nahi ho sakta');
      return;
    }
    setSaving(true);
    setMsg('');
    try {
      await updateDoc(doc(db, 'reporters', row.id), {
        name: name.trim(),
        designation: designation.trim() || DEFAULT_DESIGNATION,
        bloodGroup,
        workArea: area.trim(),
        cardValidTill: validTill || null,
        cardUpdatedAt: serverTimestamp(),
        cardUpdatedBy: 'admin'
      });
      if (siteSlug !== row.siteSlug || !hasId) await issuePressId(row.id, siteSlug);
      setMsg('✓ Save ho gaya');
    } catch (err: any) {
      console.error(err);
      setMsg('Save nahi hua: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleRevoke = async () => {
    const revoke = !row.revoked;
    if (revoke && !window.confirm(`${row.name} ka press card revoke karein? Patrakar card download nahi kar payega aur QR verify par "Not valid" dikhega.`)) return;
    try {
      await updateDoc(doc(db, 'reporters', row.id), { cardStatus: revoke ? 'revoked' : 'active', cardStatusUpdatedAt: serverTimestamp() });
    } catch (err: any) {
      alert('Status update nahi hua: ' + err.message);
    }
  };

  return (
    <div className="pc-modal" onClick={onClose}>
      <div className="pc-box" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`${row.name} press card`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '18px', margin: 0 }}>{row.name} — Press Card</h2>
            <span className="pc-sub">
              {row.phone ? `+91 ${row.phone}` : ''} · {row.pressId || 'ID abhi nahi bani'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className={`pc-btn ${row.revoked ? '' : 'danger'}`} onClick={toggleRevoke}>
              {row.revoked ? 'Card dobara active karein' : 'Card revoke karein'}
            </button>
            <button className="pc-btn ghost" onClick={onClose}>
              ✕ Band
            </button>
          </div>
        </div>

        <div className="pc-grid">
          <div>
            <label>Naam (card par)</label>
            <input className="pc-input" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label>Padnaam (Designation)</label>
            <input className="pc-input" value={designation} maxLength={40} placeholder="Reporter / Senior Reporter / Bureau Chief" onChange={(e) => setDesignation(e.target.value)} />
          </div>
          <div>
            <label>Portal</label>
            <select className="pc-select" value={siteSlug} onChange={(e) => setSiteSlug(e.target.value)}>
              {NETWORK_SITES.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {fallbackFor(s.slug).name}
                  {row.raw.pressIds?.[s.slug] ? ` · ${row.raw.pressIds[s.slug]}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Vaidhta (khaali = jaari hone se 1 saal)</label>
            <input className="pc-input" type="date" value={validTill} onChange={(e) => setValidTill(e.target.value)} />
          </div>
          <div>
            <label>Blood Group</label>
            <select className="pc-select" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
              <option value="">—</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Karyakshetra</label>
            <input className="pc-input" value={area} maxLength={60} onChange={(e) => setArea(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <button className="pc-btn" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : '💾 Save'}
          </button>
          {msg && <span style={{ fontSize: '13px', color: msg.startsWith('✓') ? 'var(--fg-6ee7b7)' : 'var(--fg-fca5a5)' }}>{msg}</span>}
          <span className="pc-sub" style={{ marginTop: 0 }}>
            ID card downloads: {Number(row.raw.idCardDownloads || 0)} · Certificate downloads: {Number(row.raw.certificateDownloads || 0)}
          </span>
        </div>

        <div className="pc-preview">
          {data ? (
            <PressCardViewer data={data} compact />
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13.5px' }}>
              Is portal ki Press ID abhi nahi bani — “Save” dabane par ID jaari hogi aur preview dikhega.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
