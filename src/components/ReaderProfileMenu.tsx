'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { setMarketingConsent } from '@/lib/consent';

export interface ReaderProfile {
  uid?: string;
  name?: string;
  phone?: string;
  email?: string;
}

const RP_STYLES = `
.rp-chip{display:flex;align-items:center;gap:7px;background:#f5f4f1;border:1px solid #e5e3df;border-radius:20px;padding:3px 12px 3px 3px;font-size:12.5px;font-weight:600;white-space:nowrap;cursor:pointer;color:#1a1a1a;font-family:inherit}
.rp-chip.compact{padding:3px}
.rp-av{width:26px;height:26px;border-radius:50%;color:#fff;display:grid;place-items:center;font-size:13px;font-weight:800;flex-shrink:0}
.rp-overlay{position:fixed;inset:0;z-index:100003;background:rgba(15,23,42,.45);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:16px}
.rp-box{background:#fff;border-radius:18px;width:100%;max-width:380px;max-height:90vh;overflow-y:auto;padding:22px;box-shadow:0 24px 60px -18px rgba(0,0,0,.4);color:#0f172a;font-family:system-ui,-apple-system,sans-serif}
.rp-head{display:flex;align-items:center;gap:12px;margin-bottom:16px}
.rp-av-lg{width:52px;height:52px;border-radius:50%;color:#fff;display:grid;place-items:center;font-size:22px;font-weight:800;flex-shrink:0}
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
  isEnglish = false,
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
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [stats, setStats] = useState<{ referrals: number; months: number; code: string } | null>(null);
  // DPDP: marketing sahmati — yahin se chalu/band (wapas lena dene jitna aasaan)
  const [marketing, setMarketing] = useState<boolean | null>(null);
  const [savingMk, setSavingMk] = useState(false);
  // Naam/email database (users/u_{phone}) se — browser me rakha purana session alag naam na dikhaye
  const [fresh, setFresh] = useState<{ name?: string; email?: string } | null>(null);
  const name = fresh?.name || user.name;
  const email = fresh?.email || user.email;

  const initial = (name || 'प').trim().charAt(0).toUpperCase();
  const shortName = name ? (name.length > 10 ? `${name.slice(0, 10)}…` : name) : isEnglish ? 'User' : 'यूज़र';

  useEffect(() => {
    if (!user.phone) return;
    let cancelled = false;
    getDoc(doc(db, 'users', user.uid || `u_${user.phone}`))
      .then((snap) => {
        const d = snap.data();
        if (cancelled || !d) return;
        setFresh({ name: d.name || undefined, email: d.email || undefined });
        // Saved session bhi sahi kar do (agli baar seedha sahi naam)
        for (const key of ['reader_user', 'shok_user']) {
          try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const s = JSON.parse(raw);
            if (s.phone !== user.phone) continue;
            if ((d.name && s.name !== d.name) || (d.email && s.email !== d.email)) {
              localStorage.setItem(key, JSON.stringify({ ...s, name: d.name || s.name, email: d.email || s.email }));
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
      if (e.key !== 'Escape' || loggingOut) return;
      if (confirming) setConfirming(false);
      else setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, confirming, loggingOut]);

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    await onLogout();
    setLoggingOut(false);
    setConfirming(false);
    setOpen(false);
  };

  const t = isEnglish
    ? { title: 'My Profile', mobile: 'Mobile', email: 'Email', refCode: 'Referral Code', refTitle: '🎁 Refer & Earn', referrals: 'Successful referrals', rewards: 'Free e-paper months', viewRewards: 'Refer & share link', logout: 'Logout' }
    : { title: 'मेरी प्रोफ़ाइल', mobile: 'मोबाइल', email: 'ईमेल', refCode: 'रेफरल कोड', refTitle: '🎁 रेफर और कमाएं', referrals: 'सफल रेफरल', rewards: 'फ्री ई-पेपर महीने', viewRewards: 'रेफरल कोड व लिंक शेयर करें', logout: 'लॉगआउट' };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: RP_STYLES }} />
      <button type="button" className={`rp-chip${compact ? ' compact' : ''}`} onClick={() => setOpen(true)} aria-label={t.title} aria-haspopup="dialog">
        <span className="rp-av" style={{ background: primaryColor }}>{initial}</span>
        {!compact && <span>{shortName}</span>}
      </button>

      {mounted && open &&
        createPortal(
          <div className="rp-overlay notranslate" translate="no" onClick={() => !loggingOut && (confirming ? setConfirming(false) : setOpen(false))}>
            {!confirming ? (
              <div className="rp-box" role="dialog" aria-modal="true" aria-label={t.title} onClick={(e) => e.stopPropagation()}>
                <div className="rp-head">
                  <span className="rp-av-lg" style={{ background: primaryColor }}>{initial}</span>
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

                <button type="button" className="rp-btn rp-logout" onClick={() => setConfirming(true)}>
                  ⎋ {t.logout}
                </button>
              </div>
            ) : (
              <div className="rp-box rp-confirm" role="alertdialog" aria-modal="true" aria-labelledby="rp-confirm-title" onClick={(e) => e.stopPropagation()}>
                <h3 id="rp-confirm-title">लॉगआउट की पुष्टि</h3>
                <p>क्या आप वाकई अपने खाते से लॉगआउट करना चाहते हैं?</p>
                <div className="rp-confirm-row">
                  <button type="button" className="rp-btn rp-cancel" onClick={() => setConfirming(false)} disabled={loggingOut} autoFocus>
                    रद्द करें
                  </button>
                  <button type="button" className="rp-btn rp-danger" onClick={handleConfirmLogout} disabled={loggingOut}>
                    {loggingOut ? 'लॉगआउट हो रहा है…' : 'हाँ, लॉगआउट करें'}
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
