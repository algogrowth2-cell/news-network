import Link from 'next/link';

export const metadata = { title: 'विज्ञापन दें — अपना व्यापार बढ़ाएं' };

const BENEFITS = [
  { icon: '📈', h: 'व्यापार तेज़ी से बढ़ाएं', p: 'हज़ारों पाठकों तक सीधे पहुँचें और अपने ग्राहक बढ़ाएं — स्थानीय से लेकर पूरे राज्य तक।' },
  { icon: '🎯', h: 'सही लोगों तक मार्केटिंग', p: 'अपने शहर/राज्य और श्रेणी के अनुसार विज्ञापन दिखाएं — जहाँ आपके ग्राहक हैं वहीं पहुँचें।' },
  { icon: '🌐', h: '8 न्यूज़ पोर्टल का नेटवर्क', p: 'एक ही जगह से हमारे पूरे नेटवर्क पर विज्ञापन — ज़्यादा लोग, ज़्यादा पहचान।' },
  { icon: '💰', h: 'किफ़ायती और लचीले प्लान', p: 'छोटे दुकानदार से बड़े ब्रांड तक — हर बजट के लिए विकल्प। आप तय करें कहाँ और कितना।' },
  { icon: '📊', h: 'लाइव रिपोर्ट', p: 'आपका विज्ञापन कितनी बार दिखा और कितने लोगों ने क्लिक किया — सब अपने डैशबोर्ड में देखें।' },
  { icon: '🏷️', h: 'ब्रांड की पहचान', p: 'लगातार दिखने से लोगों के मन में आपके ब्रांड का भरोसा और पहचान बनती है।' }
];

export default async function AdvertiserIntro({ searchParams }: { searchParams: Promise<{ site?: string }> }) {
  const { site } = await searchParams;
  const q = site ? `?site=${encodeURIComponent(site)}` : '';
  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'system-ui,-apple-system,sans-serif', color: '#0f172a' }}>
      <div style={{ background: 'linear-gradient(135deg,#1d4ed8,#1e3a8a)', color: '#fff', padding: '40px 16px 34px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.18)', borderRadius: 30, padding: '6px 14px', fontSize: 13, fontWeight: 700 }}>📢 विज्ञापन पोर्टल</span>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: '14px 0 8px' }}>अपना व्यापार हमारे साथ बढ़ाएं</h1>
          <p style={{ fontSize: 15.5, opacity: .95, lineHeight: 1.6, margin: 0, maxWidth: 650 }}>
            हमारे न्यूज़ नेटवर्क पर रोज़ हज़ारों लोग खबरें पढ़ते हैं। अपने व्यापार, दुकान या सेवा का विज्ञापन
            यहाँ देकर सीधे उन तक पहुँचें। नीचे जानिए विज्ञापन देने से आपको क्या-क्या फ़ायदा होगा।
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 16px 50px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14, marginTop: 22 }}>
          {BENEFITS.map((b) => (
            <div key={b.h} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18, boxShadow: '0 2px 10px rgba(2,6,23,.04)' }}>
              <div style={{ fontSize: 26 }}>{b.icon}</div>
              <h3 style={{ margin: '10px 0 6px', fontSize: 16 }}>{b.h}</h3>
              <p style={{ margin: 0, fontSize: 13.5, color: '#64748b', lineHeight: 1.6 }}>{b.p}</p>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 26, marginTop: 20, textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 20 }}>अभी शुरू करें</h2>
          <p style={{ margin: '0 0 18px', color: '#64748b', fontSize: 14.5 }}>
            पहले से खाता है तो लॉगिन करें, या नया विज्ञापनदाता खाता बनाएं। (मोबाइल OTP से सुरक्षित)
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={`/advertiser/login${q}`} style={{ background: '#1d4ed8', color: '#fff', padding: '13px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>लॉगिन करें</Link>
            <Link href={`/advertiser/signup${q}`} style={{ background: '#fff', color: '#1d4ed8', border: '1.5px solid #1d4ed8', padding: '13px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>नया खाता बनाएं</Link>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link href="/" style={{ color: '#64748b', fontSize: 13.5, textDecoration: 'none' }}>← होम पर वापस जाएं</Link>
        </div>
      </div>
    </div>
  );
}
