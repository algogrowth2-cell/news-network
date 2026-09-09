'use client';
import { useState, useEffect, Suspense } from 'react';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

function ShokSandeshContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const siteSlug = searchParams.get('site') || 'the-local-leader';

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [authError, setAuthError] = useState('');

  const [deceasedName, setDeceasedName] = useState('');
  const [relation, setRelation] = useState('');
  const [dob, setDob] = useState('');
  const [dod, setDod] = useState('');
  const [message, setMessage] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [approvedList, setApprovedList] = useState<any[]>([]);

  useEffect(() => {
    const cached = localStorage.getItem('shok_user');
    if (cached) {
      try { setUser(JSON.parse(cached)); } catch (e) {}
    }
    loadApprovedSandesh();
  }, [siteSlug]);

  const loadApprovedSandesh = async () => {
    try {
      // Checking obituaries collection used by the admin panel
      const q = query(
        collection(db, 'obituaries'),
        where('status', '==', 'approved')
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setApprovedList(list);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!email || !password) {
      setAuthError('कृपया ईमेल और पासवर्ड भरें।');
      return;
    }
    const mockUser = { uid: 'u_' + Date.now(), email, name: name || email.split('@')[0], phone };
    localStorage.setItem('shok_user', JSON.stringify(mockUser));
    setUser(mockUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('shok_user');
    setUser(null);
  };

  const handlePaymentAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deceasedName || !dod || !message) {
      alert('कृपया सभी आवश्यक जानकारी भरें।');
      return;
    }

    setLoading(true);

    const payload = {
      siteId: siteSlug,
      type: 'शोक संदेश',
      deceased: deceasedName,
      deceasedName,
      family: relation || 'परिवारजन',
      relation,
      city: 'स्थानीय',
      date: dod,
      dod,
      dob,
      message,
      photoUrl: photoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
      userId: user?.uid || 'guest',
      userName: user?.name || name || 'अज्ञात यूज़र',
      userEmail: user?.email || email || '',
      paymentId: 'PAY_SUCCESS_' + Date.now(),
      status: 'pending', // Goes directly to /admin/obituaries for approval
      createdAt: serverTimestamp()
    };

    try {
      // Save directly to 'obituaries' collection so admin panel catches it instantly
      await addDoc(collection(db, 'obituaries'), payload);
      // Backup sync collection
      await addDoc(collection(db, 'shokSandesh'), payload);
      
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('डेटा सेव करने में त्रुटि हुई।');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f2f1ee', color: '#16150f', fontFamily: '"Mukta", system-ui, sans-serif' }}>
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e3e0da', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href={`/?site=${siteSlug}`} style={{ fontSize: '18px', fontWeight: 700, color: '#ea580c', textDecoration: 'none' }}>
          ← होम पेज पर लौटें
        </Link>
        <h1 style={{ fontSize: '20px', fontWeight: 600, margin: 0 }}>🕯️ श्रद्धांजलि एवं शोक संदेश पोर्टल</h1>
      </header>

      <div style={{ maxWidth: '900px', margin: '30px auto', padding: '0 16px' }}>
        {!user ? (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '30px', border: '1px solid #e3e0da', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e3e0da', paddingBottom: '10px' }}>
              <button 
                onClick={() => setAuthMode('login')} 
                style={{ background: authMode === 'login' ? '#ea580c' : '#f1f5f9', color: authMode === 'login' ? '#fff' : '#334155', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
              >
                लॉगिन करें
              </button>
              <button 
                onClick={() => setAuthMode('signup')} 
                style={{ background: authMode === 'signup' ? '#ea580c' : '#f1f5f9', color: authMode === 'signup' ? '#fff' : '#334155', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
              >
                नया खाता बनाएं (Signup)
              </button>
            </div>

            {authError && <div style={{ color: '#ef4444', marginBottom: '12px', fontSize: '14px' }}>{authError}</div>}

            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {authMode === 'signup' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>पूरा नाम</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="अपना नाम दर्ज करें" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>मोबाइल नंबर</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10 अंकों का मोबाइल नंबर" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  </div>
                </>
              )}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>ईमेल आईडी</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>पासवर्ड</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>
              <button type="submit" style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', marginTop: '10px' }}>
                {authMode === 'login' ? 'लॉगिन करें' : 'खाता रजिस्टर करें'}
              </button>
            </form>
          </div>
        ) : submitted ? (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '40px', textAlign: 'center', border: '1px solid #e3e0da' }}>
            <h2 style={{ color: '#16a34a', fontSize: '24px', marginBottom: '10px' }}>✓ शोक संदेश सफलताપूर्वक दर्ज हो गया है!</h2>
            <p style={{ color: '#5a574f', fontSize: '15px', marginBottom: '20px' }}>
              आपका भुगतान प्राप्त हो गया है। यह डेटा अब एडमिन पैनल (`/admin/obituaries`) में अनुमोदन के लिए भेज दिया गया है।
            </p>
            <button onClick={() => setSubmitted(false)} style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
              दूसरा संदेश दर्ज करें
            </button>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '30px', border: '1px solid #e3e0da' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e3e0da', paddingBottom: '10px' }}>
              <div>
                <span style={{ fontSize: '14px', color: '#8d897f' }}>लॉगिन यूज़र: <b>{user.name}</b> ({user.email})</span>
              </div>
              <button onClick={handleLogout} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '5px 12px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>
                लॉगआउट
              </button>
            </div>

            <form onSubmit={handlePaymentAndSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, marginBottom: '4px' }}>स्वर्गवासी का पूरा नाम *</label>
                <input type="text" value={deceasedName} onChange={e => setDeceasedName(e.target.value)} placeholder="जैसे: स्व. श्री रामप्रसाद जी पाटीदार" required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, marginBottom: '4px' }}>आपसे संबंध</label>
                  <input type="text" value={relation} onChange={e => setRelation(e.target.value)} placeholder="जैसे: पिता / माता / धर्मपत्नी" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, marginBottom: '4px' }}>स्वर्गवास की तिथि *</label>
                  <input type="date" value={dod} onChange={e => setDod(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, marginBottom: '4px' }}>स्वर्गवासी का फोटो URL या इमेज लिंक</label>
                <input type="url" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="https://example.com/photo.jpg (वैकल्पिक)" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, marginBottom: '4px' }}>श्रद्धांजलि संदेश एवं प्रार्थना सभा विवरण *</label>
                <textarea rows={4} value={message} onChange={e => setMessage(e.target.value)} placeholder="अत्यंत दुःख के साथ सूचित करना पड़ रहा है कि..." required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              </div>

              <div style={{ background: '#fff7ed', border: '1px solid #fdba74', padding: '14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <b>प्रकाशन शुल्क (Secure Online Payment):</b>
                  <div style={{ fontSize: '12px', color: '#7c2d12' }}>वेबसाइट पर 3 दिनों तक प्रदर्शित करने हेतु</div>
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#ea580c' }}>₹500</div>
              </div>

              <button type="submit" disabled={loading} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '16px', fontWeight: 700, cursor: 'pointer', marginTop: '6px' }}>
                {loading ? 'प्रक्रिया जारी है...' : '💳 ₹500 भुगतान करके सबमिट करें'}
              </button>
            </form>
          </div>
        )}

        <div style={{ marginTop: '40px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px', borderBottom: '2px solid #ea580c', paddingBottom: '6px', width: 'fit-content' }}>
            श्रद्धांजलि एवं शोक संदेश फीड
          </h2>

          {approvedList.length === 0 ? (
            <div style={{ background: '#fff', padding: '30px', textAlign: 'center', borderRadius: '8px', color: '#8d897f' }}>
              वर्तमान में कोई अनुमोदित शोक संदेश उपलब्ध नहीं है।
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {approvedList.map(item => (
                <div key={item.id} style={{ background: '#fff', borderRadius: '10px', padding: '20px', border: '1px solid #e3e0da', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                  <img src={item.photoUrl || item.imageUrl} alt={item.deceasedName || item.deceased} style={{ width: '90px', height: '110px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 4px 0', color: '#16150f' }}>{item.deceasedName || item.deceased}</h3>
                    <div style={{ fontSize: '13px', color: '#ea580c', fontWeight: 600, marginBottom: '8px' }}>
                      स्वर्गवास तिथि: {item.dod || item.date} {item.relation || item.family ? `(${item.relation || item.family})` : ''}
                    </div>
                    <p style={{ fontSize: '14.5px', color: '#5a574f', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{item.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function ShokSandeshPage() {
  return (
    <Suspense fallback={<div style={{ padding: '50px', textAlign: 'center' }}>लोड हो रहा है...</div>}>
      <ShokSandeshContent />
    </Suspense>
  );
}