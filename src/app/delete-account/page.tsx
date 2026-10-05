'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { sendOtp, verifyOtp } from '@/lib/otpClient';
import { isValidIndianMobile, VALIDATION_MSG } from '@/lib/validation';
import { ACCOUNT_TYPE_LABEL, DELETION_DAYS, DELETION_EMAIL, type DeletionAccountType } from '@/lib/accountDeletion';
import { getActivePortal, fallbackFor } from '@/lib/siteTheme';

/*
 * Public page — app install kiye bina bhi account/data delete ki request (Google Play "Data safety" ke liye web link).
 * Mobile OTP se pehchaan pakki, phir request admin (Admin → Account Deletion) ke paas.
 */

const CSS = `
.da{min-height:100vh;background:#f4f3f0;color:#1c1917;font-family:"Mukta",'Noto Sans Devanagari',system-ui,sans-serif}
.da-top{background:#fff;border-bottom:1px solid #ebe7e0;padding:12px 16px;display:flex;gap:12px;align-items:center}
.da-top a{color:#57534e;text-decoration:none;font-weight:600;font-size:14px}
.da-wrap{max-width:860px;margin:0 auto;padding:24px 16px 56px;display:grid;gap:18px}
.da-card{background:#fff;border:1px solid #ebe7e0;border-radius:16px;padding:22px}
.da-card h1{font-size:26px;margin:0 0 6px;line-height:1.35}
.da-card h2{font-size:18px;margin:0 0 12px;line-height:1.4}
.da-en{color:#78716c;font-size:13.5px;line-height:1.6;margin:4px 0 0}
.da-card p,.da-card li{font-size:14.5px;line-height:1.75;color:#44403c}
.da-card ul{padding-left:20px;margin:6px 0}
.da-two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:700px){.da-two{grid-template-columns:1fr}}
.da-box{border-radius:12px;padding:14px 16px}
.da-box h3{font-size:15px;margin:0 0 6px}
.da-label{display:block;font-size:13px;font-weight:700;color:#44403c;margin-bottom:6px}
.da-in{width:100%;box-sizing:border-box;border:1.5px solid #d6d3d1;border-radius:10px;padding:11px 12px;font-size:15px;font-family:inherit;background:#fff}
.da-in:focus{outline:none;border-color:var(--da-brand)}
.da-btn{border:0;border-radius:10px;padding:12px 18px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;background:var(--da-brand);color:#fff}
.da-btn.danger{background:#dc2626}
.da-btn:disabled{opacity:.6;cursor:not-allowed}
.da-chk{display:flex;gap:9px;align-items:flex-start;font-size:14px;color:#44403c;cursor:pointer;margin:6px 0}
.da-chk input{margin-top:4px;width:17px;height:17px;accent-color:#dc2626}
.da-err{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;border-radius:10px;padding:10px 12px;font-size:14px}
.da-ok{background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;border-radius:12px;padding:18px;font-size:15px;line-height:1.7}
.da-steps{counter-reset:s;list-style:none;padding:0;margin:0;display:grid;gap:8px}
.da-steps li{counter-increment:s;position:relative;padding-left:36px}
.da-steps li::before{content:counter(s);position:absolute;left:0;top:2px;width:24px;height:24px;border-radius:50%;background:var(--da-brand);color:#fff;font-size:13px;font-weight:700;display:grid;place-items:center}
`;

