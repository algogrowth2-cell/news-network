import Link from 'next/link';
import PublicPageHeader from '@/components/PublicPageHeader';
import { AdLayout, AdInline } from '@/components/SiteAds';
import { fallbackFor, getActivePortal } from '@/lib/siteTheme';

export const metadata = { title: 'विज्ञापन दें — अपना व्यापार बढ़ाएं' };

const BENEFITS = [
  { icon: '📈', h: 'व्यापार तेज़ी से बढ़ाएं', p: 'हज़ारों पाठकों तक सीधे पहुँचें और अपने ग्राहक बढ़ाएं — स्थानीय से लेकर पूरे राज्य तक।' },
  { icon: '🎯', h: 'सही लोगों तक मार्केटिंग', p: 'अपने शहर/राज्य और श्रेणी के अनुसार विज्ञापन दिखाएं — जहाँ आपके ग्राहक हैं वहीं पहुँचें।' },
  { icon: '🌐', h: '8 न्यूज़ पोर्टल का नेटवर्क', p: 'एक ही जगह से हमारे पूरे नेटवर्क पर विज्ञापन — ज़्यादा लोग, ज़्यादा पहचान।' },
  { icon: '💰', h: 'किफ़ायती और लचीले प्लान', p: 'छोटे दुकानदार से बड़े ब्रांड तक — हर बजट के लिए विकल्प। आप तय करें कहाँ और कितना।' },
  { icon: '📊', h: 'लाइव रिपोर्ट', p: 'आपका विज्ञापन कितनी बार दिखा और कितने लोगों ने क्लिक किया — सब अपने डैशबोर्ड में देखें।' },
  { icon: '🏷️', h: 'ब्रांड की पहचान', p: 'लगातार दिखने से लोगों के मन में आपके ब्रांड का भरोसा और पहचान बनती है।' }
];

const CSS = `
.pp{min-height:100vh;background:#f4f6f9;font-family:system-ui,-apple-system,'Noto Sans Devanagari',sans-serif;color:#0f172a}
.pp-hero{position:relative;overflow:hidden;color:#fff;padding:48px 16px 56px}
.pp-hero::after{content:'';position:absolute;inset:0;background-image:radial-gradient(circle at 85% 20%,rgba(255,255,255,.18),transparent 40%),radial-gradient(circle at 10% 90%,rgba(0,0,0,.18),transparent 45%);pointer-events:none}
.pp-hero-in{max-width:1380px;margin:0 auto;position:relative;z-index:1}
.pp-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.28);border-radius:30px;padding:7px 16px;font-size:13px;font-weight:700}
.pp-h1{font-size:clamp(27px,4.4vw,42px);font-weight:900;margin:16px 0 12px;letter-spacing:-.5px;line-height:1.1}
.pp-lead{font-size:clamp(14.5px,1.7vw,17px);max-width:720px;line-height:1.65;opacity:.97;margin:0}
.pp-trust{display:flex;flex-wrap:wrap;gap:10px;margin-top:24px}
.pp-trust span{background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.26);border-radius:30px;padding:8px 15px;font-size:12.5px;font-weight:600;display:inline-flex;gap:7px;align-items:center}
.pp-sec{font-size:13px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:#94a3b8;margin:4px 0 14px}
.pp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(228px,1fr));gap:16px}
.pp-card{background:#fff;border:1px solid #eceff3;border-radius:16px;padding:22px;transition:transform .18s,box-shadow .18s,border-color .18s}
.pp-card:hover{transform:translateY(-4px);box-shadow:0 14px 32px rgba(2,6,23,.10)}
.pp-ic{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:25px}
.pp-card h3{margin:14px 0 7px;font-size:16.5px;color:#111827;font-weight:800}
.pp-card p{margin:0;font-size:13.5px;color:#64748b;line-height:1.65}
.pp-cta{border-radius:22px;padding:38px 24px;text-align:center;color:#fff;position:relative;overflow:hidden;margin-top:26px}
.pp-cta::after{content:'';position:absolute;inset:0;background-image:radial-gradient(circle at 80% 10%,rgba(255,255,255,.16),transparent 45%);pointer-events:none}
.pp-cta-in{position:relative;z-index:1}
.pp-cta h2{margin:0 0 8px;font-size:clamp(20px,2.6vw,26px);font-weight:900}
.pp-cta p{margin:0 0 20px;font-size:14.5px;opacity:.95}
.pp-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.pp-btn{display:inline-flex;align-items:center;gap:8px;padding:14px 30px;border-radius:12px;font-weight:800;font-size:15px;text-decoration:none;transition:transform .15s,box-shadow .15s}
.pp-btn:hover{transform:translateY(-2px)}
.pp-btn.solid{background:#fff;box-shadow:0 8px 22px rgba(0,0,0,.18)}
.pp-btn.ghost{background:rgba(255,255,255,.12);color:#fff;border:1.5px solid rgba(255,255,255,.7)}
.pp-back{display:block;text-align:center;margin:22px 0 4px;color:#64748b;font-size:13.5px;text-decoration:none}
@media(max-width:560px){.pp-hero{padding:34px 16px 42px}}
`;

