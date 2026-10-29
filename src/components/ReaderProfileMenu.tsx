'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { setMarketingConsent } from '@/lib/consent';
import { compressToBlob, uploadToS3 } from '@/lib/s3Upload';
import { isValidEmail, isValidName, sanitizeName } from '@/lib/validation';

export interface ReaderProfile {
  uid?: string;
  name?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
}

const RP_STYLES = `
.rp-chip{display:flex;align-items:center;gap:7px;background:#f5f4f1;border:1px solid #e5e3df;border-radius:20px;padding:3px 12px 3px 3px;font-size:12.5px;font-weight:600;white-space:nowrap;cursor:pointer;color:#1a1a1a;font-family:inherit}
.rp-chip.compact{padding:3px}
.rp-av{width:26px;height:26px;border-radius:50%;color:#fff;display:grid;place-items:center;font-size:13px;font-weight:800;flex-shrink:0;overflow:hidden}
.rp-av img,.rp-av-lg img{width:100%;height:100%;object-fit:cover;display:block}
.rp-overlay{position:fixed;inset:0;z-index:100003;background:rgba(15,23,42,.45);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:16px}
.rp-box{background:#fff;border-radius:18px;width:100%;max-width:380px;max-height:90vh;overflow-y:auto;padding:22px;box-shadow:0 24px 60px -18px rgba(0,0,0,.4);color:#0f172a;font-family:system-ui,-apple-system,sans-serif}
.rp-head{display:flex;align-items:center;gap:12px;margin-bottom:16px}
.rp-av-lg{width:52px;height:52px;border-radius:50%;color:#fff;display:grid;place-items:center;font-size:22px;font-weight:800;flex-shrink:0;overflow:hidden}
.rp-edit-head{display:flex;flex-direction:column;align-items:center;gap:10px;margin-bottom:18px}
.rp-photo-wrap{position:relative;width:92px;height:92px}
.rp-av-xl{width:92px;height:92px;border-radius:50%;color:#fff;display:grid;place-items:center;font-size:38px;font-weight:800;overflow:hidden}
.rp-av-xl img{width:100%;height:100%;object-fit:cover;display:block}
.rp-cam{position:absolute;right:-2px;bottom:-2px;width:32px;height:32px;border-radius:50%;border:2.5px solid #fff;display:grid;place-items:center;font-size:15px;color:#fff;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.25)}
.rp-field{margin-bottom:14px}
.rp-field label{display:block;font-size:12.5px;font-weight:600;color:#334155;margin-bottom:5px}
.rp-input{width:100%;padding:10px 12px;border-radius:9px;border:1px solid #cbd5e1;font-size:14px;outline:none;box-sizing:border-box;font-family:inherit;color:#0f172a;background:#fff}
.rp-input:focus{border-color:#94a3b8}
.rp-input.bad{border-color:#dc2626}
.rp-err{display:block;margin-top:5px;font-size:11.5px;color:#dc2626;font-weight:500}
.rp-save-row{display:flex;gap:10px;margin-top:4px}
.rp-name{font-size:17px;font-weight:800;margin:0;line-height:1.3;word-break:break-word}
.rp-close{margin-left:auto;align-self:flex-start;background:#f1f5f9;border:0;border-radius:50%;width:30px;height:30px;cursor:pointer;color:#64748b;font-size:13px;flex-shrink:0}
.rp-row{display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #f1f5f9;font-size:13.5px}
.rp-label{color:#64748b;flex-shrink:0}
.rp-value{font-weight:600;text-align:right;word-break:break-all}
.rp-ref{margin-top:14px;background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:12px 14px;font-size:13px;color:#7c2d12}
.rp-ref-stats{display:flex;gap:18px;margin:8px 0 10px}
.rp-ref-stats b{display:block;font-size:18px;color:#0f172a}
.rp-btn{width:100%;border-radius:10px;padding:11px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit}
.rp-logout{margin-top:18px;background:#fff;color:#dc2626;border:1.5px solid #fecaca}
.rp-logout:hover{background:#fef2f2}
.rp-confirm{max-width:340px;text-align:center}
.rp-confirm h3{margin:0 0 8px;font-size:18px;font-weight:800}
.rp-confirm p{margin:0 0 20px;font-size:14px;color:#475569;line-height:1.55}
.rp-confirm-row{display:flex;gap:10px}
.rp-cancel{background:#f1f5f9;color:#334155;border:1px solid #e2e8f0}
.rp-danger{background:#dc2626;color:#fff;border:0}
.rp-danger:disabled{opacity:.7;cursor:not-allowed}
`;

