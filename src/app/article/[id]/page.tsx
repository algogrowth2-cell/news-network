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

  const [siteSlug, setSiteSlug] = useState<string>('the-local-leader');
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [article, setArticle] = useState<ArticleDetail | null>(null);
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

  const primary = siteConfig?.primaryColor || '#ea580c';
  const siteName = siteConfig?.name || 'द लोकल लीडर';
  const siteLogo = siteConfig?.logoUrl || `/logos/${siteSlug}.jpeg`;
  const siteTagline = siteConfig?.description || '— जनता की आवाज़, सच्चाई के साथ —';

  // CSS custom property for dynamic primary color
  const cssVars = { '--ap-primary': primary } as React.CSSProperties;

  if (loading) {
    return (
      <div className="ap-loader-screen">
        <style jsx global>{`${globalCSS}`}</style>
        <div className="ap-loader-pulse" />
        <span className="ap-loader-text">खबर लोड हो रही है…</span>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="ap-empty-screen">
        <style jsx global>{`${globalCSS}`}</style>
        <div className="ap-empty-icon">📰</div>
        <h2 className="ap-empty-title">यह खबर उपलब्ध नहीं है</h2>
        <p className="ap-empty-desc">शायद यह खबर हटा दी गई है या लिंक गलत है।</p>
        <Link href={`/?site=${siteSlug}`} className="ap-empty-back" style={{ background: primary }}>
          ← मुख्य पृष्ठ पर वापस जाएं
        </Link>
      </div>
    );
  }

  return (
    <div className="ap-page" style={cssVars}>
      <style jsx global>{`${globalCSS}`}</style>

      {/* ─── STICKY HEADER ─── */}
      <header className="ap-header">
        <div className="ap-header-inner">
          <Link href={`/?site=${siteSlug}`} className="ap-header-back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            <span>{siteName}</span>
          </Link>
          <time className="ap-header-date">{article.createdAt || '2026-09-05'}</time>
        </div>
      </header>

      {/* ─── ARTICLE ─── */}
      <main className="ap-main">
        <article className="ap-article">

          {/* Category Pill */}
          <div className="ap-category-row">
            <span className="ap-category-pill" style={{ background: primary }}>
              {article.category || 'National'}
            </span>
          </div>

          {/* Title */}
          <h1 className="ap-title">{article.title}</h1>

          {/* Meta Row */}
          <div className="ap-meta-row">
            <div className="ap-meta-author">
              <span className="ap-meta-author-avatar" style={{ background: primary }}>
                {(article.authorName || siteName).charAt(0)}
              </span>
              <div className="ap-meta-author-info">
                <span className="ap-meta-author-name">{article.authorName || siteName}</span>
                <span className="ap-meta-author-label">लेखक</span>
              </div>
            </div>
            <div className="ap-meta-views">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>{(article.views || 1).toLocaleString()}</span>
            </div>
          </div>

          {/* Hero Image */}
          {article.image && (
            <figure className="ap-hero">
              <img
                src={article.image}
                alt={article.title}
                className="ap-hero-img"
              />
            </figure>
          )}

          {/* Summary */}
          {article.summary && (
            <blockquote className="ap-summary" style={{ borderColor: primary }}>
              {article.summary}
            </blockquote>
          )}

          {/* Body Content */}
          <div className="ap-body">
            {article.content || article.summary || 'खबर का विस्तृत विवरण जल्द ही उपलब्ध कराया जाएगा।'}
          </div>

        </article>

        {/* ─── COMMENTS ─── */}
        <section className="ap-comments">
          <div className="ap-comments-head">
            <h3 className="ap-comments-title">
              पाठकों की टिप्पणियां
              <span className="ap-comments-count">{comments.length}</span>
            </h3>
          </div>

          {/* Comment Form or Login Prompt */}
          {readerUser ? (
            <form onSubmit={handlePostComment} className="ap-comment-form">
              <div className="ap-comment-form-user">
                <span className="ap-comment-form-avatar" style={{ background: primary }}>
                  {(readerUser.name || readerUser.email || 'प').charAt(0)}
                </span>
                <span className="ap-comment-form-name">{readerUser.name || readerUser.email}</span>
              </div>
              <textarea
                required
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="इस खबर पर अपनी राय लिखें…"
                className="ap-comment-textarea"
              />
              <div className="ap-comment-form-actions">
                {commentSuccess && (
                  <span className="ap-comment-success">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                    टिप्पणी भेज दी गई — एडमिन स्वीकृति के बाद दिखेगी
                  </span>
                )}
                <button
                  type="submit"
                  disabled={commentSubmitting}
                  className="ap-comment-submit"
                  style={{ background: primary }}
                >
                  {commentSubmitting ? (
                    <>
                      <span className="ap-btn-spinner" />
                      भेजा जा रहा है…
                    </>
                  ) : (
                    'टिप्पणी भेजें'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="ap-login-prompt">
              <div className="ap-login-prompt-icon">💬</div>
              <p className="ap-login-prompt-text">
                इस खबर पर अपनी राय रखने के लिए कृपया लॉगिन करें
              </p>
              <Link
                href="/login"
                className="ap-login-prompt-btn"
                style={{ background: primary }}
              >
                लॉगिन करें / रजिस्टर करें
              </Link>
            </div>
          )}

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="ap-comments-empty">
              अभी इस लेख पर कोई स्वीकृत टिप्पणी नहीं है। पहली टिप्पणी करें!
            </div>
          ) : (
            <div className="ap-comments-list">
              {comments.map((c) => (
                <div key={c.id} className="ap-comment-card">
                  <div className="ap-comment-card-head">
                    <div className="ap-comment-card-user">
                      <span className="ap-comment-card-avatar">
                        {c.userName.charAt(0)}
                      </span>
                      <span className="ap-comment-card-name">{c.userName}</span>
                    </div>
                    <time className="ap-comment-card-date">{c.createdAt}</time>
                  </div>
                  <p className="ap-comment-card-body">{c.comment}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <Footer
        siteName={siteName}
        primaryColor={primary}
        logoUrl={siteLogo}
        tagline={siteTagline}
      />
    </div>
  );
}


/* ═══════════════════════════════════════════════════════
   ALL CSS — injected via <style jsx global>
   ═══════════════════════════════════════════════════════ */
const globalCSS = `

/* ── Reset ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Page Shell ── */
.ap-page {
  min-height: 100vh;
  background: #fafbfc;
  color: #0f172a;
  font-family: 'Noto Sans Devanagari', 'Inter', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  display: flex;
  flex-direction: column;
  -webkit-font-smoothing: antialiased;
}

/* ── Loading Screen ── */
.ap-loader-screen {
  min-height: 100vh;
  background: #fafbfc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: 'Noto Sans Devanagari', 'Inter', system-ui, sans-serif;
}
.ap-loader-pulse {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e2e8f0;
  animation: apPulse 1s ease-in-out infinite;
  margin-bottom: 16px;
}
@keyframes apPulse {
  0%, 100% { transform: scale(0.85); opacity: 0.4; }
  50% { transform: scale(1); opacity: 1; }
}
.ap-loader-text {
  font-size: 13.5px;
  color: #94a3b8;
  font-weight: 500;
}

/* ── Empty / 404 Screen ── */
.ap-empty-screen {
  min-height: 100vh;
  background: #fafbfc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  text-align: center;
  font-family: 'Noto Sans Devanagari', 'Inter', system-ui, sans-serif;
}
.ap-empty-icon { font-size: 48px; margin-bottom: 4px; opacity: 0.6; }
.ap-empty-title { font-size: 20px; font-weight: 800; color: #1e293b; }
.ap-empty-desc { font-size: 14px; color: #64748b; max-width: 340px; }
.ap-empty-back {
  display: inline-block;
  margin-top: 8px;
  color: #fff;
  padding: 10px 22px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  transition: opacity 0.15s;
}
.ap-empty-back:hover { opacity: 0.88; }

/* ── Sticky Header ── */
.ap-header {
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid #eef1f5;
  position: sticky;
  top: 0;
  z-index: 100;
}
.ap-header-inner {
  max-width: 780px;
  margin: 0 auto;
  padding: 11px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.ap-header-back {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  text-decoration: none;
  color: var(--ap-primary);
  font-weight: 700;
  font-size: 14px;
  padding: 5px 10px 5px 6px;
  border-radius: 8px;
  transition: background 0.15s;
}
.ap-header-back:hover {
  background: rgba(0,0,0,0.03);
}
.ap-header-back svg { flex-shrink: 0; }
.ap-header-date {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

/* ── Main Container ── */
.ap-main {
  max-width: 780px;
  width: 100%;
  margin: 0 auto;
  padding: 28px 20px 48px;
  flex: 1;
}

/* ── Article ── */
.ap-article {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #eef1f5;
  padding: clamp(20px, 4vw, 40px);
  box-shadow: 0 1px 3px rgba(0,0,0,0.03), 0 6px 24px rgba(0,0,0,0.02);
}

/* Category */
.ap-category-row { margin-bottom: 14px; }
.ap-category-pill {
  display: inline-block;
  color: #ffffff;
  font-size: 10.5px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 5px;
  letter-spacing: 0.3px;
}

/* Title */
.ap-title {
  font-size: clamp(22px, 4vw, 34px);
  font-weight: 900;
  color: #0c1222;
  line-height: 1.32;
  margin: 0 0 20px;
  letter-spacing: -0.3px;
}

/* Meta Row */
.ap-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 18px;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 22px;
  gap: 12px;
  flex-wrap: wrap;
}
.ap-meta-author {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ap-meta-author-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
}
.ap-meta-author-info {
  display: flex;
  flex-direction: column;
}
.ap-meta-author-name {
  font-size: 13.5px;
  font-weight: 650;
  color: #1e293b;
  line-height: 1.2;
}
.ap-meta-author-label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}
.ap-meta-views {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  color: #94a3b8;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}
.ap-meta-views svg { color: #cbd5e1; }

/* Hero Image */
.ap-hero {
  width: calc(100% + clamp(40px, 8vw, 80px));
  margin-left: calc(-1 * clamp(20px, 4vw, 40px));
  margin-bottom: 24px;
  overflow: hidden;
  background: #0f172a;
  max-height: 480px;
}
.ap-hero-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  max-height: 480px;
  display: block;
}

/* Summary Blockquote */
.ap-summary {
  border-left: 4px solid;
  padding: 14px 18px;
  margin: 0 0 24px;
  font-size: 15.5px;
  font-weight: 600;
  color: #334155;
  line-height: 1.65;
  background: #f8fafc;
  border-radius: 0 10px 10px 0;
}

/* Body */
.ap-body {
  font-size: 16.5px;
  line-height: 1.85;
  color: #1e293b;
  white-space: pre-line;
}

/* ── Comments Section ── */
.ap-comments {
  margin-top: 36px;
}
.ap-comments-head {
  margin-bottom: 18px;
}
.ap-comments-title {
  font-size: 17px;
  font-weight: 800;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 8px;
}
.ap-comments-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  background: #f1f5f9;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  border-radius: 6px;
  padding: 0 7px;
}

/* Comment Form */
.ap-comment-form {
  background: #ffffff;
  border: 1px solid #eef1f5;
  border-radius: 12px;
  padding: 18px;
  margin-bottom: 22px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}
.ap-comment-form-user {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 12px;
}
.ap-comment-form-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}
.ap-comment-form-name {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}
.ap-comment-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 13.5px;
  font-family: inherit;
  color: #1e293b;
  outline: none;
  resize: vertical;
  min-height: 76px;
  transition: border-color 0.15s, box-shadow 0.15s;
  background: #fafbfc;
}
.ap-comment-textarea:focus {
  border-color: var(--ap-primary);
  box-shadow: 0 0 0 3px rgba(0,0,0,0.04);
  background: #fff;
}
.ap-comment-textarea::placeholder { color: #94a3b8; }
.ap-comment-form-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
  flex-wrap: wrap;
}
.ap-comment-success {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: #059669;
  animation: apFadeIn 0.3s ease;
}
@keyframes apFadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
.ap-comment-submit {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #fff;
  border: none;
  padding: 9px 20px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 12.5px;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
}
.ap-comment-submit:hover { opacity: 0.9; }
.ap-comment-submit:active { transform: scale(0.97); }
.ap-comment-submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
.ap-btn-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: apSpin 0.6s linear infinite;
}
@keyframes apSpin { to { transform: rotate(360deg); } }

/* Login Prompt */
.ap-login-prompt {
  background: #ffffff;
  border: 1px solid #eef1f5;
  border-radius: 12px;
  padding: 28px 20px;
  text-align: center;
  margin-bottom: 22px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}
.ap-login-prompt-icon { font-size: 28px; margin-bottom: 8px; opacity: 0.7; }
.ap-login-prompt-text {
  font-size: 13.5px;
  color: #475569;
  font-weight: 600;
  margin: 0 0 14px;
  line-height: 1.5;
}
.ap-login-prompt-btn {
  display: inline-block;
  color: #fff;
  padding: 9px 22px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 700;
  text-decoration: none;
  transition: opacity 0.15s;
}
.ap-login-prompt-btn:hover { opacity: 0.88; }

/* Comments Empty */
.ap-comments-empty {
  color: #94a3b8;
  font-size: 13.5px;
  text-align: center;
  padding: 32px 16px;
  background: #fff;
  border: 1px dashed #e2e8f0;
  border-radius: 12px;
}

/* Comments List */
.ap-comments-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ap-comment-card {
  background: #ffffff;
  border: 1px solid #eef1f5;
  border-radius: 12px;
  padding: 14px 16px;
  transition: border-color 0.15s;
}
.ap-comment-card:hover {
  border-color: #dde3eb;
}
.ap-comment-card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}
.ap-comment-card-user {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ap-comment-card-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}
.ap-comment-card-name {
  font-weight: 650;
  font-size: 13px;
  color: #1e293b;
}
.ap-comment-card-date {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.ap-comment-card-body {
  font-size: 13.5px;
  color: #334155;
  line-height: 1.6;
  margin: 0;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .ap-main { padding: 16px 12px 40px; }
  .ap-article { padding: 16px; border-radius: 12px; }
  .ap-hero {
    width: calc(100% + 32px);
    margin-left: -16px;
    border-radius: 0;
  }
  .ap-meta-row { flex-direction: column; align-items: flex-start; gap: 8px; }
  .ap-comment-form { padding: 14px; }
  .ap-comment-form-actions { flex-direction: column; align-items: stretch; }
  .ap-comment-submit { justify-content: center; }
}

@media (max-width: 380px) {
  .ap-main { padding: 10px 8px 32px; }
  .ap-article { padding: 14px; }
  .ap-title { font-size: 20px; }
  .ap-header-inner { padding: 10px 12px; }
}
`;