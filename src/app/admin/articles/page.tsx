'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import styles from '../Admin.module.css';
import { NETWORK_SITES, normalizeSiteId } from '@/lib/portals';
import { fallbackFor } from '@/lib/siteTheme';
import { isArticleLive, toJsDate } from '@/lib/articles';
import { articleTime } from '@/lib/articleQueries';

// Kis portal par: naya siteIds array ya purana siteId
const portalLabel = (a: any) => {
  const ids: string[] = Array.isArray(a.siteIds) && a.siteIds.length ? a.siteIds : a.siteId ? [a.siteId] : [];
  if (ids.length >= NETWORK_SITES.length) return 'सभी पोर्टल';
  if (!ids.length) return '—';
  return ids.map((id) => fallbackFor(normalizeSiteId(id)).name + (NETWORK_SITES.some((n) => n.slug === id) ? '' : ` (${id})`)).join(', ');
};

export default function ArticlesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'articles'), (snapshot) => {
      const artList = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setArticles(artList.sort((x, y) => articleTime(y) - articleTime(x)));
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      // Scheduled/draft khabar bhi turant live — publishAt abhi ka
      await updateDoc(doc(db, 'articles', id), {
        status: 'published',
        publishAt: Timestamp.now()
      });
      alert('लेख स्वीकृत कर दिया गया है और वेबसाइट पर लाइव हो चुका है!');
    } catch (e: any) {
      alert('Approval error: ' + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      await deleteDoc(doc(db, 'articles', id));
    }
  };

  return (
    <div style={{ color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700 }}>Articles ({articles.length})</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Real-time news tracking, live view analytics, and review management</p>
        </div>
        <button 
          onClick={() => router.push('/admin/articles/new')} 
          className={styles.btnPrimary}
        >
          + New Article
        </button>
      </div>

      <div className={styles.formCard} style={{ overflowX: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', background: '#0b1120', color: '#94a3b8' }}>
              <th style={{ padding: '14px 16px' }}>Title</th>
              <th style={{ padding: '14px 16px' }}>Author</th>
              <th style={{ padding: '14px 16px' }}>Portal Site</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 16px' }}>Views</th>
              <th style={{ padding: '14px 16px' }}>Date</th>
              <th style={{ padding: '14px 16px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>Loading articles...</td>
              </tr>
            ) : articles.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                  No articles yet.
                </td>
              </tr>
            ) : (
              articles.map((a) => {
                const rawStatus = String(a.status || '').trim().toLowerCase();
                const isPublished = isArticleLive(a);
                const isScheduled = rawStatus === 'scheduled' && !isPublished;
                const at = toJsDate(a.publishAt);

                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, maxWidth: '320px' }}>
                      {a.title}
                      {a.titleHi && a.titleHi !== a.title && (
                        <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 400 }}>{a.titleHi}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#38bdf8' }}>
                      {a.authorName || a.author || 'Staff'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#fb923c' }}>
                      {portalLabel(a)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        fontSize: '11px', 
                        padding: '3px 10px', 
                        borderRadius: '12px', 
                        fontWeight: 700,
                        background: isPublished ? '#065f46' : isScheduled ? '#3b0764' : '#451a03', 
                        color: isPublished ? '#34d399' : isScheduled ? '#d8b4fe' : '#fbbf24' 
                      }}>
                        {isPublished ? 'Published' : isScheduled ? 'Scheduled' : rawStatus === 'draft' ? 'Draft' : 'Pending'}
                      </span>
                      {isScheduled && at && (
                        <div style={{ fontSize: '11px', color: '#c4b5fd', marginTop: '4px' }}>
                          {at.toLocaleString('hi-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#38bdf8' }}>
                      👁️ {a.views ?? 0}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#94a3b8' }}>
                      {a.createdAt ? String(a.createdAt).split('T')[0] : 'Today'}
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      {!isPublished && (
                        <button 
                          onClick={() => handleApprove(a.id)}
                          style={{ 
                            color: '#22c55e', 
                            background: 'none', 
                            border: '1px solid #22c55e', 
                            padding: '3px 8px', 
                            borderRadius: '4px', 
                            cursor: 'pointer', 
                            marginRight: '10px',
                            fontWeight: 700,
                            fontSize: '12px'
                          }}
                        >
                          स्वीकृत करें
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(a.id)} 
                        style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}