export default function DeleteAccountPage() {
  // Jis portal se aaye uska naam/rang (server render me default, browser me asli)
  const [portal, setPortal] = useState('the-local-leader');
  useEffect(() => setPortal(getActivePortal(new URLSearchParams(window.location.search).get('site'))), []);
  const brand = fallbackFor(portal).primaryColor;
  const siteName = fallbackFor(portal).name;

  const [phone, setPhone] = useState('');
  const [types, setTypes] = useState<DeletionAccountType[]>(['reader']);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [step, setStep] = useState<'form' | 'otp' | 'done'>('form');
  const [sessionId, setSessionId] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const toggleType = (t: DeletionAccountType) => setTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const requestOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    setInfo('');
    if (!isValidIndianMobile(phone)) return setError(VALIDATION_MSG.mobile);
    if (types.length === 0) return setError('कृपया कम से कम एक खाता प्रकार चुनें।');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setError(VALIDATION_MSG.email);
    if (!confirm) return setError('कृपया पुष्टि करें कि आप अपना खाता स्थायी रूप से हटवाना चाहते हैं।');
    setBusy(true);
    try {
      // Pehle se khula anurodh ho toh dobara OTP nahi
      const existing = await getDoc(doc(db, 'account_deletion_requests', phone));
      if (existing.exists() && existing.data().status === 'pending') {
        const at = existing.data().createdAt?.toDate?.();
        setInfo(`इस नंबर का अनुरोध पहले से दर्ज है${at ? ` (${at.toLocaleDateString('hi-IN')})` : ''}। ${DELETION_DAYS} दिनों के भीतर इसे पूरा कर दिया जाएगा।`);
        setBusy(false);
        return;
      }
      const res = await sendOtp(phone);
      if (res.ok && res.sessionId) {
        setSessionId(res.sessionId);
        setStep('otp');
        setInfo(`+91 ${phone} पर OTP भेजा गया है।`);
      } else setError(res.message);
    } catch (err: any) {
      setError('अनुरोध शुरू नहीं हो पाया, कृपया पुनः प्रयास करें।');
      console.error(err);
    }
    setBusy(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\d{4,6}$/.test(otp.trim())) return setError('कृपया SMS में आया सही OTP डालें।');
    setBusy(true);
    try {
      const v = await verifyOtp(sessionId, otp);
      if (!v.ok) {
        setError(v.message);
        setBusy(false);
        return;
      }
      await setDoc(doc(db, 'account_deletion_requests', phone), {
        phone,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        accountTypes: types,
        reason: reason.trim().slice(0, 500),
        portal,
        verified: true,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setStep('done');
    } catch (err) {
      console.error(err);
      setError('अनुरोध सेव नहीं हो पाया। कृपया पुनः प्रयास करें या ईमेल से अनुरोध भेजें।');
    }
    setBusy(false);
  };

  return (
    <div className="da" style={{ ['--da-brand' as any]: brand }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header className="da-top">
        <Link href={`/?site=${portal}`}>← {siteName}</Link>
      </header>

      <main className="da-wrap">
        <section className="da-card">
          <h1>खाता और डेटा हटाने का अनुरोध</h1>
          <p className="da-en">Account &amp; Data Deletion Request — {siteName} (Golden Pearl News Network) website and app</p>
          <p style={{ marginTop: '12px' }}>
            आप अपना {siteName} / Golden Pearl News खाता (पाठक, पत्रकार या विज्ञापनदाता) और उससे जुड़ा व्यक्तिगत डेटा हटवा सकते हैं — ऐप इंस्टॉल किए बिना भी।
            नीचे फ़ॉर्म भरें या ईमेल भेजें। हम {DELETION_DAYS} दिनों के भीतर अनुरोध पूरा करते हैं।
          </p>
          <p className="da-en">
            You can request deletion of your account and associated personal data without installing the app. Submit the form below (verified by an OTP sent to your registered
            mobile number) or email us. Requests are completed within {DELETION_DAYS} days.
          </p>
        </section>

        <section className="da-card">
          <h2>कैसे हटवाएं / How to request</h2>
          <ol className="da-steps">
            <li>नीचे अपना पंजीकृत मोबाइल नंबर और खाता प्रकार चुनें। <span className="da-en">Enter your registered mobile number and account type.</span></li>
            <li>मोबाइल पर आए OTP से पुष्टि करें (ताकि कोई और आपका खाता न हटवा सके)। <span className="da-en">Verify with the OTP sent to your mobile.</span></li>
            <li>
              {DELETION_DAYS} दिनों में खाता और डेटा हटा दिया जाएगा; पूरा होने पर आपको SMS/ईमेल से सूचना मिलेगी।{' '}
              <span className="da-en">We delete your account and data within {DELETION_DAYS} days and notify you.</span>
            </li>
          </ol>
          <p style={{ marginTop: '14px' }}>
            <b>ईमेल से भी:</b> <a href={`mailto:${DELETION_EMAIL}?subject=${encodeURIComponent('Account Deletion Request')}`} style={{ color: brand, fontWeight: 700 }}>{DELETION_EMAIL}</a> पर
            विषय “Account Deletion Request” के साथ अपना नाम, पंजीकृत मोबाइल नंबर और खाता प्रकार भेजें।
            <span className="da-en"> Or email {DELETION_EMAIL} with subject “Account Deletion Request”, your name, registered mobile number and account type.</span>
          </p>
        </section>

        <section className="da-two">
          <div className="da-box" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
            <h3>🗑️ क्या हटाया जाएगा / Deleted</h3>
            <ul>
              <li>प्रोफ़ाइल: नाम, मोबाइल, ईमेल, शहर, फ़ोटो</li>
              <li>पत्रकार प्रेस आईडी कार्ड की जानकारी</li>
              <li>विज्ञापनदाता प्रोफ़ाइल</li>
              <li>रेफरल कोड और रेफरल इतिहास</li>
              <li>ई-पेपर सब्सक्रिप्शन और आपकी टिप्पणियां</li>
            </ul>
            <p className="da-en">Profile (name, mobile, email, city, photo), press ID details, advertiser profile, referral code &amp; history, e-paper subscription and your comments.</p>
          </div>
          <div className="da-box" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
            <h3>📁 क्या रखा जाएगा / Retained</h3>
            <ul>
              <li>भुगतान/लेन-देन के रिकॉर्ड — कर एवं कानूनी आवश्यकता हेतु अधिकतम 8 वर्ष</li>
              <li>पहले से प्रकाशित खबरें/विज्ञापन (आपका व्यक्तिगत संपर्क हटाकर)</li>
            </ul>
            <p className="da-en">Payment/transaction records are kept for up to 8 years as required by Indian tax law. Already-published news or ads may remain, without your personal contact details.</p>
          </div>
        </section>

        <section className="da-card" aria-live="polite">
          <h2>अनुरोध फ़ॉर्म / Request form</h2>

          {step === 'done' ? (
            <div className="da-ok">
              ✅ <b>आपका अनुरोध दर्ज हो गया है।</b>
              <br />
              मोबाइल +91 {phone} से जुड़ा खाता और डेटा {DELETION_DAYS} दिनों के भीतर हटा दिया जाएगा। पूरा होने पर आपको सूचना मिलेगी।
              <div className="da-en">Your request has been received. Your account and data will be deleted within {DELETION_DAYS} days.</div>
            </div>
          ) : step === 'form' ? (
            <form onSubmit={requestOtp} style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label className="da-label">पंजीकृत मोबाइल नंबर * / Registered mobile</label>
                <input className="da-in" inputMode="numeric" maxLength={10} placeholder="10 अंकों का नंबर" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))} />
              </div>
              <div>
                <span className="da-label">कौन सा खाता हटाना है * / Account type</span>
                {(Object.keys(ACCOUNT_TYPE_LABEL) as DeletionAccountType[]).map((t) => (
                  <label key={t} className="da-chk">
                    <input type="checkbox" checked={types.includes(t)} onChange={() => toggleType(t)} style={{ accentColor: brand }} />
                    {ACCOUNT_TYPE_LABEL[t]}
                  </label>
                ))}
              </div>
              <div className="da-two">
                <div>
                  <label className="da-label">नाम (वैकल्पिक) / Name</label>
                  <input className="da-in" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="da-label">ईमेल (वैकल्पिक, पुष्टि भेजने हेतु) / Email</label>
                  <input className="da-in" type="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value.replace(/\s/g, ''))} />
                </div>
              </div>
              <div>
                <label className="da-label">कारण (वैकल्पिक) / Reason</label>
                <textarea className="da-in" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} style={{ resize: 'vertical' }} />
              </div>
              <label className="da-chk">
                <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
                <span>
                  मैं समझता/समझती हूँ कि खाता और डेटा स्थायी रूप से हटाया जाएगा और वापस नहीं आएगा; सक्रिय ई-पेपर सब्सक्रिप्शन/रेफरल रिवॉर्ड भी समाप्त हो जाएंगे।
                  <span className="da-en"> I understand this is permanent and active subscriptions/rewards will end.</span>
                </span>
              </label>
              {error && <div className="da-err">⚠️ {error}</div>}
              {info && <div className="da-ok" style={{ padding: '10px 12px', fontSize: '14px' }}>{info}</div>}
              <button className="da-btn danger" type="submit" disabled={busy} style={{ justifySelf: 'start' }}>
                {busy ? 'कृपया प्रतीक्षा करें…' : 'OTP भेजें / Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={submit} style={{ display: 'grid', gap: '14px', maxWidth: '360px' }}>
              {info && <div className="da-ok" style={{ padding: '10px 12px', fontSize: '14px' }}>{info}</div>}
              <div>
                <label className="da-label">OTP *</label>
                <input className="da-in" inputMode="numeric" maxLength={6} autoFocus value={otp} onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))} />
              </div>
              {error && <div className="da-err">⚠️ {error}</div>}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button className="da-btn danger" type="submit" disabled={busy}>
                  {busy ? 'जांच हो रही है…' : 'पुष्टि करें और अनुरोध भेजें'}
                </button>
                <button type="button" className="da-btn" style={{ background: '#e7e5e4', color: '#44403c' }} onClick={() => (setStep('form'), setOtp(''), setError(''), setInfo(''))}>
                  बदलें
                </button>
              </div>
            </form>
          )}
        </section>

        <p style={{ fontSize: '13px', color: '#78716c', textAlign: 'center' }}>
          अधिक जानकारी: <Link href="/privacy-policy#deletion" style={{ color: brand }}>गोपनीयता नीति — खाता एवं डेटा हटाना</Link>
        </p>
      </main>
    </div>
  );
}
