'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, runTransaction, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cityDocId, DEFAULT_CITIES, DEFAULT_STATES, findDuplicate, slugify, type CityItem, type StateItem } from '@/lib/taxonomy';
import styles from '../Admin.module.css';

const CSS = `
.lc-grid{display:grid;grid-template-columns:minmax(260px,1fr) 2fr;gap:24px}
@media(max-width:1000px){.lc-grid{grid-template-columns:1fr}}
.lc-state{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:9px 12px;border-radius:6px;cursor:pointer;background:var(--bg-0b1120);color:var(--fg-94a3b8);font-size:13.5px;border:1px solid transparent}
.lc-state.on{background:#2563eb;color:#fff}
.lc-state small{opacity:.75;font-size:11.5px}
.lc-table{width:100%;border-collapse:collapse;text-align:left;font-size:13.5px}
.lc-table th{padding:10px;border-bottom:1px solid var(--bd-334155);color:var(--fg-94a3b8);font-weight:600}
.lc-table td{padding:10px;border-bottom:1px solid var(--bd-1e293b);vertical-align:middle}
.lc-btn{background:transparent;border:1px solid var(--bd-334155);color:var(--fg-cbd5e1);border-radius:6px;padding:4px 9px;font-size:12px;cursor:pointer;font-family:inherit;margin-right:5px}
.lc-btn.danger{border-color:#ef4444;color:var(--fg-f87171)}
.lc-in{width:100%;box-sizing:border-box;padding:8px 10px;background:var(--bg-020617);border:1px solid var(--bd-334155);border-radius:6px;color:var(--fg-fff);font-size:13px;outline:none;font-family:inherit}
.lc-in.bad{border-color:#ef4444}
.lc-form{display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:8px;align-items:end;background:var(--bg-0b1120);border:1px solid var(--bd-1e293b);border-radius:8px;padding:12px;margin-bottom:12px}
@media(max-width:700px){.lc-form{grid-template-columns:1fr}}
.lc-form label{display:block;font-size:11.5px;font-weight:600;color:var(--fg-cbd5e1);margin-bottom:4px}
.lc-err{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.45);color:var(--fg-fca5a5);border-radius:8px;padding:9px 12px;font-size:12.5px;margin-bottom:10px}
.lc-ok{background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.4);color:var(--fg-6ee7b7);border-radius:8px;padding:9px 12px;font-size:12.5px;margin-bottom:12px}
.lc-pill{display:inline-block;font-size:11px;padding:2px 8px;border-radius:12px;font-weight:700}
`;

type Draft = { name: string; nameHi: string; slug: string; active: boolean };
const empty: Draft = { name: '', nameHi: '', slug: '', active: true };
const FIELD_HI = { slug: 'Slug', name: 'English नाम', nameHi: 'हिंदी नाम' };

