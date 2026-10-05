'use client';
import React, { useEffect, useRef, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, runTransaction, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { NETWORK_SITES } from '@/lib/portals';
import { fallbackFor } from '@/lib/siteTheme';
import { DEFAULT_CATEGORIES, findDuplicate, slugify, type CategoryItem } from '@/lib/taxonomy';
import styles from '../Admin.module.css';

const CSS = `
.ct-table{width:100%;border-collapse:collapse;text-align:left;font-size:13.5px;min-width:960px}
.ct-table th{padding:12px 14px;background:var(--bg-0b1120);color:var(--fg-94a3b8);font-weight:600;border-bottom:1px solid var(--bd-1e293b);white-space:nowrap}
.ct-table td{padding:10px 14px;border-bottom:1px solid var(--bd-1e293b);vertical-align:middle}
.ct-pill{display:inline-block;font-size:11px;padding:2px 9px;border-radius:12px;font-weight:700;white-space:nowrap}
.ct-btn{background:transparent;border:1px solid var(--bd-334155);color:var(--fg-cbd5e1);border-radius:6px;padding:5px 10px;font-size:12px;cursor:pointer;font-family:inherit;margin-right:6px}
.ct-btn.danger{border-color:#ef4444;color:var(--fg-f87171)}
.ct-form{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
.ct-form label{display:block;font-size:12px;font-weight:600;color:var(--fg-cbd5e1);margin-bottom:5px}
.ct-in{width:100%;box-sizing:border-box;padding:9px 11px;background:var(--bg-020617);border:1px solid var(--bd-334155);border-radius:6px;color:var(--fg-fff);font-size:13.5px;outline:none;font-family:inherit}
.ct-in.bad{border-color:#ef4444}
.ct-err{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.45);color:var(--fg-fca5a5);border-radius:8px;padding:10px 12px;font-size:13px;margin-bottom:12px}
.ct-ok{background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.4);color:var(--fg-6ee7b7);border-radius:8px;padding:10px 12px;font-size:13px;margin-bottom:12px}
.ct-portals{display:flex;flex-wrap:wrap;gap:6px}
.ct-portal{display:inline-flex;align-items:center;gap:6px;border:1px solid var(--bd-334155);border-radius:16px;padding:4px 10px;font-size:12px;cursor:pointer}
.ct-portal.on{border-color:#2563eb;background:rgba(37,99,235,.12)}
.ct-portal input{accent-color:#2563eb}
`;

type Draft = { name: string; nameHi: string; slug: string; icon: string; color: string; order: number; showInMenu: boolean; active: boolean; portals: string[] };

const emptyDraft = (order: number): Draft => ({ name: '', nameHi: '', slug: '', icon: '📰', color: '#2563eb', order, showInMenu: true, active: true, portals: [] });

const FIELD_HI = { slug: 'Slug', name: 'English नाम', nameHi: 'हिंदी नाम' };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null); // null = form band, '' = nayi
  const [draft, setDraft] = useState<Draft>(emptyDraft(1));
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const seeded = useRef(false);

  useEffect(() => {
    return onSnapshot(
      collection(db, 'categories'),
      async (snap) => {
        // Pehli baar khaali ho toh website ki maujooda categories daal do (ek hi baar)
        if (snap.empty && !seeded.current) {
          seeded.current = true;
          try {
            const batch = writeBatch(db);
            DEFAULT_CATEGORIES.forEach((c) => batch.set(doc(db, 'categories', c.slug), { ...c, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));
            await batch.commit();
          } catch (err: any) {
            setError('शुरुआती कैटेगरी सेव नहीं हो पाईं: ' + err.message);
          }
          return;
        }
        setCategories(
          snap.docs
            .map((d) => {
              const x = d.data();
              return {
                id: d.id,
                name: x.name || '',
                nameHi: x.nameHi || '',
                slug: x.slug || d.id,
                color: x.color || '#64748b',
                icon: x.icon || '📰',
                order: Number(x.order ?? 99),
                active: x.active !== false,
                showInMenu: x.showInMenu !== false,
                portals: Array.isArray(x.portals) ? x.portals : []
              } as CategoryItem;
            })
            .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
        );
        setLoading(false);
      },
      (err) => {
        setError('कैटेगरी लोड नहीं हो पाईं: ' + err.message);
        setLoading(false);
      }
    );
  }, []);

  const isNew = editingId === '';
  const dup = editingId !== null ? findDuplicate(categories, draft, editingId || undefined) : null;

  const openNew = () => {
    setEditingId('');
    setDraft(emptyDraft((categories[categories.length - 1]?.order || 0) + 1));
    setSlugTouched(false);
    setError('');
    setNotice('');
  };
  const openEdit = (c: CategoryItem) => {
    setEditingId(c.id);
    setDraft({ name: c.name, nameHi: c.nameHi, slug: c.slug, icon: c.icon, color: c.color, order: c.order, showInMenu: c.showInMenu, active: c.active, portals: c.portals });
    setSlugTouched(true);
    setError('');
    setNotice('');
  };

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const save = async () => {
    const d = { ...draft, name: draft.name.trim(), nameHi: draft.nameHi.trim(), slug: slugify(draft.slug || draft.name), icon: draft.icon.trim() || '📰' };
    if (!d.name || !d.nameHi) return setError('कृपया English और हिंदी दोनों नाम लिखें।');
    if (!d.slug) return setError('Slug नहीं बन पाया — English नाम में अक्षर लिखें।');
    const clash = findDuplicate(categories, d, editingId || undefined);
    if (clash) return setError(`यह कैटेगरी पहले से मौजूद है — ${clash.item.name} (${clash.item.nameHi}) का ${FIELD_HI[clash.field]} यही है।`);
    setSaving(true);
    setError('');
    try {
      if (isNew) {
        // Transaction: do log ek saath same slug na bana paayein
        await runTransaction(db, async (tx) => {
          const ref = doc(db, 'categories', d.slug);
          if ((await tx.get(ref)).exists()) throw new Error('DUP');
          tx.set(ref, { ...d, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        });
        setNotice(`✓ "${d.nameHi}" कैटेगरी जुड़ गई — वेबसाइट पर दिखने लगेगी।`);
      } else {
        const { slug, ...rest } = d; // slug (doc id) nahi badalta
        void slug;
        await updateDoc(doc(db, 'categories', editingId!), { ...rest, updatedAt: serverTimestamp() });
        setNotice(`✓ "${d.nameHi}" अपडेट हो गई — वेबसाइट पर बदलाव दिखने लगेगा।`);
      }
      setEditingId(null);
    } catch (err: any) {
      setError(err.message === 'DUP' ? 'यह कैटेगरी (slug) पहले से मौजूद है।' : 'सेव नहीं हो पाया: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = (c: CategoryItem) =>
    updateDoc(doc(db, 'categories', c.id), { active: !c.active, updatedAt: serverTimestamp() }).catch((e) => setError(e.message));

  const remove = async (c: CategoryItem) => {
    if (!window.confirm(`"${c.nameHi} (${c.name})" कैटेगरी हटाएं?\nइस कैटेगरी की पुरानी खबरें बनी रहेंगी, बस मेनू से टैब हट जाएगा।`)) return;
    try {
      await deleteDoc(doc(db, 'categories', c.id));
      if (editingId === c.id) setEditingId(null);
      setNotice(`"${c.nameHi}" हटा दी गई।`);
    } catch (err: any) {
      setError('हटाया नहीं जा सका: ' + err.message);
    }
  };

  const portalText = (p: string[]) => (p.length === 0 || p.length === NETWORK_SITES.length ? 'सभी पोर्टल' : p.map((s) => fallbackFor(s).name).join(', '));

  return (
    <div style={{ color: 'var(--fg-fff)' }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Categories ({categories.length})</h1>
          <p style={{ fontSize: '13px', color: 'var(--fg-94a3b8)' }}>यहाँ का बदलाव तुरंत वेबसाइट के मेनू, खबर फ़िल्टर और आर्टिकल फ़ॉर्म में दिखता है</p>
        </div>
        <button className={styles.btnPrimary} onClick={openNew}>
          + New Category
        </button>
      </div>

      {notice && <div className="ct-ok">{notice}</div>}
      {error && editingId === null && <div className="ct-err">⚠️ {error}</div>}

      {editingId !== null && (
        <div className={styles.formCard} style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>{isNew ? 'नई कैटेगरी' : `एडिट: ${draft.nameHi || draft.name}`}</h3>
          {error && <div className="ct-err">⚠️ {error}</div>}
          {!error && dup && (
            <div className="ct-err">
              ⚠️ यह कैटेगरी पहले से मौजूद है — {dup.item.name} ({dup.item.nameHi}) का {FIELD_HI[dup.field]} यही है।
            </div>
          )}
          <div className="ct-form">
            <div>
              <label>English नाम *</label>
              <input
                className={`ct-in ${dup?.field === 'name' ? 'bad' : ''}`}
                value={draft.name}
                maxLength={40}
                placeholder="जैसे: Politics"
                onChange={(e) => {
                  set('name', e.target.value);
                  if (isNew && !slugTouched) set('slug', slugify(e.target.value));
                }}
              />
            </div>
            <div>
              <label>हिंदी नाम *</label>
              <input className={`ct-in ${dup?.field === 'nameHi' ? 'bad' : ''}`} value={draft.nameHi} maxLength={40} placeholder="जैसे: राजनीति" onChange={(e) => set('nameHi', e.target.value)} />
            </div>
            <div>
              <label>Slug (URL) {isNew ? '' : '— बदला नहीं जा सकता'}</label>
              <input
                className={`ct-in ${dup?.field === 'slug' ? 'bad' : ''}`}
                value={draft.slug}
                disabled={!isNew}
                onChange={(e) => {
                  setSlugTouched(true);
                  set('slug', slugify(e.target.value));
                }}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '70px 70px 1fr', gap: '8px' }}>
              <div>
                <label>Icon</label>
                <input className="ct-in" value={draft.icon} maxLength={4} onChange={(e) => set('icon', e.target.value)} />
              </div>
              <div>
                <label>रंग</label>
                <input className="ct-in" type="color" style={{ padding: '2px', height: '38px' }} value={draft.color} onChange={(e) => set('color', e.target.value)} />
              </div>
              <div>
                <label>क्रम (Order)</label>
                <input className="ct-in" type="number" min={1} max={999} value={draft.order} onChange={(e) => set('order', Math.max(1, Number(e.target.value) || 1))} />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--fg-cbd5e1)', marginBottom: '6px' }}>किन पोर्टल्स पर (कोई न चुनें = सभी पोर्टल)</label>
            <div className="ct-portals">
              {NETWORK_SITES.map((s) => {
                const on = draft.portals.includes(s.slug);
                return (
                  <label key={s.slug} className={`ct-portal ${on ? 'on' : ''}`}>
                    <input type="checkbox" checked={on} onChange={() => set('portals', on ? draft.portals.filter((x) => x !== s.slug) : [...draft.portals, s.slug])} />
                    {fallbackFor(s.slug).name}
                  </label>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '14px', fontSize: '13px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer' }}>
              <input type="checkbox" checked={draft.showInMenu} onChange={(e) => set('showInMenu', e.target.checked)} /> वेबसाइट मेनू में टैब दिखाएं
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer' }}>
              <input type="checkbox" checked={draft.active} onChange={(e) => set('active', e.target.checked)} /> सक्रिय (Active)
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button className={styles.btnPrimary} onClick={save} disabled={saving || !!dup}>
              {saving ? 'सेव हो रहा है…' : isNew ? '+ कैटेगरी जोड़ें' : '💾 अपडेट करें'}
            </button>
            <button className="ct-btn" onClick={() => (setEditingId(null), setError(''))}>
              रद्द करें
            </button>
          </div>
        </div>
      )}

      <div className={styles.formCard} style={{ overflowX: 'auto', padding: 0 }}>
        <table className="ct-table">
          <thead>
            <tr>
              <th>रंग</th>
              <th>Name (EN)</th>
              <th>Name (Hindi)</th>
              <th>Slug</th>
              <th>क्रम</th>
              <th>पोर्टल</th>
              <th>मेनू</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ padding: '24px', textAlign: 'center', color: 'var(--fg-94a3b8)' }}>
                  लोड हो रहा है…
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id} style={{ opacity: c.active ? 1 : 0.55 }}>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: c.color, display: 'inline-block' }} />
                      {c.icon}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>{c.nameHi}</td>
                  <td style={{ color: 'var(--fg-94a3b8)' }}>{c.slug}</td>
                  <td>{c.order}</td>
                  <td style={{ fontSize: '12px', color: 'var(--fg-94a3b8)', maxWidth: '220px' }}>{portalText(c.portals)}</td>
                  <td>{c.showInMenu ? '✓' : '—'}</td>
                  <td>
                    <span className="ct-pill" style={c.active ? { background: 'var(--bg-065f46)', color: 'var(--fg-34d399)' } : { background: 'var(--bg-7f1d1d)', color: 'var(--fg-fca5a5)' }}>
                      {c.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="ct-btn" onClick={() => openEdit(c)}>
                      ✏️ Edit
                    </button>
                    <button className="ct-btn" onClick={() => toggleActive(c)}>
                      {c.active ? 'बंद करें' : 'चालू करें'}
                    </button>
                    <button className="ct-btn danger" onClick={() => remove(c)}>
                      🗑
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
