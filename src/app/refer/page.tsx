'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { activatePendingReward, ensureReferralCode, REFERRAL_REWARD_MONTHS } from '@/lib/referralService';

interface ReaderSession {
  uid?: string;
  name?: string;
  email?: string;
  phone?: string;
}

interface ReferralEntry {
  id: string;
  name: string;
  phone: string;
  joinedAt: Date | null;
  rewardStatus: 'granted' | 'pending_selection' | 'claimed' | 'none';
  validTill: Date | null;
}

const BRAND = '#ea580c';
const toDate = (v: any): Date | null => (v?.toDate ? v.toDate() : v ? new Date(v) : null);
const fmtDate = (d: Date | null) => (d ? d.toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—');
// Doosre user ka pura number referrer ko nahi dikhta
const maskPhone = (p: string) => (p.length === 10 ? `${p.slice(0, 2)}XXXXXX${p.slice(-2)}` : p);

const RF_CSS = `
.rf{min-height:100vh;background:#f6f4f0;font-family:'Noto Sans Devanagari',system-ui,sans-serif;color:#1c1917}
.rf-top{position:sticky;top:0;z-index:5;background:#fff;border-bottom:1px solid #ebe7e0;display:flex;align-items:center;gap:12px;padding:12px 16px}
.rf-top a{color:#57534e;text-decoration:none;font-size:14px;font-weight:600}
.rf-top b{font-size:15px}
.rf-wrap{max-width:960px;margin:0 auto;padding:20px 16px 48px;display:grid;gap:18px}
.rf-hero{position:relative;overflow:hidden;border-radius:20px;padding:28px 24px;color:#fff;background:linear-gradient(135deg,#ea580c 0%,#c2410c 55%,#7c2d12 100%)}
.rf-hero::after{content:'';position:absolute;right:-60px;top:-60px;width:220px;height:220px;border-radius:50%;background:rgba(255,255,255,.08)}
.rf-hero-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.18);border-radius:99px;padding:5px 12px;font-size:12.5px;font-weight:700}
.rf-hero h1{margin:12px 0 8px;font-size:28px;line-height:1.35;font-weight:800}
.rf-hero p{margin:0;max-width:560px;font-size:14.5px;line-height:1.7;opacity:.95}
.rf-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.rf-stat{background:#fff;border:1px solid #ebe7e0;border-radius:16px;padding:16px}
.rf-stat-label{font-size:12.5px;color:#78716c;font-weight:600}
.rf-stat-value{margin-top:6px;font-size:26px;font-weight:800;line-height:1.3}
.rf-stat-sub{font-size:12px;color:#78716c;margin-top:2px}
.rf-card{background:#fff;border:1px solid #ebe7e0;border-radius:18px;padding:20px}
.rf-card h2{margin:0 0 14px;font-size:17px;font-weight:800;line-height:1.4}
.rf-share{display:grid;grid-template-columns:1fr 1.4fr;gap:16px}
.rf-label{font-size:12.5px;font-weight:700;color:#57534e;margin-bottom:6px}
.rf-code{display:flex;align-items:center;justify-content:space-between;gap:10px;border:2px dashed #fdba74;background:#fff7ed;border-radius:14px;padding:12px 14px}
.rf-code-text{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:24px;font-weight:800;letter-spacing:3px;color:#9a3412}
.rf-link{display:flex;gap:8px}
.rf-link input{flex:1;min-width:0;border:1.5px solid #e7e5e4;border-radius:12px;padding:12px;font-size:13px;color:#44403c;background:#fafaf9;font-family:inherit}
.rf-btn{border:0;border-radius:12px;padding:11px 16px;font-size:13.5px;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap;background:${BRAND};color:#fff}
.rf-btn.ok{background:#16a34a}
.rf-btn.ghost{background:#fff;color:${BRAND};border:1.5px solid #fed7aa}
.rf-btn:disabled{opacity:.6;cursor:not-allowed}
.rf-btn:focus-visible{outline:3px solid #fdba74;outline-offset:2px}
.rf-socials{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.rf-social{display:inline-flex;align-items:center;gap:7px;border-radius:10px;padding:9px 14px;font-size:13px;font-weight:700;color:#fff;text-decoration:none;border:0;cursor:pointer;font-family:inherit}
.rf-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.rf-step{background:#fafaf9;border:1px solid #f0ece6;border-radius:14px;padding:16px}
.rf-step-num{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:#ffedd5;color:#9a3412;font-weight:800;margin-bottom:10px}
.rf-step b{display:block;font-size:14.5px;margin-bottom:4px}
.rf-step span{font-size:13px;color:#57534e;line-height:1.6}
.rf-list{display:grid;gap:10px}
.rf-item{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #f0ece6;border-radius:14px;padding:12px 14px;flex-wrap:wrap}
.rf-avatar{width:38px;height:38px;border-radius:50%;background:#ffedd5;color:#9a3412;display:grid;place-items:center;font-weight:800;flex-shrink:0}
.rf-item-main{display:flex;align-items:center;gap:12px;min-width:0}
.rf-item-name{font-weight:700;font-size:14px}
.rf-item-sub{font-size:12px;color:#78716c;margin-top:2px}
.rf-pill{display:inline-block;border-radius:99px;padding:5px 11px;font-size:12px;font-weight:700;white-space:nowrap}
.rf-empty{text-align:center;padding:26px 12px;color:#78716c;font-size:13.5px;line-height:1.7;background:#fafaf9;border:1px dashed #e7e5e4;border-radius:14px}
.rf-terms{margin:0;padding-left:18px;font-size:13px;color:#57534e;line-height:1.9}
.rf-login{max-width:460px;margin:40px auto;text-align:center}
.rf-msg{border-radius:12px;padding:11px 14px;font-size:13.5px;font-weight:600}
@media(max-width:760px){
  .rf-share{grid-template-columns:1fr}
  .rf-steps{grid-template-columns:1fr}
  .rf-hero h1{font-size:22px}
}
@media(max-width:520px){
  .rf-stats{grid-template-columns:1fr 1fr}
  .rf-stats .rf-stat:last-child{grid-column:span 2}
  .rf-stat-value{font-size:22px}
  .rf-code-text{font-size:20px;letter-spacing:2px}
  .rf-link{flex-direction:column}
}
`;

export default function ReferPage() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<ReaderSession | null>(null);
  const [profile, setProfile] = useState<{ name: string; email: string; count: number; months: number } | null>(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [entries, setEntries] = useState<ReferralEntry[]>([]);
  const [rewardsMap, setRewardsMap] = useState<Map<string, { status: string; validTill: Date | null }>>(new Map());
  const [epaperTill, setEpaperTill] = useState<Date | null>(null);
  const [copied, setCopied] = useState<'code' | 'link' | ''>('');
  const [activating, setActivating] = useState('');
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const [origin, setOrigin] = useState('');

  const phone = session?.phone || '';
  const userId = session?.uid || (phone ? `u_${phone}` : '');

  useEffect(() => {
    setOrigin(window.location.origin);
    try {
      const raw = localStorage.getItem('reader_user');
      if (raw) setSession(JSON.parse(raw));
    } catch {
      /* session na mile toh login card */
    }
    setReady(true);
  }, []);

  // Profile + apna referral code (purane users ka code pehli baar yahin banta hai)
  useEffect(() => {
    if (!phone) return;
    let cancelled = false;
    getDoc(doc(db, 'users', userId))
      .then(async (snap) => {
        const d = snap.data() || {};
        if (cancelled) return;
        setProfile({
          name: d.name || session?.name || 'पाठक',
          email: d.email || session?.email || `${phone}@news.local`,
          count: Number(d.successfulReferralsCount || 0),
          months: Number(d.referralRewardMonths || 0)
        });
        const c = d.referralCode || (await ensureReferralCode(userId, phone));
        if (!cancelled) setCode(c);
      })
      .catch((err) => {
        console.error('Referral profile load error:', err);
        if (!cancelled) setCodeError('रेफरल कोड लोड नहीं हो पाया। कृपया पेज रीफ़्रेश करें।');
      });
    return () => {
      cancelled = true;
    };
  }, [phone, userId, session?.name, session?.email]);

  // Mere referrals + rewards (live)
  useEffect(() => {
    if (!phone) return;
    const unsubReferrals = onSnapshot(query(collection(db, 'referrals'), where('referrerPhone', '==', phone)), (snap) => {
      setEntries(
        snap.docs
          .map((d) => {
            const x = d.data();
            return {
              id: d.id,
              name: x.referredUserName || 'पाठक',
              phone: x.referredUserPhone || '',
              joinedAt: toDate(x.completedAt || x.createdAt) || new Date(),
              rewardStatus: x.rewardStatus || 'none',
              validTill: toDate(x.rewardValidTill)
            } as ReferralEntry;
          })
          .sort((a, b) => (b.joinedAt?.getTime() || 0) - (a.joinedAt?.getTime() || 0))
      );
    });
    const unsubRewards = onSnapshot(query(collection(db, 'referral_rewards'), where('referrerPhone', '==', phone)), (snap) => {
      const m = new Map<string, { status: string; validTill: Date | null }>();
      snap.docs.forEach((d) => m.set(d.id, { status: d.data().status, validTill: toDate(d.data().validTill) }));
      setRewardsMap(m);
    });
    return () => {
      unsubReferrals();
      unsubRewards();
    };
  }, [phone]);

  // E-paper kab tak free/active hai
  useEffect(() => {
    if (!profile?.email) return;
    return onSnapshot(doc(db, 'epaper_subscriptions', profile.email), (snap) => {
      const d = snap.data();
      const exp = d?.status === 'active' ? toDate(d.expiresAt) : null;
      setEpaperTill(exp && exp.getTime() > Date.now() ? exp : null);
    });
  }, [profile?.email]);

  const referralLink = code && origin ? `${origin}/login?ref=${code}` : '';
  const shareText = code
    ? `📰 मैं Golden Pearl News पर ताज़ा खबरें और ई-पेपर पढ़ता/पढ़ती हूँ। आप भी जुड़ें!\n\n🎁 मेरा रेफरल कोड: *${code}*\nइस लिंक से मुफ़्त साइन अप करें:\n${referralLink}`
    : '';

  const pendingIds = useMemo(
    () => Array.from(rewardsMap.entries()).filter(([, r]) => r.status === 'pending_selection').map(([id]) => id),
    [rewardsMap]
  );
  const successCount = Math.max(profile?.count || 0, entries.length);
  const monthsEarned = Math.max(
    profile?.months || 0,
    Array.from(rewardsMap.values()).filter((r) => r.status === 'granted' || r.status === 'claimed').length * REFERRAL_REWARD_MONTHS
  );

  const copy = async (what: 'code' | 'link') => {
    const value = what === 'code' ? code : referralLink;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      window.prompt('कॉपी करें:', value);
    }
    setCopied(what);
    setTimeout(() => setCopied(''), 2200);
  };

  const nativeShare = async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'Golden Pearl News — रेफरल', text: shareText.replace(referralLink, '').trim(), url: referralLink });
        return;
      } catch {
        /* user ne cancel kiya */
        return;
      }
    }
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
  };

  const handleActivate = async (rewardId: string) => {
    if (!profile || !phone) return;
    setActivating(rewardId);
    setNotice(null);
    try {
      const till = await activatePendingReward(rewardId, { userId, phone, email: profile.email, name: profile.name });
      setNotice(till ? { text: `🎉 3 महीने का फ्री ई-पेपर सक्रिय हो गया — ${fmtDate(till)} तक।`, ok: true } : { text: 'यह रिवार्ड पहले ही सक्रिय हो चुका है।', ok: true });
    } catch (err: any) {
      console.error(err);
      setNotice({ text: 'रिवार्ड सक्रिय नहीं हो पाया, कृपया पुनः प्रयास करें।', ok: false });
    } finally {
      setActivating('');
    }
  };

  const enc = encodeURIComponent;

  return (
    <div className="rf">
      <style dangerouslySetInnerHTML={{ __html: RF_CSS }} />
      <header className="rf-top">
        <Link href="/">← होम</Link>
        <b>🎁 रेफर करें और कमाएं</b>
      </header>

      {!ready ? null : !phone ? (
        <div className="rf-wrap">
          <div className="rf-card rf-login">
            <div style={{ fontSize: '40px' }}>🎁</div>
            <h2 style={{ marginTop: '8px' }}>रेफर करें, 3 महीने ई-पेपर फ्री पाएं</h2>
            <p style={{ fontSize: '14px', color: '#57534e', lineHeight: 1.7, margin: '0 0 18px' }}>
              अपना रेफरल कोड और लिंक पाने के लिए पहले लॉगिन करें। हर सफल रेफरल पर आपको {REFERRAL_REWARD_MONTHS} महीने का ई-पेपर बिल्कुल मुफ़्त मिलेगा।
            </p>
            <Link href="/login?redirect=/refer" className="rf-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
              लॉगिन / साइन अप करें
            </Link>
          </div>
        </div>
      ) : (
        <main className="rf-wrap">
          {/* Hero */}
          <section className="rf-hero">
            <span className="rf-hero-badge">🎁 Refer &amp; Earn</span>
            <h1>दोस्तों को जोड़ें, हर सफल रेफरल पर {REFERRAL_REWARD_MONTHS} महीने का ई-पेपर फ्री</h1>
            <p>
              नमस्ते {profile?.name || session?.name || 'पाठक'} जी! अपना कोड या लिंक शेयर करें। जैसे ही कोई नया पाठक आपके कोड से साइन अप करेगा, आपका {REFERRAL_REWARD_MONTHS} महीने का
              फ्री ई-पेपर अपने-आप सक्रिय हो जाएगा — जितने ज़्यादा रेफरल, उतने ज़्यादा महीने।
            </p>
          </section>

          {/* Stats */}
          <section className="rf-stats" aria-label="आपकी रेफरल जानकारी">
            <div className="rf-stat">
              <div className="rf-stat-label">सफल रेफरल</div>
              <div className="rf-stat-value" style={{ color: BRAND }}>{successCount}</div>
              <div className="rf-stat-sub">नए पाठक जुड़े</div>
            </div>
            <div className="rf-stat">
              <div className="rf-stat-label">कमाए गए फ्री महीने</div>
              <div className="rf-stat-value" style={{ color: '#16a34a' }}>{monthsEarned}</div>
              <div className="rf-stat-sub">ई-पेपर ऐक्सेस</div>
            </div>
            <div className="rf-stat">
              <div className="rf-stat-label">ई-पेपर ऐक्सेस</div>
              <div className="rf-stat-value" style={{ fontSize: epaperTill ? '17px' : '20px', color: epaperTill ? '#16a34a' : '#a8a29e' }}>
                {epaperTill ? `✓ ${fmtDate(epaperTill)} तक` : 'अभी सक्रिय नहीं'}
              </div>
              {epaperTill && (
                <Link href="/epaper" style={{ fontSize: '12.5px', color: BRAND, fontWeight: 700, textDecoration: 'none' }}>
                  ई-पेपर पढ़ें →
                </Link>
              )}
            </div>
          </section>

          {notice && (
            <div className="rf-msg" style={{ background: notice.ok ? '#f0fdf4' : '#fef2f2', color: notice.ok ? '#166534' : '#b91c1c', border: `1px solid ${notice.ok ? '#bbf7d0' : '#fecaca'}` }}>
              {notice.text}
            </div>
          )}

          {/* Pending purane rewards */}
          {pendingIds.length > 0 && (
            <section className="rf-card" style={{ borderColor: '#fed7aa', background: '#fffbf5' }}>
              <h2>🎉 आपके {pendingIds.length} रिवार्ड सक्रिय होने बाकी हैं</h2>
              <div className="rf-list">
                {pendingIds.map((id) => (
                  <div key={id} className="rf-item">
                    <div className="rf-item-sub" style={{ fontSize: '13.5px', color: '#44403c' }}>
                      सफल रेफरल: {maskPhone(id.split('_')[1] || '')} — {REFERRAL_REWARD_MONTHS} महीने का फ्री ई-पेपर
                    </div>
                    <button className="rf-btn" disabled={!!activating} onClick={() => handleActivate(id)}>
                      {activating === id ? 'सक्रिय हो रहा है…' : 'अभी सक्रिय करें'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Share: code + link */}
          <section className="rf-card">
            <h2>अपना कोड या लिंक शेयर करें</h2>
            {codeError ? (
              <div className="rf-msg" style={{ background: '#fef2f2', color: '#b91c1c' }}>{codeError}</div>
            ) : (
              <>
                <div className="rf-share">
                  <div>
                    <div className="rf-label">आपका रेफरल कोड</div>
                    <div className="rf-code">
                      <span className="rf-code-text">{code || '••••••••'}</span>
                      <button className={`rf-btn ${copied === 'code' ? 'ok' : 'ghost'}`} onClick={() => copy('code')} disabled={!code}>
                        {copied === 'code' ? '✓ कॉपी हुआ' : 'कॉपी'}
                      </button>
                    </div>
                    <div className="rf-item-sub" style={{ marginTop: '6px' }}>दोस्त साइन अप करते समय “रेफरल कोड” में ये कोड डालें</div>
                  </div>
                  <div>
                    <div className="rf-label">आपका रेफरल लिंक</div>
                    <div className="rf-link">
                      <input readOnly value={referralLink || 'लोड हो रहा है…'} aria-label="रेफरल लिंक" onFocus={(e) => e.target.select()} />
                      <button className={`rf-btn ${copied === 'link' ? 'ok' : ''}`} onClick={() => copy('link')} disabled={!referralLink}>
                        {copied === 'link' ? '✓ कॉपी हुआ' : 'लिंक कॉपी करें'}
                      </button>
                    </div>
                    <div className="rf-item-sub" style={{ marginTop: '6px' }}>लिंक खोलते ही आपका कोड अपने-आप भर जाएगा</div>
                  </div>
                </div>

                {code && (
                  <div className="rf-socials">
                    <a className="rf-social" style={{ background: '#25D366' }} href={`https://api.whatsapp.com/send?text=${enc(shareText)}`} target="_blank" rel="noopener noreferrer">
                      WhatsApp
                    </a>
                    <a className="rf-social" style={{ background: '#1877F2' }} href={`https://www.facebook.com/sharer/sharer.php?u=${enc(referralLink)}`} target="_blank" rel="noopener noreferrer">
                      Facebook
                    </a>
                    <a className="rf-social" style={{ background: '#229ED9' }} href={`https://t.me/share/url?url=${enc(referralLink)}&text=${enc(shareText.replace(referralLink, '').trim())}`} target="_blank" rel="noopener noreferrer">
                      Telegram
                    </a>
                    <a className="rf-social" style={{ background: '#000' }} href={`https://twitter.com/intent/tweet?text=${enc(`🎁 मेरा रेफरल कोड: ${code}`)}&url=${enc(referralLink)}`} target="_blank" rel="noopener noreferrer">
                      X
                    </a>
                    <a className="rf-social" style={{ background: '#475569' }} href={`sms:?body=${enc(shareText)}`}>
                      SMS
                    </a>
                    <button type="button" className="rf-social" style={{ background: BRAND }} onClick={nativeShare}>
                      ↗ और विकल्प
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* How it works */}
          <section className="rf-card">
            <h2>कैसे काम करता है?</h2>
            <div className="rf-steps">
              <div className="rf-step">
                <div className="rf-step-num">1</div>
                <b>कोड / लिंक शेयर करें</b>
                <span>WhatsApp, Facebook या SMS से अपना रेफरल कोड या लिंक दोस्तों और परिवार को भेजें।</span>
              </div>
              <div className="rf-step">
                <div className="rf-step-num">2</div>
                <b>दोस्त साइन अप करें</b>
                <span>दोस्त आपके लिंक से या साइन अप के समय आपका कोड डालकर, अपने मोबाइल OTP से नया खाता बनाएं।</span>
              </div>
              <div className="rf-step">
                <div className="rf-step-num">3</div>
                <b>{REFERRAL_REWARD_MONTHS} महीने ई-पेपर फ्री</b>
                <span>साइन अप होते ही रेफरल अपने-आप सत्यापित होता है और आपका फ्री ई-पेपर तुरंत सक्रिय हो जाता है।</span>
              </div>
            </div>
          </section>

          {/* History */}
          <section className="rf-card">
            <h2>मेरे रेफरल ({entries.length})</h2>
            {entries.length === 0 ? (
              <div className="rf-empty">
                अभी तक कोई रेफरल नहीं। अपना कोड शेयर करें — पहला दोस्त जुड़ते ही आपको {REFERRAL_REWARD_MONTHS} महीने का फ्री ई-पेपर मिलेगा! 🎁
              </div>
            ) : (
              <div className="rf-list">
                {entries.map((e) => {
                  const reward = rewardsMap.get(e.id);
                  const status = reward?.status || e.rewardStatus;
                  const till = reward?.validTill || e.validTill;
                  const granted = status === 'granted' || status === 'claimed';
                  return (
                    <div key={e.id} className="rf-item">
                      <div className="rf-item-main">
                        <div className="rf-avatar">{(e.name || 'प').trim().charAt(0).toUpperCase()}</div>
                        <div style={{ minWidth: 0 }}>
                          <div className="rf-item-name">{e.name}</div>
                          <div className="rf-item-sub">
                            {maskPhone(e.phone)} · {fmtDate(e.joinedAt)} को जुड़े
                          </div>
                        </div>
                      </div>
                      {granted ? (
                        <span className="rf-pill" style={{ background: '#dcfce7', color: '#166534' }}>
                          ✓ +{REFERRAL_REWARD_MONTHS} माह ई-पेपर{till ? ` · ${fmtDate(till)} तक` : ''}
                        </span>
                      ) : status === 'pending_selection' ? (
                        <span className="rf-pill" style={{ background: '#ffedd5', color: '#9a3412' }}>सक्रिय करना बाकी</span>
                      ) : (
                        <span className="rf-pill" style={{ background: '#f5f5f4', color: '#57534e' }}>✓ सफल रेफरल</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Terms */}
          <section className="rf-card">
            <h2>नियम व शर्तें</h2>
            <ul className="rf-terms">
              <li>रेफरल तभी सफल माना जाएगा जब नया पाठक पहली बार अपने मोबाइल नंबर (OTP) से खाता बनाए।</li>
              <li>अपने ही नंबर से खुद को रेफर करना, या पहले से पंजीकृत नंबर, मान्य नहीं है।</li>
              <li>हर सफल रेफरल पर {REFERRAL_REWARD_MONTHS} महीने (90 दिन) का ई-पेपर फ्री मिलता है; पहले से सक्रिय ई-पेपर हो तो उसकी अवधि आगे बढ़ जाती है।</li>
              <li>फ्री ई-पेपर इसी खाते से लॉगिन करने पर सभी संस्करणों के लिए मान्य है।</li>
            </ul>
          </section>
        </main>
      )}
    </div>
  );
}
