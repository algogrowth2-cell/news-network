'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { doc, getDoc, collection, addDoc, query, where, onSnapshot, updateDoc, increment } from 'firebase/firestore';
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

// Fallback site configs
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

  // Active Site State
  const [siteSlug, setSiteSlug] = useState<string>('the-local-leader');
  const [siteConfig, setSiteConfig] = useState<any>(null);

  // Article State
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Comments State
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState('');
  const [readerUser, setReaderUser] = useState<any>(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);

  // 1. Reader Auth Check
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

  // 2. Fetch Article & Identify Exact Portal Slug
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

          // Priority: 1. URL search param (?site=xyz) -> 2. Article ke data me siteId -> 3. default
          const querySite = searchParams.get('site');
          const finalSlug = (querySite || data.siteId || 'the-local-leader').toLowerCase();
          setSiteSlug(finalSlug);

          // Page view count update
          updateDoc(docRef, { views: increment(1) }).catch(() => {});
        }
      } catch (err) {
        console.error('Error fetching article:', err);
      }
      setLoading(false);
    }

    fetchArticle();
  }, [articleId, searchParams]);

  // 3. Live Site Config Fetch based on identified siteSlug
  useEffect(() => {
    if (!siteSlug) return;

    const unsubSite = onSnapshot(doc(db, 'sites', siteSlug), (snap) => {
      if (snap.exists()) {
        setSiteConfig({ slug: siteSlug, ...snap.data() });
      } else {
        const fallback = DEFAULT_SITES_CONFIG[siteSlug] || DEFAULT_SITES_CONFIG['the-local-leader'];
        setSiteConfig({
          slug: siteSlug,
          name: fallback.name,
          primaryColor: fallback.primaryColor,
          logoUrl: `/logos/${siteSlug}.jpeg`,
          description: fallback.description
        });
      }
    });

    return () => unsubSite();
  }, [siteSlug]);

  // 4. Comments for this article
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

    if (!readerUser) {
      alert('कृपया टिप्पणी करने के लिए पहले लॉगिन करें।');
      return;
    }

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
        status: 'pending' // Admin approval required
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

  const primary = siteConfig?.primaryColor || '#ea580c';
  const siteName = siteConfig?.name || 'द लोकल लीडर';
  const siteLogo = siteConfig?.logoUrl || `/logos/${siteSlug}.jpeg`;
  const siteTagline = siteConfig?.description || '— जनता की आवाज़, सच्चाई के साथ —';

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        खबर लोड हो रही है...
      </div>
    );
  }

  if (!article) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <h2>यह खबर उपलब्ध नहीं है।</h2>
        <Link href={`/?site=${siteSlug}`} style={{ color: primary, fontWeight: 700 }}>
          ← मुख्य पृष्ठ पर वापस जाएं
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. TOP PORTAL HEADER (DYNAMIC SITE BRANDING) */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '12px 0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Back to Exact Site Home Button */}
          <Link 
            href={`/?site=${siteSlug}`} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              textDecoration: 'none', 
              color: primary, 
              fontWeight: 800, 
              fontSize: '14px' 
            }}
          >
            <span>←</span>
            <span>{siteName}</span>
          </Link>

          <div style={{ fontSize: '11.5px', color: '#64748b' }}>
            {article.createdAt || '2026-09-05'}
          </div>
        </div>
      </header>

      {/* 2. ARTICLE CONTENT CONTAINER */}
      <main style={{ maxWidth: '1000px', margin: '24px auto', padding: '0 16px', width: '100%', boxSizing: 'border-box', flex: 1 }}>
        
        {/* Category Tag */}
        <div style={{ marginBottom: '12px' }}>
          <span style={{ background: primary, color: '#ffffff', fontSize: '11px', fontWeight: 800, padding: '4px 10px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {article.category || 'National'}
          </span>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 'clamp(22px, 3.5vw, 32px)', fontWeight: 900, color: '#0f172a', lineHeight: '1.3', margin: '0 0 16px 0' }}>
          {article.title}
        </h1>

        {/* Author & Stats Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px', fontSize: '12.5px', color: '#64748b' }}>
          <div>
            लेखक: <b style={{ color: '#1e293b' }}>{article.authorName || siteName}</b>
          </div>
          <div>
            👁️ {(article.views || 1).toLocaleString()} बार पढ़ा गया
          </div>
        </div>

        {/* Main Hero Image */}
        {article.image && (
          <div style={{ width: '100%', maxHeight: '480px', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px', background: '#0f172a' }}>
            <img 
              src={article.image} 
              alt={article.title} 
              style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '480px' }} 
            />
          </div>
        )}

        {/* Summary Lead Paragraph */}
        {article.summary && (
          <div style={{ borderLeft: `4px solid ${primary}`, paddingLeft: '16px', margin: '20px 0', fontSize: '15px', fontStyle: 'normal', color: '#334155', fontWeight: 600, lineHeight: '1.6' }}>
            {article.summary}
          </div>
        )}

        {/* Full Content Body */}
        <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#1e293b', whiteSpace: 'pre-line', margin: '24px 0' }}>
          {article.content || article.summary || 'खबर का विस्तृत विवरण जल्द ही उपलब्ध कराया जाएगा।'}
        </div>

        {/* 3. COMMENTS & DISCUSSION SECTION */}
        <div style={{ marginTop: '40px', paddingTop: '24px', borderTop: '2px solid #f1f5f9' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
            पाठकों की टिप्पणियां ({comments.length})
          </h3>

          {/* Comment Form / Login Prompt */}
          {readerUser ? (
            <form onSubmit={handlePostComment} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                टिप्पणी कर रहे हैं: <b style={{ color: primary }}>{readerUser.name || readerUser.email}</b>
              </div>
              <textarea
                required
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="इस खबर पर अपनी राय लिखें..."
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={commentSubmitting}
                  style={{ background: primary, color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '6px', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer' }}
                >
                  {commentSubmitting ? 'भेजा जा रहा है...' : 'टिप्पणी भेजें'}
                </button>
              </div>
              {commentSuccess && (
                <div style={{ marginTop: '10px', color: '#059669', fontSize: '12px', fontWeight: 600 }}>
                  ✓ आपकी टिप्पणी भेज दी गई है। एडमिन द्वारा स्वीकृति के बाद यह लाइव दिखाई देगी।
                </div>
              )}
            </form>
          ) : (
            <div style={{ background: '#fff7ed', border: `1px solid ${primary}40`, padding: '16px', borderRadius: '8px', textAlign: 'center', marginBottom: '24px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#9a3412', fontWeight: 600 }}>
                इस खबर पर अपनी राय रखने के लिए कृपया लॉगिन करें
              </p>
              <Link 
                href="/login" 
                style={{ display: 'inline-block', background: primary, color: '#fff', padding: '6px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, textDecoration: 'none' }}
              >
                लॉगिन करें / रजिस्टर करें
              </Link>
            </div>
          )}

          {/* Comments List */}
          {comments.length === 0 ? (
            <div style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
              अभी इस लेख पर कोई स्वीकृत टिप्पणी नहीं है। पहली टिप्पणी करें!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {comments.map((c) => (
                <div key={c.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '12.5px', color: '#1e293b' }}>👤 {c.userName}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{c.createdAt}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>{c.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* 4. EXACT MATCH DYNAMIC FOOTER */}
      <Footer 
        siteName={siteName} 
        primaryColor={primary}
        logoUrl={siteLogo}
        tagline={siteTagline}
      />

    </div>
  );
}