export default async function AdvertiserIntro({ searchParams }: { searchParams: Promise<{ site?: string }> }) {
  const { site } = await searchParams;
  const slug = getActivePortal(site);
  const theme = fallbackFor(slug);
  const c = theme.primaryColor || '#1d4ed8';
  const q = `?site=${encodeURIComponent(slug)}`;

  return (
    <div className="pp">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <PublicPageHeader slug={slug} />

      <section className="pp-hero" style={{ background: c, backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,.08), rgba(0,0,0,.34))' }}>
        <div className="pp-hero-in">
          <span className="pp-badge">📢 विज्ञापन पोर्टल</span>
          <h1 className="pp-h1">अपना व्यापार हमारे साथ बढ़ाएं</h1>
          <p className="pp-lead">
            हमारे न्यूज़ नेटवर्क पर रोज़ हज़ारों लोग खबरें पढ़ते हैं। अपने व्यापार, दुकान या सेवा का विज्ञापन
            यहाँ देकर सीधे उन तक पहुँचें। नीचे जानिए विज्ञापन देने से आपको क्या-क्या फ़ायदा होगा।
          </p>
          <div className="pp-trust">
            <span>📈 ज़्यादा ग्राहक</span>
            <span>🎯 टार्गेटेड पहुँच</span>
            <span>💰 हर बजट के प्लान</span>
            <span>📊 लाइव रिपोर्ट</span>
          </div>
        </div>
      </section>

      <AdLayout slug={slug} color={c}>
        <div style={{ padding: '22px 0 4px' }}>
          <div className="pp-sec">विज्ञापन देने के फ़ायदे</div>
          <div className="pp-grid">
            {BENEFITS.map((b) => (
              <div key={b.h} className="pp-card">
                <div className="pp-ic" style={{ background: c + '18', color: c }}>{b.icon}</div>
                <h3>{b.h}</h3>
                <p>{b.p}</p>
              </div>
            ))}
          </div>

          <div style={{ margin: '22px 0' }}>
            <AdInline slug={slug} index={0} />
          </div>

          <div className="pp-cta" style={{ background: c, backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,.1), rgba(0,0,0,.3))' }}>
            <div className="pp-cta-in">
              <h2>अभी शुरू करें</h2>
              <p>पहले से खाता है तो लॉगिन करें, या नया विज्ञापनदाता खाता बनाएं। (मोबाइल OTP से सुरक्षित)</p>
              <div className="pp-btns">
                <Link href={`/advertiser/login${q}`} className="pp-btn solid" style={{ color: c }}>लॉगिन करें</Link>
                <Link href={`/advertiser/signup${q}`} className="pp-btn ghost">नया खाता बनाएं</Link>
              </div>
            </div>
          </div>

          <Link href={`/${q}`} className="pp-back">← होम पर वापस जाएं</Link>
        </div>
      </AdLayout>
    </div>
  );
}
