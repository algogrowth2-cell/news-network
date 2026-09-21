'use client';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '32px 16px' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '36px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#ea580c', textDecoration: 'none', fontWeight: 600, marginBottom: '20px' }}>
          ← मुख्य पृष्ठ पर वापस जाएं
        </Link>

        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>गोपनीयता नीति (Privacy Policy)</h1>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 24px 0' }}>अंतिम अद्यतन: सितंबर 2026</p>

        <div style={{ fontSize: '15px', lineHeight: 1.75, color: '#334155', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>1. सूचना का संग्रह</h2>
            <p style={{ margin: 0 }}>
              हम आपके द्वारा प्रदान की गई जानकारी (जैसे नाम, मोबाइल नंबर, ईमेल पता) केवल समाचार सेवाओं, सदस्यता प्रबंधन और उपयोगकर्ता सत्यापन के उद्देश्य से एकत्रित करते हैं।
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>2. सूचना का उपयोग</h2>
            <p style={{ margin: 0 }}>
              एकत्रित की गई जानकारी का उपयोग व्यक्तिगत समाचार अनुभव, महत्वपूर्ण अलर्ट्स, ई-पेपर एक्सेस और विज्ञापन प्राथमिकताओं को बेहतर बनाने के लिए किया जाता है। हम आपकी व्यक्तिगत जानकारी किसी भी तीसरे पक्ष को व्यावसायिक लाभ हेतु विक्रय नहीं करते हैं।
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>3. कुकीज़ (Cookies) एवं ट्रैकिंग तकनीक</h2>
            <p style={{ margin: 0 }}>
              हम उपयोगकर्ता की प्राथमिकताओं को याद रखने और पोर्टल के एनालिटिक्स को ट्रैक करने के लिए कुकीज़ का उपयोग करते हैं। आप अपने ब्राउज़र सेटिंग्स के माध्यम से कुकीज़ को अक्षम कर सकते हैं।
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>4. डेटा सुरक्षा</h2>
            <p style={{ margin: 0 }}>
              आपकी जानकारी की सुरक्षा के लिए हमारे पास मानक एन्क्रिप्शन और प्रमाणीकरण सुरक्षा प्रोटोकॉल उपलब्ध हैं।
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}