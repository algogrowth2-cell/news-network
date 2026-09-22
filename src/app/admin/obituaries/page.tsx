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
  query 
} from 'firebase/firestore';

interface ShokSandeshAdminItem {
  id: string;
  name?: string;
  deceased?: string;
  relation?: string;
  passedDate?: string;
  eventDate?: string;
  eventTime?: string;
  venue?: string;
  address?: string;
  city?: string;
  familyMembers?: string;
  family?: string;
  contactNumber?: string;
  photoUrl?: string;
  templateId?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: any;
}

export default function AdminObituariesPage() {
  const [items, setItems] = useState<ShokSandeshAdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');
  const [showModal, setShowModal] = useState(false);

  // Form State for Admin New Entry
  const [formData, setFormData] = useState({
    name: '',
    relation: 'पिता जी',
    passedDate: '',
    eventDate: '',
    eventTime: 'अपराह्न 1:00 बजे के उपरांत',
    venue: 'निवास स्थल',
    address: '',
    familyMembers: '',
    contactNumber: '',
    photoUrl: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // 1. Real-time sync with shok_sandesh collection
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'shok_sandesh'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ShokSandeshAdminItem[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || data.deceased || 'अज्ञात स्वजन',
          deceased: data.name || data.deceased || 'अज्ञात स्वजन',
          relation: data.relation || 'स्वजन',
          passedDate: data.passedDate || '',
          eventDate: data.eventDate || '',
          eventTime: data.eventTime || '',
          venue: data.venue || '',
          address: data.address || data.city || '',
          city: data.city || data.address || '',
          familyMembers: data.familyMembers || data.family || '',
          family: data.familyMembers || data.family || '',
          contactNumber: data.contactNumber || '',
          photoUrl: data.photoUrl || '',
          templateId: data.templateId || 'floral-white',
          status: (data.status || 'pending').toLowerCase() as any,
          createdAt: data.createdAt
        };
      });

      setItems(list);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching admin obituaries:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Approve Handler (Makes card live on public page)
  const handleApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, 'shok_sandesh', id), {
        status: 'approved'
      });
      alert('शोक संदेश स्वीकृत कर दिया गया है और अब मुख्य वेबसाइट पर लाइव है!');
    } catch (err: any) {
      alert('Approval Error: ' + err.message);
    }
  };

  // 3. Reject Handler
  const handleReject = async (id: string) => {
    if (!confirm('क्या आप इस अनुरोध को अस्वीकार (Reject) करना चाहते हैं?')) return;
    try {
      await updateDoc(doc(db, 'shok_sandesh', id), {
        status: 'rejected'
      });
    } catch (err: any) {
      alert('Reject Error: ' + err.message);
    }
  };

  // 4. Delete Handler
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`क्या आप "${name}" का शोक संदेश स्थायी रूप से हटाना चाहते हैं?`)) return;
    try {
      await deleteDoc(doc(db, 'shok_sandesh', id));
    } catch (err: any) {
      alert('Delete Error: ' + err.message);
    }
  };

  // 5. Admin Direct Add
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('कृपया नाम दर्ज करें।');
      return;
    }

    try {
      setSubmitting(true);
      await addDoc(collection(db, 'shok_sandesh'), {
        name: formData.name.trim(),
        relation: formData.relation.trim(),
        passedDate: formData.passedDate || 'हाल ही में',
        eventDate: formData.eventDate || '',
        eventTime: formData.eventTime || '',
        venue: formData.venue || '',
        address: formData.address || '',
        familyMembers: formData.familyMembers || '',
        contactNumber: formData.contactNumber || '',
        photoUrl: formData.photoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
        templateId: 'floral-white',
        status: 'approved',
        createdAt: serverTimestamp()
      });

      setShowModal(false);
      setSubmitting(false);
      setFormData({
        name: '',
        relation: 'पिता जी',
        passedDate: '',
        eventDate: '',
        eventTime: 'अपराह्न 1:00 बजे के उपरांत',
        venue: 'निवास स्थल',
        address: '',
        familyMembers: '',
        contactNumber: '',
        photoUrl: ''
      });
      alert('शोक संदेश सफलतापूर्वक बना दिया गया और लाइव हो गया!');
    } catch (err: any) {
      setSubmitting(false);
      alert('Error: ' + err.message);
    }
  };

  const pendingItems = items.filter(i => i.status === 'pending');
  const approvedItems = items.filter(i => i.status === 'approved');

  const displayedItems = activeTab === 'pending' 
    ? pendingItems 
    : activeTab === 'approved' 
    ? approvedItems 
    : items;

  return (
    <div style={{ padding: '24px', backgroundColor: '#070b14', minHeight: '100vh', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0' }}>
            शोक संदेश / श्रद्धांजलि ({items.length})
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            Obituary notices, memorial listings & condolences
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowModal(true)}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '9px 18px',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            + New Entry
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('pending')}
          style={{
            backgroundColor: activeTab === 'pending' ? '#f59e0b' : '#0e1626',
            color: activeTab === 'pending' ? '#000000' : '#fbbf24',
            border: '1px solid #f59e0b',
            borderRadius: '6px',
            padding: '7px 16px',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Pending Approval ({pendingItems.length})
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          style={{
            backgroundColor: activeTab === 'approved' ? '#10b981' : '#0e1626',
            color: activeTab === 'approved' ? '#ffffff' : '#94a3b8',
            border: '1px solid #1e293b',
            borderRadius: '6px',
            padding: '7px 16px',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Live Approved ({approvedItems.length})
        </button>

        <button
          onClick={() => setActiveTab('all')}
          style={{
            backgroundColor: activeTab === 'all' ? '#1e293b' : '#0e1626',
            color: '#ffffff',
            border: '1px solid #1e293b',
            borderRadius: '6px',
            padding: '7px 16px',
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          All ({items.length})
        </button>
      </div>

      {/* Main Table Matching your exact Screenshot Header */}
      <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '10px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            डेटा लोड हो रहा है...
          </div>
        ) : displayedItems.length === 0 ? (
          <div style={{ padding: '80px 20px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
            No condolences recorded yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#0a101d', borderBottom: '1px solid #1e293b', color: '#94a3b8', fontSize: '12px' }}>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Type</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Deceased</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Family</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>City / Address</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedItems.map((item, idx) => (
                  <tr 
                    key={item.id} 
                    style={{ 
                      borderBottom: idx === displayedItems.length - 1 ? 'none' : '1px solid #162238'
                    }}
                  >
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ fontSize: '11px', background: '#1e293b', color: '#94a3b8', padding: '3px 8px', borderRadius: '4px', textTransform: 'capitalize' }}>
                        {item.templateId || 'Standard'}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {item.photoUrl && (
                          <img 
                            src={item.photoUrl} 
                            alt={item.name} 
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #475569' }} 
                          />
                        )}
                        <div>
                          <div style={{ color: '#ffffff', fontWeight: 600 }}>स्व० {item.name}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>{item.relation}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px', color: '#cbd5e1', maxWidth: '200px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.familyMembers || '-'}
                      </div>
                      {item.contactNumber && (
                        <div style={{ fontSize: '11px', color: '#64748b' }}>मो: {item.contactNumber}</div>
                      )}
                    </td>

                    <td style={{ padding: '14px 18px', color: '#94a3b8', maxWidth: '180px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.address || '-'}
                      </div>
                    </td>

                    <td style={{ padding: '14px 18px', color: '#cbd5e1', fontSize: '12px' }}>
                      <div><b>कार्यक्रम:</b> {item.eventDate || '-'}</div>
                      <div style={{ color: '#64748b', fontSize: '11px' }}>स्वर्गवास: {item.passedDate || '-'}</div>
                    </td>

                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: 
                            item.status === 'approved' ? 'rgba(16, 185, 129, 0.15)' :
                            item.status === 'pending' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: 
                            item.status === 'approved' ? '#34d399' :
                            item.status === 'pending' ? '#fbbf24' : '#f87171',
                          border: `1px solid ${
                            item.status === 'approved' ? 'rgba(16, 185, 129, 0.3)' :
                            item.status === 'pending' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                          }`
                        }}
                      >
                        {item.status === 'pending' ? '⏳ Pending Review' : item.status === 'approved' ? '✓ Live' : item.status}
                      </span>
                    </td>

                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        {item.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleApprove(item.id)}
                            style={{
                              backgroundColor: '#10b981',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '5px',
                              padding: '5px 12px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            Approve
                          </button>
                        )}

                        {item.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleReject(item.id)}
                            style={{
                              backgroundColor: '#334155',
                              color: '#cbd5e1',
                              border: 'none',
                              borderRadius: '5px',
                              padding: '5px 10px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            Reject
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.name || '')}
                          style={{
                            backgroundColor: 'transparent',
                            color: '#f87171',
                            border: '1px solid #334155',
                            borderRadius: '5px',
                            padding: '5px 10px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin New Entry Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: '#0e1626', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: '0 0 16px 0' }}>
              नया शोक संदेश जोड़ें (Direct Live)
            </h2>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>दिवंगत का नाम *</label>
                <input
                  type="text"
                  required
                  placeholder="उदा. रामनारायण प्रसाद जी"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '8px 12px', color: '#ffffff', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>संबंध</label>
                  <input
                    type="text"
                    value={formData.relation}
                    onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '8px 12px', color: '#ffffff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>स्वर्गवास तिथि</label>
                  <input
                    type="text"
                    placeholder="10.04.2026"
                    value={formData.passedDate}
                    onChange={(e) => setFormData({ ...formData, passedDate: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '8px 12px', color: '#ffffff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>कार्यक्रम दिनांक</label>
                  <input
                    type="text"
                    placeholder="20-04-2026"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '8px 12px', color: '#ffffff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>समय</label>
                  <input
                    type="text"
                    value={formData.eventTime}
                    onChange={(e) => setFormData({ ...formData, eventTime: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '8px 12px', color: '#ffffff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>पता / स्थान</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '8px 12px', color: '#ffffff', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>शोकाकुल परिवार</label>
                <textarea
                  rows={2}
                  value={formData.familyMembers}
                  onChange={(e) => setFormData({ ...formData, familyMembers: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '8px 12px', color: '#ffffff', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>फ़ोटो URL</label>
                  <input
                    type="url"
                    value={formData.photoUrl}
                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '8px 12px', color: '#ffffff', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>संपर्क नंबर</label>
                  <input
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#162238', border: '1px solid #27354f', borderRadius: '6px', padding: '8px 12px', color: '#ffffff', fontSize: '13px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#94a3b8', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ backgroundColor: '#2563eb', border: 'none', color: '#ffffff', padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                >
                  {submitting ? 'Saving...' : 'Save & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}