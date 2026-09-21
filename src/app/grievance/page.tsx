'use client';
import Link from 'next/link';

export default function GrievancePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '32px 16px' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '36px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#ea580c', textDecoration: 'none', fontWeight: 600, marginBottom: '20px' }}>
          ← मुख्य पृष्ठ पर वापस जाएं
        </Link>

        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>शिकायत निवारण (Grievance Redressal)</h1>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 24px 0' }}>डिजिटल मीडिया आचार संहिता एवं सूचना प्रौद्योगिकी नियम</p>

        <div style={{ fontSize: '15px', lineHeight: 1.75, color: '#334155', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={{ margin: 0 }}>
            सूचना प्रौद्योगिकी (मध्यवर्ती संदर्शिका और डिजिटल मीडिया आचार संहिता) नियम, 2021 के अनुपालन में, हमारे पोर्टल पर प्रकाशित किसी भी सामग्री से संबंधित शिकायत हेतु शिकायत अधिकारी का विवरण नीचे दिया गया है:
          </p>

          <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div><strong>शिकायत निवारण अधिकारी:</strong> संपादक / नोडल अधिकारी</div>
            <div><strong>संस्थान:</strong> द लोकल लीडर डिजिटल न्यूज़ नेटवर्क</div>
            <div><strong>ईमेल:</strong> <a href="mailto:grievance@thelocalleader.in" style={{ color: '#ea580c', textDecoration: 'none' }}>grievance@thelocalleader.in</a></div>
            <div><strong>प्रतिक्रिया समय:</strong> शिकायत प्राप्त होने के 24 घंटे के भीतर पावती एवं 15 दिनों के भीतर निस्तारण।</div>
          </div>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>शिकायत दर्ज करने का प्रारूप:</h2>
            <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>संबंधित समाचार लेख का शीर्षक एवं यूआरएल (Web Link)</li>
              <li>आपत्ति का विशिष्ट विवरण एवं आधार</li>
              <li>शिकायतकर्ता का पूरा नाम, वैध पहचान पत्र एवं संपर्क विवरण</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}