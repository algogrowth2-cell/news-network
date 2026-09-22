'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { doc, getDoc, collection, addDoc, query, where, limit, getDocs, onSnapshot, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import Footer from '@/components/Footer';

interface ArticleDetail {
  id: string;
  title: string;
  titleHi?: string;
  content?: string;
  summary?: string;
  image?: string;
  category?: string;
  createdAt?: string;
  views?: number;
  siteId?: string;
  authorName?: string;
}

interface CommentItem {
  id: string;
  userName: string;
  comment: string;
  createdAt: string;
  status: string;
}

const DEFAULT_SITES_CONFIG: Record<string, any> = {
  'the-local-leader': {
    name: 'द लोकल लीडर',
    primaryColor: '#ea580c',
    description: '— जनता की आवाज़, सच्चाई के साथ —'
  },
  'bazar-karobar': {
    name: 'बाजार कारोबार',
    primaryColor: '#059669',
    description: '— व्यापार, अर्थव्यवस्था और बाज़ार का सच्चा दर्पण —'
  },
  'golden-pearl-chronicles': {
    name: 'गोल्डन पर्ल क्रॉनिकल्स',
    primaryColor: '#d97706',
    description: '— साहित्य, कला एवं संस्कृति की धरोहर —'
  },
  'the-provue-times': {
    name: 'द प्रोव्यू टाइम्स',
    primaryColor: '#2563eb',
    description: '— निष्पक्ष दृष्टि, निर्भीक विश्लेषण —'
  },
  'desh-ki-aawaz': {
    name: 'देश की आवाज़',
    primaryColor: '#dc2626',
    description: '— हर भारतीय का मंच, हर दिल की पुकार —'
  },
  'jan-bharat-news': {
    name: 'जन भारत न्यूज़',
    primaryColor: '#7c3aed',
    description: '— जन-जन की खबर, देश के कोने-कोने से —'
  },
  'news-info-24': {
    name: 'NEWS INFO 24',
    primaryColor: '#0284c7',
    description: '— 24 घंटे सबसे तेज़, सबसे सटीक ख़बरें —'
  },
  'ndn-defence': {
    name: 'National Defence Network',
    primaryColor: '#15803d',
    description: '— राष्ट्र रक्षा, सामरिक शक्ति और सुरक्षा विश्लेषण —'
  }
};

