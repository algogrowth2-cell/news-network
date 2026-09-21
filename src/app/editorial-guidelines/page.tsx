'use client';
import Link from 'next/link';

export default function EditorialGuidelinesPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '32px 16px' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '36px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#ea580c', textDecoration: 'none', fontWeight: 600, marginBottom: '20px' }}>
          ← मुख्य पृष्ठ पर वापस जाएं
        </Link>

        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>संपादकीय दिशानिर्देश (Editorial Guidelines)</h1>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 24px 0' }}>स्वतंत्र, निष्पक्ष और जिम्मेदार पत्रकारिता के मानक</p>

        <div style={{ fontSize: '15px', lineHeight: 1.75, color: '#334155', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>1. सटीकता एवं तथ्य-जांच (Fact Checking)</h2>
            <p style={{ margin: 0 }}>
              प्रत्येक समाचार को प्रकाशित करने से पूर्व विश्वसनीय स्रोतों, आधिकारिक बयानों और साक्ष्यों के आधार पर प्रमाणित किया जाता है। अपुष्ट अफवाहों अथवा वायरल संदेशों को बिना जांच के प्रकाशित नहीं किया जाता।
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>2. निष्पक्षता और संतुलन</h2>
            <p style={{ margin: 0 }}>
              हम सभी पक्षों को अपनी बात रखने का समान अवसर प्रदान करने हेतु प्रतिबद्ध हैं। समाचार रिपोर्टिंग में व्यक्तिगत या राजनीतिक पूर्वाग्रह से मुक्त दृष्टिकोण बनाए रखा जाता है।
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>3. सुधार नीति (Corrections Policy)</h2>
            <p style={{ margin: 0 }}>
              यदि किसी रिपोर्ट में तथ्यात्मक त्रुटि पाई जाती है, तो उसे त्वरित रूप से संशोधित किया जाता है और पाठकों की स्पष्टता हेतु सुधार नोट प्रकाशित किया जाता है।
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>4. विज्ञापन और समाचार का पृथक्करण</h2>
            <p style={{ margin: 0 }}>
              प्रायोजित लेखों अथवा विज्ञापनों को स्पष्ट रूप से "विज्ञापन" अथवा "प्रायोजित" लेबल द्वारा चिह्नित किया जाता है ताकि पाठक समाचार और विज्ञापन में अंतर स्पष्ट समझ सकें।
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}