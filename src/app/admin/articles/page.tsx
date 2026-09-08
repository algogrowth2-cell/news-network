'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'articles'), (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      setArticles(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleStatusChange = async (articleId: string, newStatus: string) => {
    setActionLoading(articleId);
    try {
      await updateDoc(doc(db, 'articles', articleId), {
        status: newStatus
      });
    } catch (err) {
      console.error('Error updating status:', err);
      alert('स्टेटस बदलने में समस्या आई।');
    }
    setActionLoading(null);
  };

  const handleDelete = async (articleId: string) => {
    if (!window.confirm('क्या आप वाकई इस आर्टिकल को डिलीट करना चाहते हैं?')) return;
    try {
      await deleteDoc(doc(db, 'articles', articleId));
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  return (
    <div style={{ padding: '24px', color: '#fff', background: '#0b1329', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 6px 0' }}>
            Articles ({articles.length})
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
            Real-time news tracking, live view analytics, and review management
          </p>
        </div>

        <Link
          href="/admin/articles/new"
          style={{
            background: '#2563eb',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 700
          }}
        >
          + New Article
        </Link>
      </div>

      <div style={{ background: '#111c38', borderRadius: '12px', border: '1px solid #1e293b', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e293b', background: '#0b1120', color: '#94a3b8' }}>
                <th style={{ padding: '14px 18px' }}>Title</th>
                <th style={{ padding: '14px 18px' }}>Author</th>
                <th style={{ padding: '14px 18px' }}>Portal Site</th>
                <th style={{ padding: '14px 18px' }}>Status</th>
                <th style={{ padding: '14px 18px' }}>Views</th>
                <th style={{ padding: '14px 18px' }}>Date</th>
                <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                    लोड हो रहा है...
                  </td>
                </tr>
              ) : articles.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                    कोई आर्टिकल नहीं मिला।
                  </td>
                </tr>
              ) : (
                articles.map((art) => {
                  const rawStatus = String(art.status || 'published').trim().toLowerCase();
                  const isPending = rawStatus === 'pending' || rawStatus === 'pending_review';
                  const isPublished = rawStatus === 'published' || rawStatus === 'approved';

                  return (
                    <tr key={art.id} style={{ borderBottom: '1px solid #1e2942' }}>
                      <td style={{ padding: '14px 18px', maxWidth: '320px', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {art.title}
                      </td>

                      <td style={{ padding: '14px 18px', color: '#38bdf8' }}>
                        {art.authorName || art.author || 'Staff'}
                      </td>

                      <td style={{ padding: '14px 18px', color: '#fb923c' }}>
                        {art.siteId || 'the-local-leader'}
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '12px',
                          background: isPublished ? '#064e3b' : isPending ? '#451a03' : '#334155',
                          color: isPublished ? '#34d399' : isPending ? '#fbbf24' : '#94a3b8'
                        }}>
                          {isPublished ? 'Published' : isPending ? 'pending' : art.status}
                        </span>
                      </td>

                      <td style={{ padding: '14px 18px', color: '#94a3b8' }}>
                        👁️ {art.views || 0}
                      </td>

                      <td style={{ padding: '14px 18px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {art.createdAt ? String(art.createdAt).split('T')[0] : '-'}
                      </td>

                      <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          
                          {/* 🟢 DIRECT APPROVE / UNPUBLISH TOGGLE */}
                          {isPending ? (
                            <button
                              onClick={() => handleStatusChange(art.id, 'published')}
                              disabled={actionLoading === art.id}
                              style={{
                                background: '#15803d',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '5px 12px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              {actionLoading === art.id ? '...' : '✓ Approve'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(art.id, 'pending')}
                              disabled={actionLoading === art.id}
                              style={{
                                background: '#334155',
                                color: '#94a3b8',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '5px 10px',
                                fontSize: '11px',
                                cursor: 'pointer'
                              }}
                            >
                              Hold
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(art.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              fontSize: '12px',
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                          >
                            Delete
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}