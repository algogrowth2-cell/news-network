'use client';
import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PatrakarRegister() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    designation: '',
    beat: '',
    city: '',
    state: ''
  });

  const beats = [
    'राजनीति (Politics)', 
    'अपराध (Crime)', 
    'व्यापार (Business)', 
    'खेल (Sports)', 
    'शहर / स्थानीय (Local/City)', 
    'शिक्षा एवं स्वास्थ्य (Health/Education)'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'reporters'), {
        ...formData,
        status: 'pending', // Approval pending status
        articlesCount: 0,
        approvedArticles: 0,
        views: 0,
        portalSite: 'the-local-leader',
        createdAt: serverTimestamp()
      });

      // Session cache
      localStorage.setItem('patrakar_user', JSON.stringify({
        id: docRef.id,
        name: formData.name,
        email: formData.email,
        city: formData.city,
        status: 'pending'
      }));

      router.push('/patrakar/dashboard');
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px 16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ background: '#ffffff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', width: '100%', maxWidth: '500px', padding: '32px', position: 'relative' }}>
        
        {/* Language switch */}
        <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
          <button type="button" style={{ border: '1px solid #ea580c', color: '#ea580c', background: '#fff', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            文A English
          </button>
        </div>

        {/* Card Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', background: '#fff7ed', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', fontSize: '22px', marginBottom: '10px' }}>
            📰
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', margin: 0 }}>पत्रकार पंजीकरण</h2>
          <div style={{ fontSize: '13px', color: '#ea580c', fontWeight: 600, marginTop: '2px' }}>Journalist Registration</div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>स्थानीय पत्रकार के रूप में आवेदन करें</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>पूरा नाम</label>
            <input 
              type="text" 
              required 
              placeholder="अपना पूरा नाम लिखें" 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })}
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>पदनाम</label>
              <input 
                type="text" 
                placeholder="पत्रकार, संवाददाता..." 
                value={formData.designation} 
                onChange={e => setFormData({ ...formData, designation: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>बीट</label>
              <select 
                required
                value={formData.beat} 
                onChange={e => setFormData({ ...formData, beat: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
              >
                <option value="">बीट चुनें</option>
                {beats.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>शहर</label>
              <input 
                type="text" 
                placeholder="शहर" 
                value={formData.city} 
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>राज्य</label>
              <input 
                type="text" 
                placeholder="राज्य" 
                value={formData.state} 
                onChange={e => setFormData({ ...formData, state: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ marginTop: '8px', background: '#ea580c', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: 700, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            {loading ? 'जमा हो रहा है...' : 'आवेदन जमा करें'}
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', fontSize: '12.5px' }}>
          <div>
            पहले से खाता है? <Link href="/patrakar/login" style={{ color: '#ea580c', textDecoration: 'none', fontWeight: 700 }}>लॉगिन करें</Link>
          </div>
          <Link href="/" style={{ color: '#64748b', textDecoration: 'none' }}>
            ← वापस जाएं
          </Link>
        </div>

      </div>
    </div>
  );
}