'use client';
import Link from 'next/link';

export default function RssPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '32px 16px' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '36px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#ea580c', textDecoration: 'none', fontWeight: 600, marginBottom: '20px' }}>
          ← मुख्य पृष्ठ पर वापस जाएं
        </Link>

        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>RSS फ़ीड्स (Really Simple Syndication)</h1>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 24px 0' }}>ताज़ा समाचारों के रियल-टाइम सिंडिकेशन लिंक</p>

        <div style={{ fontSize: '15px', lineHeight: 1.75, color: '#334155', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p style={{ margin: 0 }}>
            आप अपने RSS रीडर अथवा न्यूज़ एग्रीगेटर ऐप में हमारे फ़ीड्स जोड़कर पल-पल की ताज़ा खबरें सीधे प्राप्त कर सकते हैं।
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <b style={{ color: '#0f172a' }}>मुख्य समाचार (All News Feed)</b>
                <div style={{ fontSize: '12px', color: '#64748b' }}>सभी श्रेणियों की ताज़ा खबरें</div>
              </div>
              <span style={{ fontSize: '12px', background: '#fff7ed', color: '#ea580c', border: '1px solid #fdba74', padding: '4px 10px', borderRadius: '6px', fontFamily: 'monospace' }}>
                /api/rss/feed.xml
              </span>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <b style={{ color: '#0f172a' }}>राजनीति (Politics Feed)</b>
                <div style={{ fontSize: '12px', color: '#64748b' }}>राजनीतिक घटनाक्रम एवं विश्लेषण</div>
              </div>
              <span style={{ fontSize: '12px', background: '#fff7ed', color: '#ea580c', border: '1px solid #fdba74', padding: '4px 10px', borderRadius: '6px', fontFamily: 'monospace' }}>
                /api/rss/politics.xml
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}