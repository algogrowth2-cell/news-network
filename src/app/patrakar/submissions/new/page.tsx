'use client';
import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PatrakarNewSubmission() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [isBreaking, setIsBreaking] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem('patrakar_user');
    if (cached) {
      const parsed = JSON.parse(cached);
      setUser(parsed);
      if (parsed.city) setCity(parsed.city);
    } else {
      router.push('/patrakar/login');
    }
  }, [router]);

  const categories = [
    'National', 'Business', 'Politics', 'Sports', 'Technology', 
    'Entertainment', 'Health', 'Crime', 'Lifestyle', 'Agriculture'
  ];

  const handleSubmit = async (submitStatus: 'Draft' | 'pending_review') => {
    if (submitStatus === 'pending_review') {
      if (!title.trim()) return alert('कृपया लेख का शीर्षक लिखें');
      if (!content.trim()) return alert('कृपया सामग्री लिखें');
      if (!category) return alert('कृपया श्रेणी चुनें');
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'articles'), {
        title,
        titleHi: title,
        summary,
        content,
        category: category || 'National',
        image: thumbnail || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop',
        location,
        city,
        state,
        isBreaking,
        status: submitStatus, // 'pending_review' ya 'Draft'
        authorId: user?.id || '',
        authorName: user?.name || 'पत्रकार',
        siteId: user?.portalSite || 'the-local-leader',
        views: 0,
        createdAt: new Date().toISOString().split('T')[0],
        timestamp: serverTimestamp()
      });

      alert(submitStatus === 'pending_review' ? 'लेख समीक्षा के लिए सफलतापूर्वक जमा कर दिया गया है!' : 'ड्राफ्ट सहेज लिया गया!');
      router.push('/patrakar/dashboard');
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('patrakar_user');
    router.push('/patrakar/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '60px' }}>
      
      {/* Top Header Bar */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '12px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '38px', height: '38px', background: '#fff7ed', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', fontSize: '18px' }}>
              📰
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>पत्रकार पोर्टल</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>PTR260002</div>
            </div>
          </div>

          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>
            [→ लॉग आउट
          </button>
        </div>
      </header>

      {/* Navigation Sub-bar */}
      <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '8px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '12px' }}>
          <Link href="/patrakar/dashboard" style={{ background: 'none', border: 'none', color: '#64748b', textDecoration: 'none', padding: '6px 14px', fontSize: '13px' }}>
            📄 डैशबोर्ड
          </Link>
          <button style={{ background: '#ea580c', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            + नया लेख
          </button>
          <button style={{ background: 'none', border: 'none', color: '#64748b', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}>
            🪪 ID कार्ड
          </button>
          <button style={{ background: 'none', border: 'none', color: '#64748b', padding: '6px 14px', fontSize: '13px', cursor: 'pointer' }}>
            👤 प्रोफ़ाइल
          </button>
        </div>
      </div>

      {/* Main Submission Form Box */}
      <main style={{ maxWidth: '800px', margin: '30px auto', padding: '0 16px' }}>
        <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '32px', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Title */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>शीर्षक *</label>
              <input 
                type="text" 
                placeholder="लेख का मुख्य शीर्षक लिखें..." 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Summary */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>सारांश</label>
              <textarea 
                rows={3} 
                placeholder="खबर का संक्षिप्त विवरण..." 
                value={summary} 
                onChange={e => setSummary(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
              />
            </div>

            {/* Content Body */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>सामग्री *</label>
              <textarea 
                rows={9} 
                placeholder="अपना लेख यहाँ लिखें..." 
                value={content} 
                onChange={e => setContent(e.target.value)}
                style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box', lineHeight: '1.6', resize: 'vertical' }}
              />
            </div>

            {/* Category & Thumbnail */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>श्रेणी *</label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
                >
                  <option value="">चुनें...</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>थंबनेल URL</label>
                <input 
                  type="text" 
                  placeholder="https://..." 
                  value={thumbnail} 
                  onChange={e => setThumbnail(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Location, City, State */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>स्थान</label>
                <input 
                  type="text" 
                  value={location} 
                  onChange={e => setLocation(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>शहर</label>
                <input 
                  type="text" 
                  value={city} 
                  onChange={e => setCity(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>राज्य</label>
                <input 
                  type="text" 
                  value={state} 
                  onChange={e => setState(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Breaking News Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <input 
                type="checkbox" 
                id="breakingNews" 
                checked={isBreaking} 
                onChange={e => setIsBreaking(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="breakingNews" style={{ fontSize: '13.5px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
                तत्काल / ब्रेकिंग न्यूज़
              </label>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
              <button 
                type="button" 
                disabled={loading}
                onClick={() => handleSubmit('Draft')}
                style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, fontSize: '13.5px', color: '#475569', cursor: 'pointer' }}
              >
                ड्राफ्ट सहेजें
              </button>
              <button 
                type="button" 
                disabled={loading}
                onClick={() => handleSubmit('pending_review')}
                style={{ background: '#ea580c', border: 'none', padding: '10px 24px', borderRadius: '8px', fontWeight: 700, fontSize: '13.5px', color: '#ffffff', cursor: 'pointer' }}
              >
                {loading ? 'जमा हो रहा है...' : 'समीक्षा के लिए जमा करें'}
              </button>
            </div>

          </div>

        </div>
      </main>

    </div>
  );
}