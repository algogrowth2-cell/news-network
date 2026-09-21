'use client';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '32px 16px' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '36px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#ea580c', textDecoration: 'none', fontWeight: 600, marginBottom: '20px' }}>
          ← मुख्य पृष्ठ पर वापस जाएं
        </Link>

        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>उपयोग की शर्तें (Terms of Service)</h1>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 24px 0' }}>अंतिम अद्यतन: सितंबर 2026</p>

        <div style={{ fontSize: '15px', lineHeight: 1.75, color: '#334155', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>1. पोर्टल का उपयोग</h2>
            <p style={{ margin: 0 }}>
              इस न्यूज़ नेटवर्क की वेबसाइट और इसकी सेवाओं का उपयोग करने का अर्थ है कि आप इन शर्तों से पूर्णतः सहमत हैं। यदि आप इन शर्तों से सहमत नहीं हैं, तो कृपया पोर्टल का उपयोग न करें।
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>2. बौद्धिक संपदा अधिकार</h2>
            <p style={{ margin: 0 }}>
              पोर्टल पर प्रकाशित सभी समाचार, लेख, तस्वीरें, वीडियो और ग्राफ़िक्स नेटवर्क की संपदा हैं। बिना लिखित अनुमति के व्यावसायिक रूप से इनका पुनः प्रकाशन अथवा प्रतिलिपिकरण वर्जित है।
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>3. उपयोगकर्ता आचरण और टिप्पणियां</h2>
            <p style={{ margin: 0 }}>
              उपयोगकर्ता द्वारा की गई किसी भी टिप्पणी में अभद्र भाषा, भ्रामक सूचना, या किसी धर्म/समुदाय के विरुद्ध घृणास्पद वक्तव्य की अनुमति नहीं है। ऐसे खातों को तुरंत निलंबित किया जा सकता है।
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>4. क्षेत्राधिकार</h2>
            <p style={{ margin: 0 }}>
              इस पोर्टल से संबंधित किसी भी विवाद का निपटारा स्थानीय न्यायालय क्षेत्राधिकार के अंतर्गत होगा।
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}