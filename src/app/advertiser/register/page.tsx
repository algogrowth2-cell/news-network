'use client';
import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdvertiserRegister() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    password: '',
    mobile: '',
    gstNumber: '',
    website: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'advertisers'), {
        ...formData,
        status: 'pending', // Account approval needed by admin
        activeAds: 0,
        totalAds: 0,
        impressions: 0,
        clicks: 0,
        createdAt: serverTimestamp()
      });

      localStorage.setItem('advertiser_user', JSON.stringify({
        id: docRef.id,
        name: formData.contactPerson || formData.companyName,
        companyName: formData.companyName,
        email: formData.email,
        status: 'pending'
      }));

      router.push('/advertiser/dashboard');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', width: '100%', maxWidth: '500px', padding: '32px', position: 'relative' }}>
        
        <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
          <button type="button" style={{ border: '1px solid #ea580c', color: '#ea580c', background: '#fff', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            文A English
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', background: '#fff7ed', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', fontSize: '22px', marginBottom: '10px' }}>
            📢
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', margin: 0 }}>विज्ञापनदाता पंजीकरण</h2>
          <div style={{ fontSize: '13px', color: '#ea580c', fontWeight: 600, marginTop: '2px' }}>Advertiser Registration</div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>अपने व्यवसाय के लिए विज्ञापन शुरू करें</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>कंपनी का नाम</label>
            <input 
              type="text" 
              required 
              placeholder="आपकी कंपनी / व्यवसाय का नाम" 
              value={formData.companyName} 
              onChange={e => setFormData({ ...formData, companyName: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>संपर्क व्यक्ति</label>
            <input 
              type="text" 
              required 
              placeholder="संपर्क व्यक्ति का नाम" 
              value={formData.contactPerson} 
              onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>ईमेल</label>
            <input 
              type="email" 
              required 
              placeholder="you@example.com" 
              value={formData.email} 
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>पासवर्ड</label>
              <input 
                type="password" 
                required 
                placeholder="न्यूनतम 8 अक्षर" 
                value={formData.password} 
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>मोबाइल</label>
              <input 
                type="tel" 
                required 
                placeholder="10 अंकों का नंबर" 
                value={formData.mobile} 
                onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>GST नंबर (वैकल्पिक)</label>
              <input 
                type="text" 
                placeholder="22AAAAA0000A1Z5" 
                value={formData.gstNumber} 
                onChange={e => setFormData({ ...formData, gstNumber: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>वेबसाइट (वैकल्पिक)</label>
              <input 
                type="text" 
                placeholder="https://yoursite.com" 
                value={formData.website} 
                onChange={e => setFormData({ ...formData, website: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ marginTop: '8px', background: '#ea580c', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
          >
            {loading ? 'रजिस्टर हो रहा है...' : 'रजिस्टर करें'}
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', fontSize: '12.5px' }}>
          <div>
            पहले से खाता है? <Link href="/advertiser/login" style={{ color: '#ea580c', textDecoration: 'none', fontWeight: 700 }}>लॉगिन करें</Link>
          </div>
          <Link href="/" style={{ color: '#64748b', textDecoration: 'none' }}>
            ← वापस जाएं
          </Link>
        </div>

      </div>
    </div>
  );
}