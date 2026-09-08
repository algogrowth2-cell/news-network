'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

export default function AdvertiserDashboard() {
  const router = useRouter();
  const [advertiser, setAdvertiser] = useState<any>(null);
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Ad Form State
  const [adName, setAdName] = useState('');
  const [zone, setZone] = useState('728x90 Header Leaderboard');
  const [imageUrl, setImageUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const raw = localStorage.getItem('advertiser_user');
    if (!raw) {
      router.replace('/advertiser/login');
      return;
    }
    const user = JSON.parse(raw);
    setAdvertiser(user);

    async function loadAds() {
      try {
        const q = query(collection(db, 'ads'), where('advertiserId', '==', user.id || ''));
        const snap = await getDocs(q);
        setAds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
    loadAds();
  }, [router]);

  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      alert('कृपया बैनर इमेज यूआरएल दर्ज करें');
      return;
    }

    setSubmitting(true);
    setMsg('');

    try {
      // 🔒 HAR NAYA AD BY-DEFAULT PAUSED MEIN HI SAVE HOGA
      await addDoc(collection(db, 'ads'), {
        name: adName.trim() || 'विज्ञापन',
        zone,
        imageUrl: imageUrl.trim(),
        targetUrl: targetUrl.trim(),
        budget: 5000,
        advertiserId: advertiser?.id || '',
        advertiserEmail: advertiser?.email || '',
        createdAt: new Date().toISOString(),
        status: 'paused' // 🔴 STRICTLY PAUSED: Admin jab tak approve nahi karega active nahi hoga
      });

      setAdName('');
      setImageUrl('');
      setTargetUrl('');
      setMsg('✓ आपका विज्ञापन सफलतापूर्वक भेज दिया गया है! एडमिन द्वारा स्वीकृति के बाद ही यह पोर्टल पर लाइव होगा।');
    } catch (err: any) {
      console.error(err);
      alert('विज्ञापन सबमिट करने में त्रुटि आई: ' + err.message);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        विज्ञापनदाता पोर्टल लोड हो रहा है...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Top Navbar */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>📢</span>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>विज्ञापनदाता डेस्क</h2>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              खाता: <b>{advertiser?.name}</b> ({advertiser?.email})
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ fontSize: '12px', color: '#64748b', textDecoration: 'none' }}>
            वेबसाइट देखें ↗
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem('advertiser_user');
              router.push('/advertiser/login');
            }}
            style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer' }}
          >
            लॉग आउट
          </button>
        </div>
      </header>

      <main style={{ maxWidth: '900px', margin: '30px auto', padding: '0 16px' }}>
        
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', margin: '0 0 16px 0' }}>
            🎯 नया विज्ञापन बैनर अपलोड करें (समीक्षा हेतु)
          </h2>

          {msg && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', fontWeight: 700 }}>
              {msg}
            </div>
          )}

          <form onSubmit={handleCreateAd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                विज्ञापन / ब्रांड का नाम
              </label>
              <input
                type="text"
                required
                placeholder="कंपनी या कैंपेन का नाम"
                value={adName}
                onChange={(e) => setAdName(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  विज्ञापन ज़ोन (Slot Placement)
                </label>
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="728x90 (हेडर)">हेडर लीडरबोर्ड (728x90)</option>
                  <option value="300x250 (साइडबार)">साइडबार बैनर (300x250)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  क्लिक करने पर खुलने वाला लिंक (Target URL)
                </label>
                <input
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                बैनर इमेज का वेब यूआरएल (Direct Image Link)
              </label>
              <input
                type="url"
                required
                placeholder="https://images.unsplash.com/... या direct image link"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                alignSelf: 'flex-start',
                padding: '12px 28px',
                background: '#ea580c',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '14px',
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'भेजा जा रहा है...' : 'एडमिन को अनुमोदन (Approval) हेतु भेजें →'}
            </button>
          </form>
        </div>

      </main>

    </div>
  );
}