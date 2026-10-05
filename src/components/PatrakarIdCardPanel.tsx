'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, increment, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { NETWORK_SITES } from '@/lib/portals';
import { fallbackFor } from '@/lib/siteTheme';
import PressCardViewer from '@/components/PressCardViewer';
import { BLOOD_GROUPS, buildPressCardData, issuePressId, resizePhoto } from '@/lib/pressCard';

interface Props {
  reporterDocId: string;
  themeColor: string;
}

const label: React.CSSProperties = { display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' };
const input: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  backgroundColor: '#f8fafc',
  border: '1.5px solid #cbd5e1',
  borderRadius: '8px',
  padding: '10px 12px',
  fontSize: '13.5px',
  fontFamily: 'inherit'
};

/*
 * Patrakar ka apna ID card + pradhikaran patra:
 *  - kis portal ka patrakar (logo/naam/rang/ID prefix usi ka), photo, blood group, karyakshetra
 *  - naam, padnaam, validity admin ke haath me (Admin → Press ID Cards)
 */
export default function PatrakarIdCardPanel({ reporterDocId, themeColor }: Props) {
  const [rep, setRep] = useState<any>(null);
  const [site, setSite] = useState<{ slug: string; name?: string; primaryColor?: string; logoUrl?: string } | null>(null);
  const [siteSlug, setSiteSlug] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [workArea, setWorkArea] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [origin, setOrigin] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);

  // Reporter doc live (admin badlaav turant dikhte hain)
  useEffect(() => {
    return onSnapshot(doc(db, 'reporters', reporterDocId), (snap) => {
      const d = snap.data();
      if (!d) return;
      setRep(d);
      setSiteSlug((cur) => cur || d.cardSiteId || 'the-local-leader');
      if (!dirty) {
        setBloodGroup(d.bloodGroup || '');
        setWorkArea(d.workArea || d.city || '');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reporterDocId]);

  // Chune gaye portal ka config
  useEffect(() => {
    if (!siteSlug) return;
    setSite({ slug: siteSlug });
    return onSnapshot(doc(db, 'sites', siteSlug), (snap) => {
      const d = snap.data() || {};
      setSite({ slug: siteSlug, name: d.name, primaryColor: d.primaryColor, logoUrl: d.logoUrl });
    });
  }, [siteSlug]);

  // Pehli baar: chune portal ki Press ID abhi tak nahi bani toh bana do
  const hasIdForSite = !!rep?.pressIds?.[siteSlug];
  useEffect(() => {
    if (!rep || !siteSlug || hasIdForSite || rep.cardStatus === 'revoked' || siteSlug !== (rep.cardSiteId || 'the-local-leader')) return;
    issuePressId(reporterDocId, siteSlug).catch((err) => console.error('Press ID issue error:', err));
  }, [rep, siteSlug, hasIdForSite, reporterDocId]);

  const brand = site?.primaryColor || fallbackFor(siteSlug || 'the-local-leader').primaryColor || themeColor;
  const cardData = useMemo(() => {
    if (!rep || !site || !hasIdForSite) return null;
    return buildPressCardData({ ...rep, bloodGroup, workArea }, site, origin);
  }, [rep, site, hasIdForSite, bloodGroup, workArea, origin]);

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setMsg({ text: 'कृपया 8 MB से छोटी फ़ोटो चुनें।', ok: false });
      return;
    }
    setPhotoBusy(true);
    setMsg(null);
    try {
      const dataUrl = await resizePhoto(file);
      await updateDoc(doc(db, 'reporters', reporterDocId), { photoUrl: dataUrl, photoUpdatedAt: serverTimestamp() });
      setMsg({ text: '✓ फ़ोटो कार्ड पर लग गई।', ok: true });
    } catch (err: any) {
      console.error('Photo upload error:', err);
      setMsg({ text: err?.message === 'not-image' ? 'कृपया केवल फ़ोटो (JPG/PNG) चुनें।' : 'फ़ोटो अपलोड नहीं हो पाई, कृपया पुनः प्रयास करें।', ok: false });
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await updateDoc(doc(db, 'reporters', reporterDocId), {
        bloodGroup,
        workArea: workArea.trim(),
        cardUpdatedAt: serverTimestamp()
      });
      const { pressId } = await issuePressId(reporterDocId, siteSlug);
      setDirty(false);
      setMsg({ text: `✓ कार्ड सेव हो गया — ${fallbackFor(siteSlug).name} · आईडी ${pressId}`, ok: true });
    } catch (err) {
      console.error('Card save error:', err);
      setMsg({ text: 'सेव नहीं हो पाया, कृपया पुनः प्रयास करें।', ok: false });
    } finally {
      setSaving(false);
    }
  };

  const trackDownload = (kind: 'id-card' | 'certificate') => {
    updateDoc(doc(db, 'reporters', reporterDocId), {
      [kind === 'id-card' ? 'idCardDownloads' : 'certificateDownloads']: increment(1),
      lastCardDownloadAt: serverTimestamp()
    }).catch((err) => console.error('Download count error:', err));
  };

  if (!rep) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>कार्ड लोड हो रहा है…</div>;

  if (rep.cardStatus === 'revoked') {
    return (
      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '12px', padding: '20px', fontSize: '14px', lineHeight: 1.7 }}>
        <b>⚠️ आपका प्रेस आईडी कार्ड एडमिन द्वारा निरस्त (रद्द) किया गया है।</b>
        <div>अधिक जानकारी के लिए कृपया कार्यालय से संपर्क करें: +91 8103333381</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '20px' }}>
      {/* Settings */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#0f172a' }}>कार्ड की जानकारी</h3>
        <p style={{ margin: '0 0 16px', fontSize: '12.5px', color: '#64748b' }}>
          नाम, पदनाम और वैधता एडमिन द्वारा तय होते हैं। नाम में बदलाव के लिए कार्यालय से संपर्क करें।
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          <div>
            <label style={label}>किस पोर्टल का पत्रकार कार्ड *</label>
            <select
              value={siteSlug}
              onChange={(e) => {
                setSiteSlug(e.target.value);
                setDirty(true);
              }}
              style={input}
            >
              {NETWORK_SITES.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {fallbackFor(s.slug).name}
                  {rep.pressIds?.[s.slug] ? ` · ${rep.pressIds[s.slug]}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={label}>ब्लड ग्रुप</label>
            <select
              value={bloodGroup}
              onChange={(e) => {
                setBloodGroup(e.target.value);
                setDirty(true);
              }}
              style={input}
            >
              <option value="">चुनें</option>
              {BLOOD_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={label}>कार्यक्षेत्र (शहर / जिला / राज्य)</label>
            <input
              value={workArea}
              maxLength={60}
              placeholder="उदा. इंदौर, मध्य प्रदेश"
              onChange={(e) => {
                setWorkArea(e.target.value.replace(/[<>{}[\]@#$%^*=_~`|\\0-9]/g, ''));
                setDirty(true);
              }}
              style={input}
            />
          </div>
          <div>
            <label style={label}>आपकी फ़ोटो (पासपोर्ट साइज़)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {rep.photoUrl ? (
                <img src={rep.photoUrl} alt="आपकी फ़ोटो" style={{ width: '42px', height: '52px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              ) : (
                <div style={{ width: '42px', height: '52px', borderRadius: '6px', border: '1px dashed #cbd5e1', display: 'grid', placeItems: 'center', fontSize: '18px' }}>👤</div>
              )}
              <label
                style={{
                  background: '#fff',
                  color: brand,
                  border: `1.5px solid ${brand}`,
                  borderRadius: '8px',
                  padding: '9px 14px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: photoBusy ? 'wait' : 'pointer'
                }}
              >
                {photoBusy ? 'अपलोड हो रही है…' : rep.photoUrl ? 'फ़ोटो बदलें' : '📷 फ़ोटो लगाएं'}
                <input type="file" accept="image/*" onChange={handlePhoto} disabled={photoBusy} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{ background: brand, color: '#fff', border: 'none', borderRadius: '8px', padding: '11px 20px', fontSize: '13.5px', fontWeight: 700, cursor: saving ? 'wait' : 'pointer' }}
          >
            {saving ? 'सेव हो रहा है…' : '💾 कार्ड सेव करें'}
          </button>
          {dirty && !saving && <span style={{ fontSize: '12.5px', color: '#b45309' }}>बदलाव सेव करना बाकी है</span>}
          {msg && <span style={{ fontSize: '13px', fontWeight: 600, color: msg.ok ? '#15803d' : '#b91c1c' }}>{msg.text}</span>}
        </div>
        {!rep.photoUrl && (
          <div style={{ marginTop: '12px', background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412', borderRadius: '8px', padding: '9px 12px', fontSize: '12.5px' }}>
            कार्ड डाउनलोड करने से पहले अपनी साफ़ पासपोर्ट साइज़ फ़ोटो लगाएं।
          </div>
        )}
      </div>

      {/* Preview + download */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px' }}>
        {cardData ? (
          <PressCardViewer data={cardData} onDownload={(kind) => trackDownload(kind)} />
        ) : (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '13.5px' }}>
            {hasIdForSite ? 'कार्ड तैयार हो रहा है…' : `${fallbackFor(siteSlug).name} का कार्ड बनाने के लिए “कार्ड सेव करें” दबाएं।`}
          </div>
        )}
      </div>
    </div>
  );
}