export default function ArticleDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const articleId = params?.id as string;

  const [siteSlug, setSiteSlug] = useState<string>('the-local-leader');
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<ArticleDetail[]>([]);
  const [trendingArticles, setTrendingArticles] = useState<ArticleDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [readerUser, setReaderUser] = useState<any>(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);

  // 1. Reader Auth Check
  useEffect(() => {
    const cached = localStorage.getItem('reader_user');
    if (cached) {
      try { setReaderUser(JSON.parse(cached)); } catch (e) { console.error(e); }
    }
  }, []);

  // 2. Fetch Article Details
  useEffect(() => {
    if (!articleId) return;
    async function fetchArticle() {
      setLoading(true);
      try {
        const docRef = doc(db, 'articles', articleId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as ArticleDetail;
          setArticle(data);
          const querySite = searchParams.get('site');
          const finalSlug = (querySite || data.siteId || 'the-local-leader').toLowerCase();
          setSiteSlug(finalSlug);
          updateDoc(docRef, { views: increment(1) }).catch(() => {});
        }
      } catch (err) { 
        console.error('Error fetching article:', err); 
      }
      setLoading(false);
    }
    fetchArticle();
  }, [articleId, searchParams]);

  // 3. Live Site Config Fetch
  useEffect(() => {
    if (!siteSlug) return;
    const unsubSite = onSnapshot(doc(db, 'sites', siteSlug), (snap) => {
      if (snap.exists()) {
        setSiteConfig({ slug: siteSlug, ...snap.data() });
      } else {
        const fallback = DEFAULT_SITES_CONFIG[siteSlug] || DEFAULT_SITES_CONFIG['the-local-leader'];
        setSiteConfig({
          slug: siteSlug, name: fallback.name, primaryColor: fallback.primaryColor,
          logoUrl: `/logos/${siteSlug}.jpeg`, description: fallback.description
        });
      }
    });
    return () => unsubSite();
  }, [siteSlug]);

  // 4. Fetch Related & Trending Articles
  useEffect(() => {
    if (!siteSlug) return;
    async function fetchSideArticles() {
      try {
        const qSide = query(
          collection(db, 'articles'),
          where('siteId', 'in', [siteSlug, siteSlug.toLowerCase()]),
          limit(8)
        );
        const snap = await getDocs(qSide);
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as ArticleDetail))
          .filter((item) => item.id !== articleId);
        
        setRelatedArticles(list.slice(0, 4));
        setTrendingArticles(list.slice(4, 8).length > 0 ? list.slice(4, 8) : list.slice(0, 4));
      } catch (e) {
        console.error('Sidebar articles fetch error:', e);
      }
    }
    fetchSideArticles();
  }, [siteSlug, articleId]);

  // 5. Comments Real-time Listener
  useEffect(() => {
    if (!articleId) return;
    const qComments = query(
      collection(db, 'comments'),
      where('articleId', '==', articleId),
      where('status', '==', 'approved')
    );
    const unsubComments = onSnapshot(qComments, (snap) => {
      const list: CommentItem[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as CommentItem));
      setComments(list);
    });
    return () => unsubComments();
  }, [articleId]);

  // Handle Comment Submission
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!readerUser) { alert('कृपया टिप्पणी करने के लिए पहले लॉगिन करें।'); return; }
    setCommentSubmitting(true);
    try {
      await addDoc(collection(db, 'comments'), {
        articleId, 
        articleTitle: article?.title || '', 
        siteId: siteSlug,
        userName: readerUser.name || 'पाठक', 
        userEmail: readerUser.email || '',
        comment: newComment.trim(), 
        createdAt: new Date().toISOString().split('T')[0], 
        status: 'pending'
      });
      setNewComment('');
      setCommentSuccess(true);
      setTimeout(() => setCommentSuccess(false), 5000);
    } catch (err) { 
      console.error('Error posting comment:', err); 
      alert('टिप्पणी पोस्ट करने में समस्या आई।'); 
    }
    setCommentSubmitting(false);
  };

  const handleShare = (platform: 'whatsapp' | 'facebook' | 'twitter' | 'copy') => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareText = encodeURIComponent(`${article?.title} - ${siteName}`);

    if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${shareText}%20${encodeURIComponent(currentUrl)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(currentUrl)}`, '_blank');
    } else {
      navigator.clipboard.writeText(currentUrl);
      alert('खबर का लिंक कॉपी हो गया है!');
    }
  };

  const primary = siteConfig?.primaryColor || '#ea580c';
  const siteName = siteConfig?.name || 'द लोकल लीडर';
  const siteLogo = siteConfig?.logoUrl || `/logos/${siteSlug}.jpeg`;
  const siteTagline = siteConfig?.description || '— जनता की आवाज़, सच्चाई के साथ —';
  const cssVars = { '--ap-primary': primary } as React.CSSProperties;

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontFamily: '"Mukta", system-ui, sans-serif' }}>
        <div style={{ width: '38px', height: '38px', border: '3px solid #e2e8f0', borderTop: `3px solid ${primary}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '14px' }} />
        <style jsx global>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span style={{ fontSize: '14px', fontWeight: 600 }}>खबर लोड हो रही है…</span>
      </div>
    );
  }

  if (!article) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px', padding: '24px', textAlign: 'center', fontFamily: '"Mukta", system-ui, sans-serif' }}>
        <span style={{ fontSize: '48px' }}>📰</span>
        <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>यह खबर उपलब्ध नहीं है</h2>
        <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '360px' }}>शायद यह खबर हटा दी गई है या लिंक गलत है।</p>
        <Link href={`/?site=${siteSlug}`} style={{ background: primary, color: '#fff', padding: '10px 22px', borderRadius: '8px', fontSize: '13.5px', fontWeight: 700, textDecoration: 'none' }}>
          ← मुख्य पृष्ठ पर वापस जाएं
        </Link>
      </div>
    );
  }

  return (
    <div className="ap-wrapper" style={{ ...cssVars, minHeight: '100vh', backgroundColor: '#f1f5f9', color: '#0f172a', fontFamily: '"Mukta", -apple-system, system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
      
      {/* ── TOP STICKY HEADER ── */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
        <div style={{ maxWidth: '1380px', margin: '0 auto', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link href={`/?site=${siteSlug}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: primary, fontWeight: 700, fontSize: '14px' }}>
              <span style={{ fontSize: '18px' }}>←</span>
              <span>{siteName}</span>
            </Link>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>{article.category || 'National'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <time style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>{article.createdAt || 'आज'}</time>
            <Link href={`/?site=${siteSlug}`} style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '5px 12px', borderRadius: '6px', fontSize: '12px', color: '#334155', textDecoration: 'none', fontWeight: 600 }}>
              होम
            </Link>
          </div>
        </div>
      </header>

      {/* ── MAIN 2-COLUMN CONTAINER ── */}
      <div style={{ maxWidth: '1380px', width: '100%', margin: '0 auto', padding: '24px 16px 48px', flex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '28px', alignItems: 'start' }} className="article-grid-layout">
        
        {/* ── LEFT COLUMN: MAIN ARTICLE ── */}
        <main style={{ minWidth: 0 }}>
          <article style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '28px clamp(16px, 3.5vw, 36px)', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            
            {/* Category & Date */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ backgroundColor: primary, color: '#ffffff', fontSize: '11px', fontWeight: 800, padding: '4px 12px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                {article.category || 'ताज़ा खबर'}
              </span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                {article.createdAt || 'हाल ही में'}
              </span>
            </div>

            {/* Headline */}
            <h1 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: '#0f172a', lineHeight: 1.38, margin: '0 0 18px 0', fontFamily: 'Georgia, serif' }}>
              {article.title}
            </h1>

            {/* Author, Views & Share Buttons Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', marginBottom: '22px', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: primary, display: 'grid', placeItems: 'center', color: '#ffffff', fontWeight: 800, fontSize: '15px' }}>
                  {(article.authorName || siteName).charAt(0)}
                </span>
                <div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>{article.authorName || siteName}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>संपादकीय टीम · 👁️ {(article.views || 1).toLocaleString()} बार पढ़ा गया</div>
                </div>
              </div>

              {/* Social Share Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button type="button" onClick={() => handleShare('whatsapp')} title="WhatsApp पर शेयर करें" style={{ backgroundColor: '#25D366', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>🟢</span> WhatsApp
                </button>
                <button type="button" onClick={() => handleShare('facebook')} title="Facebook पर शेयर करें" style={{ backgroundColor: '#1877F2', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                  Facebook
                </button>
                <button type="button" onClick={() => handleShare('copy')} title="लिंक कॉपी करें" style={{ backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  🔗 कॉपी लिंक
                </button>
              </div>
            </div>

            {/* Featured Image */}
            {article.image && (
              <div style={{ width: '100%', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#0f172a', marginBottom: '24px', boxShadow: '0 4px 14px rgba(0,0,0,0.06)' }}>
                <img src={article.image} alt={article.title} style={{ width: '100%', maxHeight: '520px', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
              </div>
            )}

            {/* Summary Highlight Box */}
            {article.summary && (
              <div style={{ backgroundColor: '#f8fafc', borderLeft: `4px solid ${primary}`, padding: '16px 20px', borderRadius: '0 10px 10px 0', marginBottom: '24px', fontSize: '15.5px', fontWeight: 600, color: '#334155', lineHeight: 1.7 }}>
                {article.summary}
              </div>
            )}

            {/* Detailed Body */}
            <div style={{ fontSize: '17px', lineHeight: 1.85, color: '#1e293b', whiteSpace: 'pre-line', marginBottom: '32px' }}>
              {article.content || article.summary || 'खबर का विस्तृत विवरण जल्द ही उपलब्ध कराया जाएगा।'}
            </div>

            {/* In-Article Share Footer */}
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>इस खबर को अपने दोस्तों के साथ साझा करें:</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleShare('whatsapp')} style={{ background: '#25D366', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>WhatsApp</button>
                <button onClick={() => handleShare('twitter')} style={{ background: '#000', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>X (Twitter)</button>
              </div>
            </div>

          </article>

          {/* ── COMMENTS SECTION ── */}
          <section style={{ marginTop: '32px', backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px clamp(16px, 3vw, 32px)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 18px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              पाठकों की राय / टिप्पणियां
              <span style={{ backgroundColor: '#f1f5f9', color: '#475569', fontSize: '12px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px' }}>
                {comments.length}
              </span>
            </h3>

            {readerUser ? (
              <form onSubmit={handlePostComment} style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: primary, display: 'grid', placeItems: 'center', color: '#fff', fontSize: '12px', fontWeight: 800 }}>
                    {(readerUser.name || readerUser.email || 'प').charAt(0)}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>{readerUser.name || readerUser.email}</span>
                </div>
                <textarea
                  required
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="इस खबर पर अपनी राय लिखें…"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box', backgroundColor: '#f8fafc' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                  {commentSuccess ? (
                    <span style={{ color: '#16a34a', fontSize: '12.5px', fontWeight: 700 }}>✓ टिप्पणी सबमिट हो गई (एडमिन सत्यापन के बाद दिखेगी)</span>
                  ) : <span />}
                  <button type="submit" disabled={commentSubmitting} style={{ backgroundColor: primary, color: '#fff', border: 'none', padding: '9px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                    {commentSubmitting ? 'भेजा जा रहा है...' : 'टिप्पणी भेजें'}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px', padding: '22px', textAlign: 'center', marginBottom: '24px' }}>
                <p style={{ fontSize: '13.5px', color: '#475569', margin: '0 0 12px 0' }}>टिप्पणी करने के लिए कृपया पहले लॉगिन करें।</p>
                <Link href="/login" style={{ backgroundColor: primary, color: '#fff', padding: '8px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
                  लॉगिन / रजिस्टर करें
                </Link>
              </div>
            )}

            {/* Comments List */}
            {comments.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                अभी कोई टिप्पणी नहीं है। पहली टिप्पणी आप करें!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {comments.map((c) => (
                  <div key={c.id} style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <b style={{ fontSize: '13px', color: '#0f172a' }}>{c.userName}</b>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>{c.createdAt}</span>
                    </div>
                    <p style={{ fontSize: '13.5px', color: '#334155', margin: 0, lineHeight: 1.5 }}>{c.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── RELATED STORIES ROW ── */}
          {relatedArticles.length > 0 && (
            <section style={{ marginTop: '32px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0', borderLeft: `4px solid ${primary}`, paddingLeft: '10px' }}>
                संबंधित खबरें (Recommended)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                {relatedArticles.map((rel) => (
                  <Link key={rel.id} href={`/article/${rel.id}?site=${siteSlug}`} style={{ textDecoration: 'none', backgroundColor: '#ffffff', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ width: '100%', aspectRatio: '16/10', backgroundColor: '#000', overflow: 'hidden' }}>
                      <img src={rel.image || 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600'} alt={rel.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '12px' }}>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: primary, textTransform: 'uppercase' }}>{rel.category}</span>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '4px 0 0 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {rel.title}
                      </h4>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

        </main>

        {/* ── RIGHT COLUMN: STICKY SIDEBAR (Trending / E-paper / Ads) ── */}
        <aside style={{ position: 'sticky', top: '70px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* E-Paper Promo Widget */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '18px' }}>📰</span>
              <b style={{ fontSize: '15px', color: '#0f172a' }}>आज का डिजिटल ई-पेपर</b>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 12px 0' }}>अपने शहर का आज का संपूर्ण अखबार मोबाइल पर पढ़ें या डाउनलोड करें।</p>
            <Link href={`/epaper?site=${siteSlug}`} style={{ backgroundColor: primary, color: '#fff', textDecoration: 'none', display: 'block', textAlign: 'center', padding: '8px', borderRadius: '6px', fontSize: '12.5px', fontWeight: 700 }}>
              ई-पेपर पढ़ें →
            </Link>
          </div>

          {/* Trending Stories Widget */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <span style={{ color: primary, fontSize: '16px' }}>⚡</span>
              <b style={{ fontSize: '16px', color: '#0f172a' }}>ट्रेंडिंग और ताज़ा खबरें</b>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {trendingArticles.map((tItem, index) => (
                <Link key={tItem.id} href={`/article/${tItem.id}?site=${siteSlug}`} style={{ textDecoration: 'none', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: '#cbd5e1', width: '20px', flexShrink: 0 }}>
                    {index + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h5 style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', margin: '0 0 4px 0', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {tItem.title}
                    </h5>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>👁️ {(tItem.views || 0)} बार पढ़ा गया</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sponsored Ad Slot (300x250 standard) */}
          <div style={{ backgroundColor: '#ffffff', border: '1px dashed #cbd5e1', borderRadius: '12px', height: '260px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '12px', gap: '6px' }}>
            <span>📢</span>
            <b>विज्ञापन स्थान (300 × 250)</b>
            <span style={{ fontSize: '10.5px' }}>संपर्क करें विज्ञापन देने हेतु</span>
          </div>

        </aside>

      </div>

      {/* ── RESPONSIVE MOBILE CSS ── */}
      <style jsx global>{`
        @media (max-width: 992px) {
          .article-grid-layout {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          aside {
            position: static !important;
          }
        }
      `}</style>

      {/* ── FOOTER ── */}
      <Footer siteName={siteName} primaryColor={primary} logoUrl={siteLogo} tagline={siteTagline} />
    </div>
  );
}