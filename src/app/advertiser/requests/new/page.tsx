'use client';
import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewAdRequest() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [zone, setZone] = useState('हेडर लीडरबोर्ड (728×90)');
  const [imageUrl, setImageUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [width, setWidth] = useState('728');
  const [height, setHeight] = useState('90');
  const [budget, setBudget] = useState('5000');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const cached = localStorage.getItem('advertiser_user');
    if (cached) {
      const parsed = JSON.parse(cached);
      setUser(parsed);
      if (parsed.status !== 'active') {
        router.push('/advertiser/requests/restricted');
      }
    } else {
      router.push('/advertiser/login');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !imageUrl) return alert('कृपया विज्ञापन का नाम और इमेज URL भरें');

    setLoading(true);
    try {
      await addDoc(collection(db, 'ads'), {
        name,
        zone,
        imageUrl,
        targetUrl,
        altText,
        width,
        height,
        budget,
        startDate,
        endDate,
        status: 'pending', // Admin review required
        advertiserId: user?.id || '',
        advertiserName: user?.name || '',
        portalSite: 'the-local-leader',
        impressions: 0,
        clicks: 0,
        createdAt: serverTimestamp()
      });

      alert('विज्ञापन सफलतापूर्वक जमा हो गया है! एडमिन की समीक्षा के बाद यह वेबसाइट पर लाइव होगा।');
      router.push('/advertiser/dashboard');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '60px' }}>
      
      {/* Header */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', background: '#fff7ed', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', fontSize: '18px' }}>
              📢
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>विज्ञापनदाता पोर्टल</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>{user?.name || 'User'}</div>
            </div>
          </div>
          <button onClick={() => { localStorage.removeItem('advertiser_user'); router.push('/advertiser/login'); }} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>
            [→ लॉग आउट
          </button>
        </div>
      </header>

      {/* Sub Nav */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '8px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', gap: '12px' }}>
          <Link href="/advertiser/dashboard" style={{ color: '#64748b', textDecoration: 'none', padding: '6px 14px', fontSize: '13px' }}>
            🪟 डैशबोर्ड
          </Link>
          <button style={{ background: '#ea580c', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', fontWeight: 600 }}>
            + नया विज्ञापन
          </button>
        </div>
      </div>

      {/* Main Form (Matching Screenshot aa4ea6) */}
      <main style={{ maxWidth: '800px', margin: '30px auto', padding: '0 20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b', marginBottom: '20px' }}>नया विज्ञापन जमा करें</h2>

        <form onSubmit={handleSubmit} style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>विज्ञापन का नाम *</label>
            <input 
              type="text" 
              required 
              value={name} 
              onChange={e => setName(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>ज़ोन *</label>
            <select 
              value={zone} 
              onChange={e => setZone(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
            >
              <option value="हेडर लीडरबोर्ड (728×90)">हेडर लीडरबोर्ड (728×90)</option>
              <option value="साइडबार बैनर (300×250)">साइडबार बैनर (300×250)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>इमेज URL</label>
              <input 
                type="text" 
                placeholder="https://..." 
                value={imageUrl} 
                onChange={e => setImageUrl(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>लिंक URL</label>
              <input 
                type="text" 
                placeholder="https://..." 
                value={targetUrl} 
                onChange={e => setTargetUrl(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Alt टेक्स्ट</label>
            <input 
              type="text" 
              value={altText} 
              onChange={e => setAltText(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>चौड़ाई (px)</label>
              <input 
                type="text" 
                value={width} 
                onChange={e => setWidth(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>ऊंचाई (px)</label>
              <input 
                type="text" 
                value={height} 
                onChange={e => setHeight(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>बजट (₹)</label>
              <input 
                type="text" 
                value={budget} 
                onChange={e => setBudget(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>प्रारंभ तिथि</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>समाप्ति तिथि</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ marginTop: '10px', background: '#ea580c', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
          >
            {loading ? 'जमा हो रहा है...' : 'समीक्षा के लिए जमा करें'}
          </button>
        </form>
      </main>

    </div>
  );
}