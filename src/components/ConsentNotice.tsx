'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CONSENT_VERSION, DATA_FIDUCIARY, GRIEVANCE_EMAIL, GRIEVANCE_PHONE, RIGHTS, ROLE_NOTICE, SHARED_WITH, type ConsentRole } from '@/lib/consent';

export interface ConsentValue {
  agree: boolean; // zaroori kaamon ke liye sahmati
  age: boolean; // 18+ ghoshna
  marketing: boolean; // vaikalpik
}

export const EMPTY_CONSENT: ConsentValue = { agree: false, age: false, marketing: false };

/** Form submit se pehle jaanch — galti ho toh Hindi sandesh */
export function consentError(v: ConsentValue, mode: 'signup' | 'login') {
  if (!v.agree) return 'आगे बढ़ने के लिए कृपया गोपनीयता सूचना पढ़कर सहमति दें (checkbox चुनें)।';
  if (mode === 'signup' && !v.age) return 'कृपया पुष्टि करें कि आपकी आयु 18 वर्ष या उससे अधिक है।';
  return '';
}

const CSS = `
.cn{border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;font-size:13px;color:#334155}
.cn-head{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 12px}
.cn-head b{font-size:13.5px;color:#0f172a}
.cn-toggle{background:none;border:0;color:var(--cn-brand);font-weight:700;font-size:12.5px;cursor:pointer;font-family:inherit;padding:0;white-space:nowrap}
.cn-body{border-top:1px solid #e2e8f0;padding:10px 12px;max-height:280px;overflow-y:auto;line-height:1.6}
.cn-body h4{font-size:12.5px;margin:10px 0 3px;color:#0f172a}
.cn-body h4:first-child{margin-top:0}
.cn-body ul{margin:0;padding-left:18px}
.cn-body li{margin:1px 0}
.cn-chk{display:flex;gap:9px;align-items:flex-start;padding:8px 12px;border-top:1px solid #e2e8f0;cursor:pointer;line-height:1.5}
.cn-chk input{margin-top:3px;width:16px;height:16px;flex-shrink:0;accent-color:var(--cn-brand)}
.cn-req{color:#dc2626;font-weight:700}
.cn-ver{font-size:11px;color:#94a3b8;padding:0 12px 8px}
`;

export default function ConsentNotice({
  role,
  mode,
  value,
  onChange,
  brandColor = '#ea580c'
}: {
  role: ConsentRole;
  mode: 'signup' | 'login';
  value: ConsentValue;
  onChange: (v: ConsentValue) => void;
  brandColor?: string;
}) {
  const [open, setOpen] = useState(mode === 'signup');
  const n = ROLE_NOTICE[role];
  const set = (k: keyof ConsentValue, v: boolean) => onChange({ ...value, [k]: v });

  return (
    <div className="cn" style={{ ['--cn-brand' as any]: brandColor }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cn-head">
        <b>🔒 आपकी गोपनीयता — डेटा उपयोग एवं सहमति</b>
        <button type="button" className="cn-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? 'छोटा करें ▲' : 'पूरी जानकारी पढ़ें ▼'}
        </button>
      </div>

      {open && (
        <div className="cn-body" tabIndex={0} aria-label="गोपनीयता सूचना">
          <p style={{ margin: 0 }}>
            {DATA_FIDUCIARY} ({n.title}) आपका व्यक्तिगत डेटा केवल नीचे बताए कामों के लिए, आपकी सहमति से इस्तेमाल करता है।
          </p>
          <h4>📋 हम कौन सा डेटा लेते हैं</h4>
          <ul>
            {n.data.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          <h4>🎯 किस काम के लिए</h4>
          <ul>
            {n.purposes.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          {n.publicInfo && (
            <>
              <h4>👁️ सार्वजनिक रूप से क्या दिखेगा</h4>
              <p style={{ margin: 0 }}>{n.publicInfo}</p>
            </>
          )}
          <h4>🤝 किसके साथ साझा (सिर्फ सेवा चलाने के लिए)</h4>
          <ul>
            {SHARED_WITH.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          <p style={{ margin: '4px 0 0' }}>हम आपका डेटा बेचते नहीं हैं।</p>
          <h4>⏳ कितने समय तक</h4>
          <p style={{ margin: 0 }}>{n.retention}</p>
          <h4>⚖️ आपके अधिकार</h4>
          <ul>
            {RIGHTS.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          <h4>↩️ सहमति वापस लेना / खाता हटाना</h4>
          <p style={{ margin: 0 }}>
            कभी भी{' '}
            <Link href="/delete-account" target="_blank" style={{ color: brandColor, fontWeight: 600 }}>
              खाता हटाएं पेज
            </Link>{' '}
            से या {GRIEVANCE_EMAIL} पर ईमेल करके। सहमति वापस लेने से पहले हुए उपयोग पर असर नहीं पड़ता; ज़रूरी सहमति वापस लेने पर खाता बंद हो जाएगा।
          </p>
          <h4>📞 शिकायत अधिकारी</h4>
          <p style={{ margin: 0 }}>
            {GRIEVANCE_EMAIL} · {GRIEVANCE_PHONE} ·{' '}
            <Link href="/grievance" target="_blank" style={{ color: brandColor }}>
              शिकायत निवारण
            </Link>{' '}
            ·{' '}
            <Link href="/privacy-policy" target="_blank" style={{ color: brandColor }}>
              पूरी गोपनीयता नीति
            </Link>
          </p>
        </div>
      )}

      <label className="cn-chk">
        <input type="checkbox" checked={value.agree} onChange={(e) => set('agree', e.target.checked)} />
        <span>
          <span className="cn-req">* </span>
          मैंने गोपनीयता सूचना पढ़ लिया है और ऊपर बताए कामों के लिए अपने व्यक्तिगत डेटा के उपयोग की सहमति देता/देती हूँ।
        </span>
      </label>
      {mode === 'signup' && (
        <>
          <label className="cn-chk">
            <input type="checkbox" checked={value.age} onChange={(e) => set('age', e.target.checked)} />
            <span>
              <span className="cn-req">* </span>
              मैं पुष्टि करता/करती हूँ कि मेरी आयु 18 वर्ष या उससे अधिक है।
            </span>
          </label>
          <label className="cn-chk">
            <input type="checkbox" checked={value.marketing} onChange={(e) => set('marketing', e.target.checked)} />
            <span>(वैकल्पिक) मुझे ऑफ़र, नई सेवाओं और प्रचार की सूचनाएं SMS/WhatsApp/ईमेल से भेजी जा सकती हैं।</span>
          </label>
        </>
      )}
      <div className="cn-ver">सूचना संस्करण {CONSENT_VERSION}</div>
    </div>
  );
}
