'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, increment, collection, addDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function ArticleDetails() {
  const params = useParams();
  const articleId = params?.id as string;
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // User & Comments State
  const [readerUser, setReaderUser] = useState<any>(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [commentSent, setCommentSent] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem('reader_user');
    if (cached) {
      try {
        setReaderUser(JSON.parse(cached));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    async function loadArticle() {
      if (!articleId) return;
      try {
        const ref = doc(db, 'articles', articleId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setArticle(snap.data());
          await updateDoc(ref, { views: increment(1) });
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    loadArticle();

    // Approved comments listener for this article
    const q = query(
      collection(db, 'comments'),
      where('articleId', '==', articleId),
      where('status', '==', 'approved')
    );
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [articleId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!readerUser) return;
    if (!commentText.trim()) return alert('कृपया टिप्पणी लिखें');

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'comments'), {
        articleId,
        articleTitle: article?.title || 'Article',
        userId: readerUser.id || '',
        userName: readerUser.name || 'पाठक',
        userEmail: readerUser.email || '',
        text: commentText.trim(),
        status: 'pending', // Verification required by Admin
        createdAt: new Date().toISOString().split('T')[0],
        timestamp: serverTimestamp()
      });

      setCommentText('');
      setCommentSent(true);
    } catch (err: any) {
      alert('Error submitting comment: ' + err.message);
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div style={{ padding: '80px', textAlign: 'center', fontFamily: 'system-ui' }}>खबर लोड हो रही है...</div>;
  }

  if (!article) {
    return (
      <div style={{ padding: '80px', textAlign: 'center', fontFamily: 'system-ui' }}>
        <h2>खबर नहीं मिली</h2>
        <Link href="/" style={{ color: '#ea580c', textDecoration: 'none', fontWeight: 700 }}>← होम पेज पर जाएं</Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Top Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '14px 20px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#ea580c', fontWeight: 900, textDecoration: 'none', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            ← द लोकल लीडर
          </Link>
          <span style={{ fontSize: '13px', color: '#64748b' }}>{article.createdAt || 'आज'}</span>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '900px', margin: '30px auto', padding: '0 20px', flex: 1, width: '100%', boxSizing: 'border-box' }}>
        <span style={{ background: '#ea580c', color: '#fff', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '3px', textTransform: 'uppercase' }}>
          {article.category || 'National'}
        </span>

        <h1 style={{ fontSize: '30px', fontWeight: 900, lineHeight: '1.3', margin: '14px 0 10px 0', color: '#0f172a' }}>
          {article.title}
        </h1>

        {article.titleHi && (
          <h2 style={{ fontSize: '19px', fontWeight: 600, color: '#475569', margin: '0 0 20px 0' }}>
            {article.titleHi}
          </h2>
        )}

        <div style={{ width: '100%', height: '420px', borderRadius: '8px', overflow: 'hidden', margin: '20px 0', background: '#000' }}>
          <img src={article.image || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200'} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        {article.summary && (
          <p style={{ fontSize: '16.5px', fontWeight: 600, color: '#334155', lineHeight: '1.6', borderLeft: '4px solid #ea580c', paddingLeft: '16px', margin: '24px 0' }}>
            {article.summary}
          </p>
        )}

        <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#1e293b', whiteSpace: 'pre-line', marginBottom: '40px' }}>
          {article.content || article.summary}
        </div>

        {/* COMMENTS SECTION */}
        <section style={{ borderTop: '2px solid #e2e8f0', paddingTop: '32px', marginTop: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <span style={{ fontSize: '20px' }}>💬</span>
            <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#1e293b' }}>
              पाठकों की राय / टिप्पणियां ({comments.length})
            </h3>
          </div>

          {/* Comment Form / Login Requirement Guard */}
          {readerUser ? (
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '28px', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ width: '28px', height: '28px', background: '#ea580c', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700 }}>
                  {readerUser.name ? readerUser.name[0].toUpperCase() : 'U'}
                </span>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b' }}>
                  {readerUser.name} <span style={{ color: '#64748b', fontWeight: 400, fontSize: '12px' }}>({readerUser.email})</span>
                </span>
              </div>

              <form onSubmit={handleCommentSubmit}>
                <textarea
                  rows={3}
                  required
                  placeholder="इस खबर पर अपनी राय या टिप्पणी दर्ज करें..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
                
                {commentSent && (
                  <div style={{ marginTop: '8px', fontSize: '12.5px', color: '#059669', background: '#ecfdf5', padding: '8px 12px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                    ✓ आपकी टिप्पणी सफलतापूर्वक जमा हो गई है। एडमिन की समीक्षा व सत्यापन के बाद यह सार्वजनिक रूप से दिखाई देगी।
                  </div>
                )}

                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ background: '#ea580c', color: '#fff', border: 'none', borderRadius: '6px', padding: '10px 20px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                  >
                    {submitting ? 'जमा हो रहा है...' : 'टिप्पणी भेजें'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', padding: '18px', textAlign: 'center', marginBottom: '28px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 600, color: '#9a3412' }}>
                टिप्पणी करने के लिए कृपया अपने पाठक खाते में लॉगिन करें।
              </p>
              <Link
                href="/login"
                style={{ background: '#ea580c', color: '#fff', textDecoration: 'none', padding: '8px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, display: 'inline-block' }}
              >
                लॉगिन करें / रजिस्टर करें
              </Link>
            </div>
          )}

          {/* Approved Comments List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {comments.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '13.5px', textAlign: 'center', padding: '24px 0' }}>
                अभी इस लेख पर कोई स्वीकृत टिप्पणी नहीं है। पहली टिप्पणी करें!
              </div>
            ) : (
              comments.map((c) => (
                <div key={c.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#1e293b' }}>👤 {c.userName}</span>
                    <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>{c.createdAt || 'आज'}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: '1.5' }}>
                    {c.text}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

      </main>

      <Footer siteName="द लोकल लीडर" primaryColor="#ea580c" />
    </div>
  );
}