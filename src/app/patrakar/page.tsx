import Link from 'next/link';

export const metadata = { title: 'पत्रकार बनें — हमारे साथ जुड़ें' };

const BENEFITS = [
  { icon: '🪪', h: 'डिजिटल प्रेस पहचान पत्र', p: 'सत्यापन के बाद आपको आधिकारिक डिजिटल प्रेस ID कार्ड मिलता है — अपने नाम और फोटो के साथ।' },
  { icon: '📝', h: 'अपनी खबरें प्रकाशित करें', p: 'अपने इलाके की खबरें सीधे पोर्टल पर भेजें। संपादकीय समीक्षा के बाद वे वेबसाइट पर लाइव होती हैं।' },
  { icon: '🌐', h: '8 पोर्टल का नेटवर्क', p: 'हमारे पूरे न्यूज़ नेटवर्क में आपकी खबरों को पहुँच और पहचान मिलती है।' },
  { icon: '📊', h: 'अपना डैशबोर्ड', p: 'आपकी भेजी खबरें, उनकी स्थिति (समीक्षा/प्रकाशित) और व्यूज़ — सब एक जगह।' },
  { icon: '📸', h: 'फोटो व वीडियो', p: 'अपनी रिपोर्ट के साथ फोटो और वीडियो जोड़ें — खबर को और भरोसेमंद बनाएं।' },
  { icon: '🤝', h: 'पहचान और सम्मान', p: 'हर प्रकाशित खबर आपके नाम के साथ जाती है — एक पत्रकार के रूप में अपनी पहचान बनाएं।' }
];

export default async function PatrakarIntro({ searchParams }: { searchParams: Promise<{ site?: string }> }) {
  const { site } = await searchParams;
  const q = site ? `?site=${encodeURIComponent(site)}` : '';
  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'system-ui,-apple-system,sans-serif', color: '#0f172a' }}>
      <div style={{ background: 'linear-gradient(135deg,#ea580c,#c2410c)', color: '#fff', padding: '40px 16px 34px' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.18)', borderRadius: 30, padding: '6px 14px', fontSize: 13, fontWeight: 700 }}>✍️ पत्रकार पोर्टल</span>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: '14px 0 8px' }}>हमारे पत्रकार बनें</h1>
          <p style={{ fontSize: 15.5, opacity: .95, lineHeight: 1.6, margin: 0, maxWidth: 640 }}>
            क्या आप अपने इलाके की सच्ची खबरें लोगों तक पहुँचाना चाहते हैं? हमारे न्यूज़ नेटवर्क से जुड़िए और
            एक सत्यापित पत्रकार के रूप में अपनी पहचान बनाइए। नीचे जानिए आपको क्या-क्या मिलेगा।
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
          <h2 style={{ margin: '0 0 6px', fontSize: 20 }}>आज ही जुड़ें</h2>
          <p style={{ margin: '0 0 18px', color: '#64748b', fontSize: 14.5 }}>
            पहले से खाता है तो लॉगिन करें, या नया पत्रकार खाता बनाएं। (मोबाइल OTP से सुरक्षित सत्यापन)
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href={`/patrakar/login${q}`} style={{ background: '#ea580c', color: '#fff', padding: '13px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>लॉगिन करें</Link>
            <Link href={`/patrakar/signup${q}`} style={{ background: '#fff', color: '#ea580c', border: '1.5px solid #ea580c', padding: '13px 28px', borderRadius: 10, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>नया खाता बनाएं</Link>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link href="/" style={{ color: '#64748b', fontSize: 13.5, textDecoration: 'none' }}>← होम पर वापस जाएं</Link>
        </div>
      </div>
    </div>
  );
}
