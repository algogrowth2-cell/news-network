'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  serverTimestamp,
  query,
  orderBy 
} from 'firebase/firestore';
import Link from 'next/link';

interface ShokSandeshItem {
  id: string;
  name: string;
  relation?: string;
  passedDate?: string;
  eventDate?: string;
  eventTime?: string;
  venue?: string;
  address?: string;
  familyMembers?: string;
  contactNumber?: string;
  photoUrl?: string;
  templateId?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: any;
}

export default function AdminShokSandeshPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'create'>('pending');
  const [items, setItems] = useState<ShokSandeshItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual Create State for Admin
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('पिता जी');
  const [passedDate, setPassedDate] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('अपराह्न 1:00 बजे के उपरांत');
  const [venue, setVenue] = useState('समस्त कार्यक्रम हमारे निवास स्थल से संपन्न होंगे');
  const [address, setAddress] = useState('');
  const [familyMembers, setFamilyMembers] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch Real-time Shok Sandesh List
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'shok_sandesh'));

    const unsub = onSnapshot(q, (snapshot) => {
      const list: ShokSandeshItem[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      } as ShokSandeshItem));

      setItems(list);
      setLoading(false);
    }, (err) => {
      console.error('Fetch error:', err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 2. Approve Handler (Makes it live on public website)
  const handleApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, 'shok_sandesh', id), {
        status: 'approved'
      });
      alert('शोक संदेश स्वीकृत कर दिया गया है और वेबसाइट पर लाइव हो गया है!');
    } catch (err: any) {
      alert('Approval error: ' + err.message);
    }
  };

  // 3. Reject Handler
  const handleReject = async (id: string) => {
    if (!confirm('क्या आप इस शोक संदेश को अस्वीकार (Reject) करना चाहते हैं?')) return;
    try {
      await updateDoc(doc(db, 'shok_sandesh', id), {
        status: 'rejected'
      });
    } catch (err: any) {
      alert('Reject error: ' + err.message);
    }
  };

  // 4. Delete Handler
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`क्या आप "${name}" का शोक संदेश स्थायी रूप से हटाना चाहते हैं?`)) return;
    try {
      await deleteDoc(doc(db, 'shok_sandesh', id));
    } catch (err: any) {
      alert('Delete error: ' + err.message);
    }
  };

  // 5. Admin Direct Create
  const handleAdminCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('कृपया स्वर्गीय का नाम दर्ज करें।');
      return;
    }

    try {
      setSubmitting(true);
      await addDoc(collection(db, 'shok_sandesh'), {
        name: name.trim(),
        relation: relation.trim(),
        passedDate: passedDate || 'हाल ही में',
        eventDate: eventDate || 'शीघ्र',
        eventTime: eventTime.trim(),
        venue: venue.trim(),
        address: address.trim(),
        familyMembers: familyMembers.trim(),
        contactNumber: contactNumber.trim(),
        photoUrl: photoUrl.trim() || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
        templateId: 'classic-silver',
        status: 'approved', // Admin entry is directly approved
        createdAt: serverTimestamp()
      });

      alert('शोक संदेश सफलतापूर्वक बना दिया गया और लाइव हो गया!');
      setName('');
      setAddress('');
      setFamilyMembers('');
      setContactNumber('');
      setPhotoUrl('');
      setSubmitting(false);
      setActiveTab('approved');
    } catch (err: any) {
      setSubmitting(false);
      alert('Error: ' + err.message);
    }
  };

  const pendingList = items.filter(i => i.status === 'pending');
  const approvedList = items.filter(i => i.status === 'approved');

  return (
    <div style={{ backgroundColor: '#070b14', minHeight: '100vh', padding: '28px', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', margin: '0 0 6px 0' }}>
            शोक संदेश प्रबंधन (Admin Portal)
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            उपयोगकर्ताओं द्वारा भेजे गए श्रद्धांजलि व शोक संदेशों का सत्यापन एवं लाइव प्रकाशन
          </p>
        </div>

        <Link 
          href="/shok-sandesh" 
          target="_blank"
          style={{ fontSize: '13px', color: '#38bdf8', textDecoration: 'none', background: '#162238', border: '1px solid #27354f', padding: '8px 16px', borderRadius: '8px' }}
        >
          ↗ लाइव शोक संदेश पेज देखें
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          style={{
            backgroundColor: activeTab === 'pending' ? '#f59e0b' : '#0e1626',
            color: activeTab === 'pending' ? '#000000' : '#fbbf24',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '9px 18px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          समीक्षा हेतु लंबित ({pendingList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('approved')}
          style={{
            backgroundColor: activeTab === 'approved' ? '#10b981' : '#0e1626',
            color: activeTab === 'approved' ? '#ffffff' : '#94a3b8',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            padding: '9px 18px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          लाइव प्रकाशित ({approvedList.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('create')}
          style={{
            backgroundColor: activeTab === 'create' ? '#2563eb' : '#0e1626',
            color: '#ffffff',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            padding: '9px 18px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          + नया संदेश जोड़ें
        </button>
      </div>

      {/* TAB 1: PENDING APPROVALS */}
      {activeTab === 'pending' && (
        <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: '0 0 16px 0' }}>
            स्वीकृति हेतु प्रतीक्षारत शोक संदेश ({pendingList.length})
          </h2>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>डेटा लोड हो रहा है...</div>
          ) : pendingList.length === 0 ? (
            <div style={{ padding: '50px 20px', textAlign: 'center', color: '#94a3b8', background: '#0a101d', borderRadius: '8px' }}>
              ✓ कोई भी अनुरोध लंबित नहीं है। सभी शोक संदेश स्वीकृत हैं।
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pendingList.map((item) => (
                <div 
                  key={item.id} 
                  style={{ backgroundColor: '#131d33', border: '1px solid #27354f', borderRadius: '10px', padding: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <img 
                      src={item.photoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'} 
                      alt={item.name} 
                      style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #cbd5e1' }} 
                    />
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '17px', color: '#ffffff' }}>
                        स्व० श्री {item.name} ({item.relation || 'स्वजन'})
                      </h4>
                      <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '4px' }}>
                        कार्यक्रम: <b>{item.eventDate}</b> ({item.eventTime || 'समय उपलब्ध नहीं'})
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        स्थान: {item.address} | संपर्क: {item.contactNumber || 'उपलब्ध नहीं'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        परिवार: {item.familyMembers}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => handleApprove(item.id)}
                      style={{ backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      ✓ Approve & Live
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReject(item.id)}
                      style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '9px 16px', fontSize: '13px', cursor: 'pointer' }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: APPROVED / LIVE POSTS */}
      {activeTab === 'approved' && (
        <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>डेटा लोड हो रहा है...</div>
          ) : approvedList.length === 0 ? (
            <div style={{ padding: '50px 20px', textAlign: 'center', color: '#94a3b8' }}>कोई लाइव शोक संदेश नहीं है।</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0a101d', borderBottom: '1px solid #1e293b', color: '#94a3b8', textTransform: 'uppercase', fontSize: '11px' }}>
                    <th style={{ padding: '14px 18px' }}>स्वर्गीय का नाम</th>
                    <th style={{ padding: '14px 18px' }}>कार्यक्रम दिनांक</th>
                    <th style={{ padding: '14px 18px' }}>स्थान</th>
                    <th style={{ padding: '14px 18px' }}>संपर्क</th>
                    <th style={{ padding: '14px 18px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedList.map((item, idx) => (
                    <tr key={item.id} style={{ borderBottom: idx === approvedList.length - 1 ? 'none' : '1px solid #162238' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img 
                            src={item.photoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'} 
                            alt={item.name} 
                            style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }} 
                          />
                          <div>
                            <b style={{ color: '#ffffff' }}>स्व० श्री {item.name}</b>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.relation}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px', color: '#cbd5e1' }}>
                        {item.eventDate}
                      </td>

                      <td style={{ padding: '14px 18px', color: '#94a3b8', maxWidth: '250px' }}>
                        {item.address}
                      </td>

                      <td style={{ padding: '14px 18px', color: '#94a3b8' }}>
                        {item.contactNumber || '-'}
                      </td>

                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.name)}
                          style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ADMIN CREATE SHOK SANDESH */}
      {activeTab === 'create' && (
        <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', padding: '28px', maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#ffffff', margin: '0 0 16px 0' }}>नया शोक संदेश बनाएं (Direct Live)</h2>
          
          <form onSubmit={handleAdminCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>दिवंगत का नाम *</label>
              <input
                type="text"
                required
                placeholder="उदा. रामनारायण प्रसाद जी"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '10px 14px', color: '#ffffff', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>संबंध / नाता</label>
                <input
                  type="text"
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '10px 14px', color: '#ffffff', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>स्वर्गवास तिथि</label>
                <input
                  type="text"
                  placeholder="उदा. 10.04.2026"
                  value={passedDate}
                  onChange={(e) => setPassedDate(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '10px 14px', color: '#ffffff', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>कार्यक्रम दिनांक</label>
                <input
                  type="text"
                  placeholder="उदा. 20-04-2026"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '10px 14px', color: '#ffffff', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>समय</label>
                <input
                  type="text"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '10px 14px', color: '#ffffff', fontSize: '13px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>कार्यक्रम स्थल एवं पता</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="उदा. 545 क/19, राजाजीपुरम, लखनऊ"
                style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '10px 14px', color: '#ffffff', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>शोकाकुल परिवार</label>
              <textarea
                rows={2}
                value={familyMembers}
                onChange={(e) => setFamilyMembers(e.target.value)}
                placeholder="उदा. समस्त परिवार एवं मित्रगण"
                style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '10px 14px', color: '#ffffff', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>फ़ोटो इमेज लिंक (URL)</label>
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '10px 14px', color: '#ffffff', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>संपर्क मोबाइल नंबर</label>
                <input
                  type="tel"
                  placeholder="9829012345"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '10px 14px', color: '#ffffff', fontSize: '13px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '10px 20px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
              >
                रद्द करें
              </button>

              <button
                type="submit"
                disabled={submitting}
                style={{ backgroundColor: '#10b981', border: 'none', color: '#ffffff', padding: '10px 24px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                {submitting ? 'लाइव हो रहा है...' : 'लाइव पब्लिश करें'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}