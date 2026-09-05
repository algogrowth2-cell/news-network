'use client';
import { useState, useEffect } from 'react';
import { collection, doc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import styles from '../Admin.module.css';

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'comments'), (snapshot) => {
      setComments(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleVerify = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'comments', id), {
        status: newStatus
      });
      alert(newStatus === 'approved' ? 'टिप्पणी स्वीकृत कर दी गई है और वेबसाइट पर लाइव हो गई है!' : 'टिप्पणी अस्वीकृत कर दी गई है');
    } catch (e: any) {
      alert('Error: ' + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      await deleteDoc(doc(db, 'comments', id));
    }
  };

  const filteredComments = comments.filter(c => {
    if (filter === 'all') return true;
    return c.status === filter;
  });

  return (
    <div style={{ color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Comments Moderation ({comments.length})</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Review, verify, and approve reader comments before publishing live</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {(['pending', 'approved', 'all'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: 'none',
                background: filter === tab ? '#ea580c' : '#1e293b',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '12.5px',
                fontWeight: 600,
                textTransform: 'capitalize'
              }}
            >
              {tab === 'pending' ? `Pending (${comments.filter(c => c.status === 'pending').length})` : tab}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.formCard} style={{ overflowX: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', background: '#0b1120', color: '#94a3b8' }}>
              <th style={{ padding: '14px 16px' }}>Article</th>
              <th style={{ padding: '14px 16px' }}>User</th>
              <th style={{ padding: '14px 16px' }}>Comment</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 16px' }}>Date</th>
              <th style={{ padding: '14px 16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>Loading comments...</td></tr>
            ) : filteredComments.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>No comments found under this filter.</td></tr>
            ) : (
              filteredComments.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #1e293b' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, maxWidth: '200px' }}>
                    {c.articleTitle || c.articleId}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ color: '#38bdf8', fontWeight: 600 }}>{c.userName}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>{c.userEmail}</div>
                  </td>
                  <td style={{ padding: '12px 16px', maxWidth: '300px', color: '#e2e8f0', lineHeight: '1.4' }}>
                    {c.text}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: c.status === 'approved' ? '#065f46' : c.status === 'rejected' ? '#7f1d1d' : '#854d0e',
                      color: c.status === 'approved' ? '#34d399' : c.status === 'rejected' ? '#fca5a5' : '#fde047',
                      fontWeight: 700
                    }}>
                      {c.status === 'approved' ? 'स्वीकृत (Live)' : c.status === 'pending' ? 'समीक्षा में' : 'अस्वीकृत'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                    {c.createdAt || 'Today'}
                  </td>
                  <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                    {c.status !== 'approved' && (
                      <button
                        onClick={() => handleVerify(c.id, 'approved')}
                        style={{ color: '#22c55e', background: 'none', border: '1px solid #22c55e', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}
                      >
                        स्वीकृत करें
                      </button>
                    )}
                    {c.status !== 'rejected' && (
                      <button
                        onClick={() => handleVerify(c.id, 'rejected')}
                        style={{ color: '#f59e0b', background: 'none', border: '1px solid #f59e0b', padding: '3px 8px', borderRadius: '4px', cursor: 'pointer', marginRight: '8px' }}
                      >
                        अस्वीकृत
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(c.id)}
                      style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}