// Placeholder email (phone@news.local) asli email nahi — profile me nahi dikhana
const displayEmail = (email?: string) => (email && !email.endsWith('@news.local') ? email : '—');

export default function ReaderProfileMenu({
  user,
  primaryColor = '#ea580c',
  isEnglish: isEnglishProp = false,
  compact = false,
  onLogout,
  onOpenRewards
}: {
  user: ReaderProfile;
  primaryColor?: string;
  isEnglish?: boolean;
  compact?: boolean; // mobile header me sirf avatar
  onLogout: () => Promise<void> | void;
  onOpenRewards?: () => void;
}) {
  // Modal 'notranslate' hai (Google Translate ise chhodta hai), isliye site English par ho to bhi
  // labels Hindi reh jaate the. Yahan khud detect karte hain ki Google Translate target 'en' hai —
  // tab is modal ke apne labels English dikhate hain. (English-native portal par prop pehle hi true.)
  const [translatedEn, setTranslatedEn] = useState(false);
  useEffect(() => {
    const check = () => {
      try {
        const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
        const target = m ? decodeURIComponent(m[1]).split('/').filter(Boolean).pop() : '';
        const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
        setTranslatedEn(target === 'en' || combo?.value === 'en');
      } catch {
        /* ignore */
      }
    };
    check();
    // Translate lagne/hatne par <html> ki class badalti hai — tab dobara check
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    const id = window.setInterval(check, 1500); // widget deri se load ho to bhi pakad le
    return () => {
      obs.disconnect();
      window.clearInterval(id);
    };
  }, []);
  const isEnglish = isEnglishProp || translatedEn;

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [stats, setStats] = useState<{ referrals: number; months: number; code: string } | null>(null);
  // DPDP: marketing sahmati — yahin se chalu/band (wapas lena dene jitna aasaan)
  const [marketing, setMarketing] = useState<boolean | null>(null);
  const [savingMk, setSavingMk] = useState(false);
  // Naam/email/photo database (users/u_{phone}) se — browser me rakha purana session alag na dikhaye
  const [fresh, setFresh] = useState<{ name?: string; email?: string; photoUrl?: string } | null>(null);
  const rawName = fresh?.name || user.name;
  // Bina naam wale pathak ka default 'पाठक' — English portal par 'Reader'
  const name = isEnglish && rawName === 'पाठक' ? 'Reader' : rawName;
  const email = fresh?.email || user.email;
  const photoUrl = fresh?.photoUrl || user.photoUrl || '';

  const initial = (name || 'प').trim().charAt(0).toUpperCase();
  const shortName = name ? (name.length > 10 ? `${name.slice(0, 10)}…` : name) : isEnglish ? 'User' : 'यूज़र';

  // Profile edit (naam / email / foto)
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null); // nayi chuni foto (abhi upload nahi)
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editAttempted, setEditAttempted] = useState(false);
  const [saveErr, setSaveErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Edit form me asli email (placeholder @news.local nahi) pehle se bhara
  const startEdit = () => {
    setEditName(rawName && rawName !== 'पाठक' ? rawName : '');
    setEditEmail(email && !email.endsWith('@news.local') ? email : '');
    setPhotoPreview(null);
    setPhotoFile(null);
    setEditAttempted(false);
    setSaveErr('');
    setEditing(true);
  };

  const pickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = ''; // same file dobara chune to bhi chale
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(f.type)) {
      setSaveErr(isEnglish ? 'Please choose a PNG, JPG, WebP or GIF image.' : 'कृपया PNG, JPG, WebP या GIF फ़ोटो चुनें।');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setSaveErr(isEnglish ? 'Image must be smaller than 10 MB.' : 'फ़ोटो 10 MB से छोटी होनी चाहिए।');
      return;
    }
    setSaveErr('');
    setPhotoFile(f);
    setPhotoPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(f);
    });
  };

  // Chuni foto ka preview memory se hata do (modal/edit band hone par)
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const editNameOk = isValidName(editName);
  const editEmailOk = isValidEmail(editEmail);

  const saveProfile = async () => {
    setEditAttempted(true);
    setSaveErr('');
    if (!editNameOk || !editEmailOk) return;
    if (!user.phone) return;
    setSavingProfile(true);
    try {
      let newPhotoUrl = photoUrl;
      // Nayi foto chuni ho to pehle S3 par (compress karke) — URL profile me save hoti hai
      if (photoFile) {
        const blob = photoFile.type === 'image/gif' ? photoFile : await compressToBlob(photoFile, 512, 0.85);
        const url = await uploadToS3(blob, 'profile');
        if (!url) throw new Error('upload-off');
        newPhotoUrl = url;
      }
      const uid = user.uid || `u_${user.phone}`;
      const payload = { name: editName.trim(), email: editEmail.trim(), photoUrl: newPhotoUrl, updatedAt: serverTimestamp() };
      await setDoc(doc(db, 'users', uid), payload, { merge: true });
      // Local view + saved sessions turant update
      setFresh({ name: payload.name, email: payload.email, photoUrl: newPhotoUrl });
      for (const key of ['reader_user', 'shok_user']) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const s = JSON.parse(raw);
          if (s.phone !== user.phone) continue;
          localStorage.setItem(key, JSON.stringify({ ...s, name: payload.name, email: payload.email, photoUrl: newPhotoUrl }));
        } catch {
          /* kharab session — chhod do */
        }
      }
      setEditing(false);
    } catch (err) {
      console.error('Profile save error:', err);
      setSaveErr(
        (err as any)?.message === 'upload-off'
          ? isEnglish ? 'Photo upload is not set up yet. Name/email can still be saved — remove the photo and try.' : 'फ़ोटो अपलोड अभी चालू नहीं है। नाम/ईमेल सेव हो सकते हैं — फ़ोटो हटाकर पुनः प्रयास करें।'
          : isEnglish ? 'Could not save, please try again.' : 'सेव नहीं हो पाया, कृपया पुनः प्रयास करें।'
      );
    } finally {
      setSavingProfile(false);
    }
  };

  // Avatar: foto ho to image, warna pehla akshar
  const avatarContent = (url: string) => (url ? <img src={url} alt="" /> : initial);

  useEffect(() => {
    if (!user.phone) return;
    let cancelled = false;
    getDoc(doc(db, 'users', user.uid || `u_${user.phone}`))
      .then((snap) => {
        const d = snap.data();
        if (cancelled || !d) return;
        setFresh({ name: d.name || undefined, email: d.email || undefined, photoUrl: d.photoUrl || undefined });
        // Saved session bhi sahi kar do (agli baar seedha sahi naam/foto)
        for (const key of ['reader_user', 'shok_user']) {
          try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const s = JSON.parse(raw);
            if (s.phone !== user.phone) continue;
            if ((d.name && s.name !== d.name) || (d.email && s.email !== d.email) || (d.photoUrl && s.photoUrl !== d.photoUrl)) {
              localStorage.setItem(key, JSON.stringify({ ...s, name: d.name || s.name, email: d.email || s.email, photoUrl: d.photoUrl || s.photoUrl }));
            }
          } catch {
            /* kharab session — chhod do */
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user.phone, user.uid]);

  useEffect(() => setMounted(true), []);

  // Modal khulne par referral summary (safal referrals + bina claim rewards)
  useEffect(() => {
    if (!open || !user.phone) return;
    let cancelled = false;
    Promise.all([
      getDoc(doc(db, 'users', user.uid || `u_${user.phone}`)),
      getDocs(query(collection(db, 'referral_rewards'), where('referrerPhone', '==', user.phone)))
    ])
      .then(([userSnap, rewardsSnap]) => {
        if (cancelled) return;
        setStats({
          referrals: Number(userSnap.data()?.successfulReferralsCount || rewardsSnap.size || 0),
          months: Number(userSnap.data()?.referralRewardMonths || 0),
          code: userSnap.data()?.referralCode || ''
        });
        setMarketing(userSnap.data()?.consent?.marketing === true);
      })
      .catch((err) => console.error('Referral summary load error:', err));
    return () => {
      cancelled = true;
    };
  }, [open, user.phone, user.uid]);

  // Esc se modal / confirm band
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || loggingOut || savingProfile) return;
      if (editing) setEditing(false);
      else if (confirming) setConfirming(false);
      else setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, confirming, editing, loggingOut, savingProfile]);

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    await onLogout();
    setLoggingOut(false);
    setConfirming(false);
    setOpen(false);
  };

  const t = isEnglish
    ? { title: 'My Profile', mobile: 'Mobile', email: 'Email', refCode: 'Referral Code', refTitle: '🎁 Refer & Earn', referrals: 'Successful referrals', rewards: 'Free e-paper months', viewRewards: 'Refer & share link', logout: 'Logout',
        edit: 'Edit Profile', editTitle: 'Edit Profile', name: 'Full Name', changePhoto: 'Tap the camera to change photo', save: 'Save', saving: 'Saving…', cancel: 'Cancel', nameErr: 'Please enter a valid name.', emailErr: 'Please enter a valid email.',
        confirmTitle: 'Confirm logout', confirmBody: 'Are you sure you want to log out of your account?', confirmCancel: 'Cancel', confirmYes: 'Yes, log out', loggingOut: 'Logging out…' }
    : { title: 'मेरी प्रोफ़ाइल', mobile: 'मोबाइल', email: 'ईमेल', refCode: 'रेफरल कोड', refTitle: '🎁 रेफर और कमाएं', referrals: 'सफल रेफरल', rewards: 'फ्री ई-पेपर महीने', viewRewards: 'रेफरल कोड व लिंक शेयर करें', logout: 'लॉगआउट',
        edit: 'प्रोफ़ाइल संपादित करें', editTitle: 'प्रोफ़ाइल संपादित करें', name: 'पूरा नाम', changePhoto: 'फ़ोटो बदलने हेतु कैमरा दबाएं', save: 'सेव करें', saving: 'सेव हो रहा है…', cancel: 'रद्द करें', nameErr: 'कृपया सही नाम दर्ज करें।', emailErr: 'कृपया सही ईमेल दर्ज करें।',
        confirmTitle: 'लॉगआउट की पुष्टि', confirmBody: 'क्या आप वाकई अपने खाते से लॉगआउट करना चाहते हैं?', confirmCancel: 'रद्द करें', confirmYes: 'हाँ, लॉगआउट करें', loggingOut: 'लॉगआउट हो रहा है…' };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: RP_STYLES }} />
      <button type="button" className={`rp-chip${compact ? ' compact' : ''}`} onClick={() => setOpen(true)} aria-label={t.title} aria-haspopup="dialog">
        <span className="rp-av" style={{ background: primaryColor }}>{avatarContent(photoUrl)}</span>
        {!compact && <span>{shortName}</span>}
      </button>

      {mounted && open &&
        createPortal(
          <div className="rp-overlay notranslate" translate="no" onClick={() => !loggingOut && !savingProfile && (editing ? setEditing(false) : confirming ? setConfirming(false) : setOpen(false))}>
            {editing ? (
              <div className="rp-box" role="dialog" aria-modal="true" aria-label={t.editTitle} onClick={(e) => e.stopPropagation()}>
                <div className="rp-head">
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>{t.editTitle}</div>
                  </div>
                  <button type="button" className="rp-close" onClick={() => !savingProfile && setEditing(false)} aria-label="बंद करें">✕</button>
                </div>

                <div className="rp-edit-head">
                  <div className="rp-photo-wrap">
                    <span className="rp-av-xl" style={{ background: primaryColor }}>{avatarContent(photoPreview || photoUrl)}</span>
                    <button type="button" className="rp-cam" style={{ background: primaryColor }} onClick={() => fileRef.current?.click()} aria-label={t.changePhoto}>📷</button>
                    <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={pickPhoto} />
                  </div>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>{t.changePhoto}</span>
                </div>

                <div className="rp-field">
                  <label htmlFor="rp-name-in">{t.name}</label>
                  <input
                    id="rp-name-in"
                    className={`rp-input${editAttempted && !editNameOk ? ' bad' : ''}`}
                    value={editName}
                    maxLength={60}
                    onChange={(e) => setEditName(sanitizeName(e.target.value))}
                    placeholder={isEnglish ? 'Your name' : 'अपना नाम'}
                  />
                  {editAttempted && !editNameOk && <span className="rp-err">{t.nameErr}</span>}
                </div>

                <div className="rp-field">
                  <label htmlFor="rp-email-in">{t.email}</label>
                  <input
                    id="rp-email-in"
                    type="email"
                    className={`rp-input${editAttempted && !editEmailOk ? ' bad' : ''}`}
                    value={editEmail}
                    maxLength={254}
                    onChange={(e) => setEditEmail(e.target.value.replace(/\s/g, ''))}
                    placeholder="example@gmail.com"
                  />
                  {editAttempted && !editEmailOk && <span className="rp-err">{t.emailErr}</span>}
                </div>

                <div className="rp-field">
                  <label>{t.mobile}</label>
                  <input className="rp-input" value={user.phone ? `+91 ${user.phone}` : '—'} disabled style={{ background: '#f1f5f9', color: '#64748b' }} />
                </div>

                {saveErr && <span className="rp-err" style={{ marginBottom: '10px' }}>{saveErr}</span>}

                <div className="rp-save-row">
                  <button type="button" className="rp-btn rp-cancel" onClick={() => setEditing(false)} disabled={savingProfile}>{t.cancel}</button>
                  <button type="button" className="rp-btn" style={{ background: primaryColor, color: '#fff', border: 0, opacity: savingProfile ? 0.7 : 1 }} onClick={saveProfile} disabled={savingProfile}>
                    {savingProfile ? t.saving : t.save}
                  </button>
                </div>
              </div>
            ) : !confirming ? (
              <div className="rp-box" role="dialog" aria-modal="true" aria-label={t.title} onClick={(e) => e.stopPropagation()}>
                <div className="rp-head">
                  <span className="rp-av-lg" style={{ background: primaryColor }}>{avatarContent(photoUrl)}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>{t.title}</div>
                    <p className="rp-name">{name || '—'}</p>
                  </div>
                  <button type="button" className="rp-close" onClick={() => setOpen(false)} aria-label="बंद करें">✕</button>
                </div>

                <div className="rp-row">
                  <span className="rp-label">{t.mobile}</span>
                  <span className="rp-value">{user.phone ? `+91 ${user.phone}` : '—'}</span>
                </div>
                <div className="rp-row">
                  <span className="rp-label">{t.email}</span>
                  <span className="rp-value">{displayEmail(email)}</span>
                </div>
                {user.phone && (
                  <div className="rp-row">
                    <span className="rp-label">{t.refCode}</span>
                    <span className="rp-value" style={{ color: primaryColor, fontFamily: 'ui-monospace, Menlo, Consolas, monospace', letterSpacing: '1px' }}>
                      {stats ? stats.code || (isEnglish ? 'Open Refer & Earn' : 'रेफर पेज खोलें') : '…'}
                    </span>
                  </div>
                )}

                {user.phone && (
                  <div className="rp-ref">
                    <b>{t.refTitle}</b>
                    <div className="rp-ref-stats">
                      <span>
                        <b>{stats ? stats.referrals : '…'}</b>
                        {t.referrals}
                      </span>
                      <span>
                        <b>{stats ? stats.months : '…'}</b>
                        {t.rewards}
                      </span>
                    </div>
                    {onOpenRewards && (
                      <button
                        type="button"
                        className="rp-btn"
                        style={{ background: primaryColor, color: '#fff', border: 0, padding: '9px', fontSize: '13px' }}
                        onClick={() => {
                          setOpen(false);
                          onOpenRewards();
                        }}
                      >
                        {t.viewRewards}
                      </button>
                    )}
                  </div>
                )}

                {user.phone && marketing !== null && (
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginTop: '14px', fontSize: '13px', color: '#334155', cursor: 'pointer' }}>
                    <span>📣 {isEnglish ? 'Offers & promotional messages' : 'ऑफ़र व प्रचार संदेश (SMS/WhatsApp/ईमेल)'}</span>
                    <input
                      type="checkbox"
                      checked={marketing}
                      disabled={savingMk}
                      style={{ width: '18px', height: '18px', accentColor: primaryColor }}
                      onChange={async (e) => {
                        const next = e.target.checked;
                        setSavingMk(true);
                        try {
                          await setMarketingConsent('reader', user.phone!, ['users', user.uid || `u_${user.phone}`], next);
                          setMarketing(next);
                        } catch (err) {
                          console.error('Marketing consent update error:', err);
                        } finally {
                          setSavingMk(false);
                        }
                      }}
                    />
                  </label>
                )}
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#64748b' }}>
                  🔒{' '}
                  <Link href="/privacy-policy#dpdp" style={{ color: '#64748b' }}>
                    {isEnglish ? 'Privacy & consent' : 'गोपनीयता व सहमति'}
                  </Link>{' '}
                  ·{' '}
                  <Link href="/delete-account" style={{ color: '#64748b' }}>
                    {isEnglish ? 'Delete account' : 'खाता हटाएं'}
                  </Link>
                </div>

                <button
                  type="button"
                  className="rp-btn"
                  style={{ marginTop: '16px', background: primaryColor, color: '#fff', border: 0 }}
                  onClick={startEdit}
                >
                  ✏️ {t.edit}
                </button>

                <button type="button" className="rp-btn rp-logout" onClick={() => setConfirming(true)}>
                  ⎋ {t.logout}
                </button>
              </div>
            ) : (
              <div className="rp-box rp-confirm" role="alertdialog" aria-modal="true" aria-labelledby="rp-confirm-title" onClick={(e) => e.stopPropagation()}>
                <h3 id="rp-confirm-title">{t.confirmTitle}</h3>
                <p>{t.confirmBody}</p>
                <div className="rp-confirm-row">
                  <button type="button" className="rp-btn rp-cancel" onClick={() => setConfirming(false)} disabled={loggingOut} autoFocus>
                    {t.confirmCancel}
                  </button>
                  <button type="button" className="rp-btn rp-danger" onClick={handleConfirmLogout} disabled={loggingOut}>
                    {loggingOut ? t.loggingOut : t.confirmYes}
                  </button>
                </div>
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