/** Ek chhota add/edit form (state ya city) — duplicate turant dikhata hai */
function ItemForm({
  kindHi,
  list,
  initial,
  editingId,
  onSave,
  onCancel
}: {
  kindHi: string;
  list: { id: string; name: string; nameHi: string; slug: string }[];
  initial: Draft;
  editingId?: string;
  onSave: (d: Draft) => Promise<void>;
  onCancel: () => void;
}) {
  const [d, setD] = useState<Draft>(initial);
  const [slugTouched, setSlugTouched] = useState(!!editingId);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const clean = { ...d, name: d.name.trim(), nameHi: d.nameHi.trim(), slug: slugify(d.slug || d.name) };
  const dup = (clean.name || clean.nameHi) ? findDuplicate(list, clean, editingId) : null;

  const submit = async () => {
    if (!clean.name || !clean.nameHi) return setErr('कृपया English और हिंदी दोनों नाम लिखें।');
    if (!clean.slug) return setErr('English नाम में अक्षर लिखें (slug के लिए)।');
    if (dup) return;
    setSaving(true);
    setErr('');
    try {
      await onSave(clean);
    } catch (e: any) {
      setErr(e.message === 'DUP' ? `यह ${kindHi} पहले से जोड़ा हुआ है।` : 'सेव नहीं हो पाया: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {(err || dup) && (
        <div className="lc-err">⚠️ {err || `यह ${kindHi} पहले से जोड़ा हुआ है — ${dup!.item.name} (${dup!.item.nameHi}) का ${FIELD_HI[dup!.field]} यही है।`}</div>
      )}
      <div className="lc-form">
        <div>
          <label>English नाम *</label>
          <input
            className={`lc-in ${dup?.field === 'name' ? 'bad' : ''}`}
            value={d.name}
            maxLength={60}
            autoFocus
            onChange={(e) => setD({ ...d, name: e.target.value, slug: slugTouched ? d.slug : slugify(e.target.value) })}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>
        <div>
          <label>हिंदी नाम *</label>
          <input className={`lc-in ${dup?.field === 'nameHi' ? 'bad' : ''}`} value={d.nameHi} maxLength={60} onChange={(e) => setD({ ...d, nameHi: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && submit()} />
        </div>
        <div>
          <label>Slug {editingId ? '(बदला नहीं जाता)' : ''}</label>
          <input
            className={`lc-in ${dup?.field === 'slug' ? 'bad' : ''}`}
            value={d.slug}
            disabled={!!editingId}
            onChange={(e) => {
              setSlugTouched(true);
              setD({ ...d, slug: slugify(e.target.value) });
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className={styles.btnPrimary} style={{ padding: '8px 12px', fontSize: '12.5px' }} onClick={submit} disabled={saving || !!dup}>
            {saving ? '…' : editingId ? 'अपडेट' : 'जोड़ें'}
          </button>
          <button className="lc-btn" onClick={onCancel}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LocationsPage() {
  const [states, setStates] = useState<StateItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [selected, setSelected] = useState('');
  const [stateForm, setStateForm] = useState<{ id?: string; initial: Draft } | null>(null);
  const [cityForm, setCityForm] = useState<{ id?: string; initial: Draft } | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const seeded = useRef({ states: false, cities: false });

  useEffect(() => {
    const unsubStates = onSnapshot(
      collection(db, 'states'),
      async (snap) => {
        if (snap.empty && !seeded.current.states) {
          seeded.current.states = true;
          const batch = writeBatch(db);
          DEFAULT_STATES.forEach((s) => batch.set(doc(db, 'states', s.slug), { ...s, createdAt: serverTimestamp() }));
          await batch.commit().catch((e) => setError('शुरुआती राज्य सेव नहीं हुए: ' + e.message));
          return;
        }
        const list = snap.docs
          .map((d) => ({ id: d.id, name: d.data().name || '', nameHi: d.data().nameHi || '', slug: d.data().slug || d.id, active: d.data().active !== false }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setStates(list);
        setSelected((cur) => (cur && list.some((s) => s.slug === cur) ? cur : list[0]?.slug || ''));
      },
      (e) => setError('राज्य लोड नहीं हुए: ' + e.message)
    );
    const unsubCities = onSnapshot(
      collection(db, 'cities'),
      async (snap) => {
        if (snap.empty && !seeded.current.cities) {
          seeded.current.cities = true;
          const batch = writeBatch(db);
          DEFAULT_CITIES.forEach((c) => batch.set(doc(db, 'cities', cityDocId(c.stateSlug, c.slug)), { ...c, createdAt: serverTimestamp() }));
          await batch.commit().catch((e) => setError('शुरुआती शहर सेव नहीं हुए: ' + e.message));
          return;
        }
        setCities(
          snap.docs.map((d) => ({
            id: d.id,
            name: d.data().name || '',
            nameHi: d.data().nameHi || '',
            slug: d.data().slug || '',
            stateSlug: d.data().stateSlug || '',
            active: d.data().active !== false
          }))
        );
      },
      (e) => setError('शहर लोड नहीं हुए: ' + e.message)
    );
    return () => {
      unsubStates();
      unsubCities();
    };
  }, []);

  const selectedState = states.find((s) => s.slug === selected);
  const stateCities = useMemo(() => cities.filter((c) => c.stateSlug === selected).sort((a, b) => a.name.localeCompare(b.name)), [cities, selected]);
  const cityCount = useMemo(() => {
    const m = new Map<string, number>();
    cities.forEach((c) => m.set(c.stateSlug, (m.get(c.stateSlug) || 0) + 1));
    return m;
  }, [cities]);
  const visibleStates = states.filter((s) => !search.trim() || `${s.name} ${s.nameHi}`.toLowerCase().includes(search.trim().toLowerCase()));

  const saveState = async (d: Draft, id?: string) => {
    if (id) {
      await updateDoc(doc(db, 'states', id), { name: d.name, nameHi: d.nameHi, updatedAt: serverTimestamp() });
      setNotice(`✓ राज्य "${d.nameHi}" अपडेट हो गया।`);
    } else {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'states', d.slug);
        if ((await tx.get(ref)).exists()) throw new Error('DUP');
        tx.set(ref, { name: d.name, nameHi: d.nameHi, slug: d.slug, active: true, createdAt: serverTimestamp() });
      });
      setSelected(d.slug);
      setNotice(`✓ राज्य "${d.nameHi}" जुड़ गया।`);
    }
    setStateForm(null);
  };

  const saveCity = async (d: Draft, id?: string) => {
    if (id) {
      await updateDoc(doc(db, 'cities', id), { name: d.name, nameHi: d.nameHi, updatedAt: serverTimestamp() });
      setNotice(`✓ शहर "${d.nameHi}" अपडेट हो गया।`);
    } else {
      await runTransaction(db, async (tx) => {
        const ref = doc(db, 'cities', cityDocId(selected, d.slug));
        if ((await tx.get(ref)).exists()) throw new Error('DUP');
        tx.set(ref, { name: d.name, nameHi: d.nameHi, slug: d.slug, stateSlug: selected, active: true, createdAt: serverTimestamp() });
      });
      setNotice(`✓ शहर "${d.nameHi}" (${selectedState?.nameHi}) जुड़ गया।`);
    }
    setCityForm(null);
  };

  const removeState = async (s: StateItem) => {
    const n = cityCount.get(s.slug) || 0;
    if (!window.confirm(`राज्य "${s.nameHi} (${s.name})" हटाएं?${n ? `\nइसके ${n} शहर भी हटेंगे।` : ''}`)) return;
    try {
      const batch = writeBatch(db);
      cities.filter((c) => c.stateSlug === s.slug).forEach((c) => batch.delete(doc(db, 'cities', c.id)));
      batch.delete(doc(db, 'states', s.id));
      await batch.commit();
      setNotice(`राज्य "${s.nameHi}" हटा दिया गया।`);
    } catch (e: any) {
      setError('हटाया नहीं जा सका: ' + e.message);
    }
  };

  const toggleCity = (c: CityItem) => updateDoc(doc(db, 'cities', c.id), { active: !c.active }).catch((e) => setError(e.message));
  const removeCity = async (c: CityItem) => {
    if (!window.confirm(`शहर "${c.nameHi} (${c.name})" हटाएं?`)) return;
    await deleteDoc(doc(db, 'cities', c.id)).catch((e) => setError(e.message));
  };

  return (
    <div style={{ color: 'var(--fg-fff)' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700 }}>States & Cities</h1>
        <p style={{ fontSize: '13px', color: 'var(--fg-94a3b8)' }}>यहाँ जोड़े राज्य/शहर खबर लिखते समय (आर्टिकल फ़ॉर्म) में तुरंत दिखते हैं</p>
      </div>

      {notice && <div className="lc-ok">{notice}</div>}
      {error && <div className="lc-err">⚠️ {error}</div>}

      <div className="lc-grid">
        {/* States */}
        <div className={styles.formCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>States ({states.length})</h3>
            <button className={styles.btnPrimary} style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => (setStateForm({ initial: empty }), setNotice(''))}>
              + Add
            </button>
          </div>
          {stateForm && (
            <ItemForm
              key={stateForm.id || 'new-state'}
              kindHi="राज्य"
              list={states}
              initial={stateForm.initial}
              editingId={stateForm.id}
              onSave={(d) => saveState(d, stateForm.id)}
              onCancel={() => setStateForm(null)}
            />
          )}
          <input className="lc-in" style={{ marginBottom: '10px' }} placeholder="राज्य खोजें…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '560px', overflowY: 'auto' }}>
            {visibleStates.map((s) => (
              <div key={s.id} className={`lc-state ${selected === s.slug ? 'on' : ''}`} onClick={() => setSelected(s.slug)}>
                <span>
                  {s.name} <small>· {s.nameHi}</small>
                </span>
                <small>{cityCount.get(s.slug) || 0}</small>
              </div>
            ))}
          </div>
        </div>

        {/* Cities */}
        <div className={styles.formCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700 }}>
              Cities in {selectedState?.name || '—'} ({stateCities.length})
            </h3>
            {selectedState && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="lc-btn" onClick={() => setStateForm({ id: selectedState.id, initial: { ...empty, name: selectedState.name, nameHi: selectedState.nameHi, slug: selectedState.slug } })}>
                  ✏️ राज्य एडिट
                </button>
                <button className="lc-btn danger" onClick={() => removeState(selectedState)}>
                  🗑 राज्य हटाएं
                </button>
                <button className={styles.btnPrimary} style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => (setCityForm({ initial: empty }), setNotice(''))}>
                  + Add City
                </button>
              </div>
            )}
          </div>
          {cityForm && selectedState && (
            <ItemForm
              key={(cityForm.id || 'new-city') + selected}
              kindHi={`शहर (${selectedState.nameHi} में)`}
              list={stateCities}
              initial={cityForm.initial}
              editingId={cityForm.id}
              onSave={(d) => saveCity(d, cityForm.id)}
              onCancel={() => setCityForm(null)}
            />
          )}
          {stateCities.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--fg-94a3b8)', fontSize: '13px' }}>इस राज्य में अभी कोई शहर नहीं जोड़ा गया।</div>
          ) : (
            <table className="lc-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Hindi Name</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {stateCities.map((c) => (
                  <tr key={c.id} style={{ opacity: c.active ? 1 : 0.55 }}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.nameHi}</td>
                    <td style={{ color: 'var(--fg-94a3b8)' }}>{c.slug}</td>
                    <td>
                      <span className="lc-pill" style={c.active ? { background: 'var(--bg-065f46)', color: 'var(--fg-34d399)' } : { background: 'var(--bg-7f1d1d)', color: 'var(--fg-fca5a5)' }}>
                        {c.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="lc-btn" onClick={() => setCityForm({ id: c.id, initial: { ...empty, name: c.name, nameHi: c.nameHi, slug: c.slug } })}>
                        ✏️
                      </button>
                      <button className="lc-btn" onClick={() => toggleCity(c)}>
                        {c.active ? 'बंद' : 'चालू'}
                      </button>
                      <button className="lc-btn danger" onClick={() => removeCity(c)}>
                        🗑
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
